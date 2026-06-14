"""
SalesGPT - SaaS Onboarding Workflow
This module defines the LangGraph workflow that interviews the business owner
and dynamically generates their customized Sales Persona system prompt.
"""

import os
from typing import TypedDict, List, Dict, Any
from langgraph.graph import StateGraph, START, END
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from supabase import create_client, Client

from backend.utils import get_logger

logger = get_logger(__name__)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if SUPABASE_URL and SUPABASE_KEY:
    supabase_client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
else:
    supabase_client = None

# We use the global API key since this is SaaS
llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0.7,
    max_tokens=1024,
    api_key=os.getenv("GROQ_API_KEY")
)

class OnboardingState(TypedDict):
    agent_id: str
    chat_history: List[Dict[str, str]]
    status: str # "interviewing" or "completed"
    generated_persona: str

async def interviewer_node(state: OnboardingState) -> dict:
    """The LLM that interviews the business owner to gather details."""
    logger.info("Running onboarding interviewer for tenant %s", state["agent_id"])
    
    system_prompt = """You are an expert AI Business Analyst.
Your goal is to interview a business owner to gather utmost information to create a highly effective AI Sales Representative persona for their website.
You must ask at least 8 to 10 probing questions to get a complete picture.

You need to know:
1. What does the business sell? (Products/Services - get specific details)
2. Who is their target customer? (Demographics, pain points)
3. What is the tone of the brand? (e.g., Professional, Playful, Urgent)
4. What is the primary goal of the chatbot? (e.g., Collect emails, Book meetings, Answer FAQs)
5. What are the most common objections they face?
6. What is their unique value proposition?
7. What language(s) should the AI speak? (Options: English, Tamil, Malayalam, Telugu, Kannada, Hindi, or a combination/Hinglish/Tanglish).

RULES:
- Ask ONE or TWO questions at a time max.
- Be conversational and encouraging.
- Dig deeper if they give a short answer.
- Once you have gathered sufficient information on all points (usually after 8-10 turns), reply EXACTLY with the phrase: "INTERVIEW_COMPLETE". Do not add any other text when you are done.
"""
    
    messages = [SystemMessage(content=system_prompt)]
    for msg in state["chat_history"]:
        if msg["role"] == "user":
            messages.append(HumanMessage(content=msg["content"]))
        else:
            messages.append(AIMessage(content=msg["content"]))
            
    response = llm.invoke(messages)
    reply_text = response.content.strip()
    
    if "INTERVIEW_COMPLETE" in reply_text.upper():
        return {"status": "completed", "chat_history": state["chat_history"]}
    
    new_history = list(state["chat_history"])
    new_history.append({"role": "assistant", "content": reply_text})
    
    return {"status": "interviewing", "chat_history": new_history}


async def generator_node(state: OnboardingState) -> dict:
    """The LLM that generates the final persona prompt and profile based on the interview."""
    logger.info("Generating final persona for tenant %s", state["agent_id"])
    
    system_prompt = """You are an expert AI Prompt Engineer and Business Analyst.
Based on the following interview transcript with a business owner, you must generate a complete Agent Profile in JSON format.

The JSON MUST contain exactly these 4 keys:
1. "persona_prompt": An extremely detailed, highly optimized SYSTEM INSTRUCTION PROMPT (4-5 paragraphs) covering the AI's role, company background, primary goal, precise tone, objection handling, unique value propositions, and exact language preference.
2. "company_name": A short name for the business (e.g. "Acme Corp").
3. "description": A 1-2 sentence description of what the business does and how the agent helps.
4. "quick_questions": A list of exactly 4 short, catchy questions the user might click to start a conversation (e.g. ["Pricing", "Features", "SLA", "Contact Sales"]).

Make the persona_prompt sound like a top-tier enterprise prompt. It should be rich and thorough, covering every aspect of the company discussed.
RULES for persona_prompt:
1. Answer questions concisely using ONLY the provided knowledge base context. If unknown, say so.
2. Try to move the conversation forward naturally to the next sales stage.
3. Keep responses under 3 sentences to maintain engagement.
4. Adapt your language to the user if they mix English and the regional language.

Output ONLY valid JSON. Do not include any markdown formatting like ```json."""

    transcript = ""
    for msg in state["chat_history"]:
        transcript += f"{msg['role'].upper()}: {msg['content']}\\n"
        
    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=f"INTERVIEW TRANSCRIPT:\\n{transcript}")
    ]
    
    response = llm.invoke(messages)
    reply = response.content.strip()
    
    import json
    import re
    
    # Try to parse JSON
    try:
        # Strip markdown block if present
        if reply.startswith("```json"):
            reply = reply[7:-3]
        elif reply.startswith("```"):
            reply = reply[3:-3]
            
        data = json.loads(reply.strip())
        persona = data.get("persona_prompt", "")
        company_name = data.get("company_name", "New Business")
        description = data.get("description", "I'm an AI assistant.")
        quick_questions = data.get("quick_questions", [])
    except Exception as e:
        logger.error(f"Failed to parse JSON from generator: {e}\\n{reply}")
        persona = reply
        company_name = "New Business"
        description = "AI Sales Agent"
        quick_questions = []
    
    # Save to database
    if supabase_client:
        update_data = {
            "persona_prompt": persona,
            "onboarding_status": "completed",
            "company_name": company_name,
            "description": description,
            "quick_questions": quick_questions
        }
        supabase_client.table("agents").update(update_data).eq("id", state["agent_id"]).execute()
        
    return {"generated_persona": persona}

def route_next_step(state: OnboardingState) -> str:
    if state["status"] == "completed":
        return "generator"
    return END

def build_onboarding_graph():
    workflow = StateGraph(OnboardingState)
    
    workflow.add_node("interviewer", interviewer_node)
    workflow.add_node("generator", generator_node)
    
    workflow.add_edge(START, "interviewer")
    workflow.add_conditional_edges("interviewer", route_next_step)
    workflow.add_edge("generator", END)
    
    return workflow.compile()

onboarding_graph = build_onboarding_graph()

async def run_onboarding(agent_id: str, chat_history: List[Dict[str, str]]) -> Dict:
    state = {
        "agent_id": agent_id,
        "chat_history": chat_history,
        "status": "interviewing",
        "generated_persona": ""
    }
    result = await onboarding_graph.ainvoke(state)
    return result
