import os
from typing import List, Dict, Any
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langgraph.prebuilt import create_react_agent
from psycopg_pool import AsyncConnectionPool
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver

from langchain_core.tools import tool
from supabase import create_client, Client
from backend.utils import get_logger
from dotenv import load_dotenv
from langchain_huggingface import HuggingFaceEndpointEmbeddings

load_dotenv()
logger = get_logger(__name__)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY")
CHAT_MODEL = os.getenv("CHAT_MODEL", "llama-3.3-70b-versatile")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
TOP_K_RESULTS = int(os.getenv("TOP_K_RESULTS", "5"))

supabase_client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
embeddings = HuggingFaceEndpointEmbeddings(
    model=EMBEDDING_MODEL,
    huggingfacehub_api_token=HUGGINGFACE_API_KEY,
)

chat_model = ChatGroq(
    groq_api_key=GROQ_API_KEY,
    model_name=CHAT_MODEL,
    temperature=0.7,
    max_tokens=800
)

# We use a global variable to pass the current agent_id to the tool since tools in LangChain don't natively get the request context easily.
# In a robust async environment, we'd use contextvars.
import contextvars
current_agent_id = contextvars.ContextVar("current_agent_id", default="")

@tool
def search_knowledge_base(query: str) -> str:
    """Search the company's knowledge base for facts, pricing, SLAs, technical specs, or general information."""
    agent_id = current_agent_id.get()
    if not agent_id:
        return "Error: agent_id not set in context."
        
    logger.info(f"ReAct Tool: Searching KB for '{query}' (agent: {agent_id})")
    
    query_embedding = embeddings.embed_query(query)
    
    result = supabase_client.rpc(
        "match_documents",
        {"query_embedding": query_embedding, "p_agent_id": agent_id, "match_count": TOP_K_RESULTS},
    ).execute()
    
    docs_data = result.data or []
    if not docs_data:
        return "No specific documentation found in the knowledge base."
        
    context_parts = []
    for doc in docs_data:
        context_parts.append(doc.get("content", ""))
    
    return "\n\n".join(context_parts)

tools = [search_knowledge_base]


DATABASE_URL = os.getenv("DATABASE_URL")

pool = None
checkpointer = None

async def init_agent_memory():
    global pool, checkpointer
    logger.info("Initializing LangGraph Postgres Checkpointer...")
    pool = AsyncConnectionPool(
        conninfo=DATABASE_URL,
        kwargs={"autocommit": True, "prepare_threshold": 0}
    )
    await pool.open()
    checkpointer = AsyncPostgresSaver(pool)
    await checkpointer.setup()
    logger.info("LangGraph persistent memory is ready.")

async def close_agent_memory():
    global pool
    if pool:
        await pool.close()


async def run_smart_chat(agent_id: str, session_id: str, message: str) -> str:
    """
    Run the LangGraph ReAct agent.
    """
    # Set contextvar for the tool
    current_agent_id.set(agent_id)
    
    # 1. Fetch Agent Identity
    agent_resp = supabase_client.table("agents").select("company_name, persona_prompt").eq("id", agent_id).execute()
    if not agent_resp.data:
        return "Error: Agent not found."
    
    agent_data = agent_resp.data[0]
    company_name = agent_data.get("company_name", "Our Company")
    persona_prompt = agent_data.get("persona_prompt", "You are a helpful AI assistant.")
    
    # 2. Fetch Lead Profile (if known)
    known_info = "New conversation - no info yet."
    try:
        lead_result = supabase_client.table("leads").select("company,email,name,role").eq("session_id", session_id).execute()
        if lead_result.data:
            lead = lead_result.data[0]
            known = [f"{k.title()}: {lead[k]}" for k in ("name", "company", "email", "role") if lead.get(k) and str(lead[k]).strip()]
            if known:
                known_info = " | ".join(known)
    except Exception as exc:
        logger.warning(f"Failed to fetch lead profile: {exc}")
    
    # 3. Construct dynamic system prompt
    system_prompt = f"""You are an AI Sales Representative for {company_name}.

YOUR PERSONA:
{persona_prompt}

WHAT YOU KNOW ABOUT THIS USER:
{known_info}

CORE INSTRUCTIONS:
1. HELP FIRST: Answer questions directly using the `search_knowledge_base` tool. Always search the knowledge base before answering technical or pricing questions!
2. You MUST use the `search_knowledge_base` tool to find exact numbers, prices, and features. DO NOT HALLUCINATE.
3. Be concise and conversational (2-3 sentences max).
4. If the user asks for an email/quotation, DO NOT SAY "I've sent it". Instead say "Our team will send it within 24 hours". Ask for their name, role, company, and email if you don't have it.
"""
    
    # 4. Invoke Agent with Persistent Memory
    logger.info(f"Invoking ReAct agent for session {session_id}")
    
    # Instantiate agent per request to inject the dynamic system prompt
    agent = create_react_agent(chat_model, tools=tools, checkpointer=checkpointer, state_modifier=system_prompt)
    
    config = {"configurable": {"thread_id": session_id}}
    result = await agent.ainvoke({"messages": [HumanMessage(content=message)]}, config=config)
    
    # The last message is the AI's final response
    final_response = result["messages"][-1].content
    return final_response
