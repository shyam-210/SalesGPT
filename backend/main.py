"""
SalesGPT - FastAPI Backend
Clean RAG Implementation with Dual-Track System

Fast Track: RAG chat (<1.5s response)
Slow Track: Judge Agent + Extractor (async background)
"""

import os
import json
import re
import traceback
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import List

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from langchain_groq import ChatGroq
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.messages import SystemMessage
from supabase import create_client, Client

from backend.judge import analyze_lead
from backend.extractor import extract_lead_data
from backend.email_intent_prompts import build_email_prompt
from backend.cron import apply_time_decay
from backend.utils import get_logger, extract_json

load_dotenv()

logger = get_logger(__name__)

# ============================================
# Configuration
# ============================================

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
CHAT_MODEL = os.getenv("CHAT_MODEL", "llama-3.3-70b-versatile")
EMAIL_MODEL = os.getenv("EMAIL_MODEL", "llama-3.1-8b-instant")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
TOP_K_RESULTS = int(os.getenv("TOP_K_RESULTS", "3"))
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000"
).split(",")

if not all([SUPABASE_URL, SUPABASE_KEY, GROQ_API_KEY]):
    raise ValueError("Missing required environment variables: SUPABASE_URL, SUPABASE_KEY, GROQ_API_KEY")

# ============================================
# Initialize FastAPI (lifespan replaces deprecated on_event)
# ============================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup / shutdown lifecycle."""
    logger.info("=" * 50)
    logger.info("SalesGPT API Starting...")
    logger.info("Supabase : %s", SUPABASE_URL)
    logger.info("Chat Model : %s", CHAT_MODEL)
    logger.info("Email Model : %s", EMAIL_MODEL)
    logger.info("Embedding : %s", EMBEDDING_MODEL)
    logger.info("Docs: http://localhost:8000/docs")
    logger.info("=" * 50)
    yield
    logger.info("SalesGPT API shutting down.")


app = FastAPI(
    title="SalesGPT API",
    description="Dual-track lead qualification system",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# Initialize AI Models
# ============================================

logger.info("Initializing Groq chat model (70B versatile)...")
chat_model = ChatGroq(
    groq_api_key=GROQ_API_KEY,
    model_name=CHAT_MODEL,
    temperature=0.7,
    max_tokens=800  # 70B model can leverage more tokens for detailed responses
)
logger.info("Chat model ready: %s", CHAT_MODEL)

logger.info("Initializing email model (fast 8B)...")
email_model = ChatGroq(
    groq_api_key=GROQ_API_KEY,
    model_name=EMAIL_MODEL,
    temperature=0.3,  # Low temp for accurate, grounded email content
    max_tokens=1024,
)
logger.info("Email model ready: %s", EMAIL_MODEL)

logger.info("Loading embedding model...")
embeddings = HuggingFaceEmbeddings(
    model_name=EMBEDDING_MODEL,
    model_kwargs={"device": "cpu"},
    encode_kwargs={"normalize_embeddings": True},
)
logger.info("Embedding model loaded: %s", EMBEDDING_MODEL)

logger.info("Connecting to Supabase...")
supabase_client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
logger.info("Supabase client initialized")

# In-memory chat history (keyed by session_id)
chat_sessions: dict[str, list[dict]] = {}
logger.info("Chat session storage initialized")

# ============================================
# Pydantic Models
# ============================================

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4096)
    session_id: str = Field(..., min_length=1, max_length=128)

class ChatResponse(BaseModel):
    response: str
    sources: List[str]

class DraftEmailRequest(BaseModel):
    session_id: str = Field(..., min_length=1, max_length=128)

class DraftEmailResponse(BaseModel):
    subject: str
    body: str

class UpdateLeadStatusRequest(BaseModel):
    pipeline_status: str = Field(
        ...,
        pattern=r"^(Visitor|Engaged|Qualified|Hot Lead|Approached)$",
        description="Must be one of the valid pipeline stages",
    )


# ============================================
# System Prompt - Help First, Qualify Last
# ============================================

SYSTEM_PROMPT = """You are a cloud infrastructure expert at Team Defaulters.

YOUR MISSION: Help users solve their cloud infrastructure problems with expert advice.

===========================================================
WHAT YOU KNOW ABOUT THIS USER:
{known_info}

CONVERSATION HISTORY:
{history}

KNOWLEDGE BASE:
{context}
===========================================================

CORE PRINCIPLE: HELP FIRST, QUALIFY LAST

You are an EXPERT FIRST, a salesperson second. When someone asks a technical question:
1. ANSWER IT with specific, actionable details
2. Use the knowledge base to give real specs, prices, features
3. Show your expertise
4. Build trust by being genuinely helpful

[ERROR] WRONG APPROACH:
User: "I need resources to deploy LLMs"
You: "What's your company name?"  ← PUSHY, NOT HELPFUL

[OK] RIGHT APPROACH:
User: "I need resources to deploy LLMs"
You: "For deploying large language models, you'll want our GPU instances. Our G1.large ($3,625/month) has NVIDIA Tesla V100, 8 vCPUs, and 16GB RAM - ideal for inference workloads. For larger models, we have G1.xlarge with A100 GPUs. What size models are you deploying?"

===========================================================

DATA COLLECTION STRATEGY:

[TARGET] **Natural Questions** (woven into helping):
- "What size models are you deploying?" (to give better rec)
- "Are you training or just inference?" (to understand needs)
- "How many requests per second are you expecting?" (to size correctly)

These feel like EXPERT CURIOSITY, not sales interrogation.

[NO] **Don't Ask Directly** (unless conversation is ending):
- "What company are you with?"
- "What's your email?"
- "What's your role?"

[EMAIL] **When User Asks to Send/Mail Something:**

CRITICAL: Collect ALL 4 details in ONE natural question:
1. Name
2. Role
3. Company
4. Email

Example Flow:
User: "Can you mail me the pricing?"
You: "I'd be happy to send you the detailed pricing. Could you share your name, role, company, and email address?"

User: "I'm Shyam, CTO at ChainAI, shyam@chainai.com"
You: "Perfect, Shyam! Our team will send the enterprise pricing details to shyam@chainai.com within 24 hours."

IMPORTANT:
- Ask for ALL 4 fields together in one natural question
- DO NOT say "I've sent" or "I'll send" - you cannot send emails
- ALWAYS say "Our team will send... within 24 hours"
- Confirm what you'll send and to which email

===========================================================

MEMORY & CONTEXT:

Use what you learned naturally:
- "For the LLM deployment you mentioned..." 
- "Since you're working on AI infrastructure..."
- "Based on your startup needs..."

Don't ask for info you already have!

===========================================================

CONVERSATION EXAMPLES:

Example 1 - LLM Deployment (GOOD):
User: "I need resources to deploy my LLMs"
You: "For LLM deployment, you'll want GPU instances. Our G1.large ($3,625/month) with NVIDIA Tesla V100 is great for inference. It has 8 vCPUs, 16GB RAM, and 200GB SSD. For larger models like GPT-3 size, you'd want G1.xlarge with A100 GPUs. What size models are you working with?"

Example 2 - Startup Inquiry (GOOD):
User: "Do you have startup programs?"
You: "Yes! Our Startup Program gives you $5,000 in cloud credits, 12 months of free Professional Support, and access to our startup community with private Slack and monthly webinars. It's designed for early-stage companies. If you're interested, I can send you the application link and eligibility details - what's your email?"

Example 3 - Using Memory (GOOD):
User: "Tell me about your plans"
You: [explains plans]
User: "What about the startup one?"
You: "The Startup Program I mentioned gives $5K in credits for companies that haven't raised beyond Series A. This would be perfect for the AI startup you mentioned earlier. The credits work for any service - GPU instances, storage, bandwidth. You can apply at startups.teamdefaulters.com/apply."

===========================================================

CRITICAL ANTI-HALLUCINATION RULES:

[NO] **YOU CANNOT SEND EMAILS** - You are a chatbot, not an email system!

When user asks for email/quotation:
[ERROR] NEVER SAY: "I've sent you...", "I'll send you...", "Email sent to..."
[OK] ALWAYS SAY: "Our team will send you... within 24 hours"

EXAMPLES:

User: "Can you email me the details?"
You: "Our team will send detailed specs and pricing to [email] within 24 hours."
[ERROR] NOT: "I've sent you the details" or "I'll email you now"

User: "Send me a quotation"
You collect email, then say:
You: "Our team will send a detailed quotation to [email] within 24 hours, including pricing, specs, and startup credits."
[ERROR] NOT: "I've sent the quotation to your email"

User: "Did you send it?"
You: "Our sales team handles email follow-ups. They'll reach out to [email] within 24 hours with all the details."
[ERROR] NOT: "Yes, I sent it"

===========================================================

KEY RULES:

1. **Answer questions directly** - Use specific numbers, prices, specs from knowledge base
2. **Be concise** - 2-3 sentences max
3. **Show expertise** - Technical details build trust
4. **Use memory** - Reference what they said before
5. **Ask technical questions** - About their use case, not their company
6. **Collect contact info ONLY at the end** - When they're interested or leaving
7. **Never hallucinate** - Admit if you don't know something
8. **YOU CANNOT SEND EMAILS** - Always say "Our team will send..." NEVER "I've sent..."
9. **Verify complex info** - Double-check pricing/specs in knowledge base; when giving estimates, summarize what was already discussed instead of re-explaining

USER'S MESSAGE: {message}


Your response (be helpful and expert):"""

# ============================================
# API Endpoints
# ============================================

@app.get("/")
async def root():
    return {
        "name": "SalesGPT API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.get("/leads")
async def get_leads():
    """Get all leads sorted by score"""
    try:
        result = supabase_client.table("leads").select("*").order("lead_score", desc=True).execute()
        return {
            "total_leads": len(result.data),
            "leads": result.data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/draft_email", response_model=DraftEmailResponse)
async def draft_email(request: DraftEmailRequest):
    """
    Generate a personalized follow-up email for a lead using GPT-OSS-120B.
    Uses chat history and lead data to create a contextual, helpful email.
    """
    try:
        logger.info("Drafting email for session: %s", request.session_id)
        
        # Fetch lead data
        lead_result = supabase_client.table("leads").select("*").eq("session_id", request.session_id).execute()
        
        if not lead_result.data:
            raise HTTPException(status_code=404, detail="Lead not found")
        
        lead = lead_result.data[0]
        
        # Fetch conversation history
        conv_result = supabase_client.table("conversations").select("*").eq("session_id", request.session_id).order("created_at").execute()
        
        # Format conversation
        conversation_text = ""
        if conv_result.data:
            for msg in conv_result.data:
                role = "Customer" if msg['role'] == 'user' else "Assistant"
                conversation_text += f"{role}: {msg['message']}\n"
        else:
            conversation_text = "No conversation history available."
        
        # Get email intent and context from BANT analysis
        email_intent = lead.get('email_intent', 'general_followup')
        email_context = lead.get('email_context', '')
        
        logger.info("Email intent=%s | Score=%s | Stage=%s", email_intent, lead.get('lead_score'), lead.get('pipeline_status'))
        logger.debug("Email context: %s", email_context)
        
        # Build email prompt using BANT analysis + intent + conversation
        email_prompt = build_email_prompt(lead, conversation_text, email_intent, email_context)
        
        logger.info("Calling %s for email generation...", EMAIL_MODEL)
        response = email_model.invoke([SystemMessage(content=email_prompt)])
        
        # Parse JSON response (robust extraction via shared util)
        raw_content = response.content.strip()
        email_data = extract_json(raw_content)

        if email_data is None:
            raise ValueError(f"LLM returned unparseable response: {raw_content[:200]}")

        if "subject" not in email_data or "body" not in email_data:
            raise ValueError(f"LLM JSON missing required keys: {list(email_data.keys())}")
        
        logger.info("Email generated: %s", email_data["subject"])
        
        return DraftEmailResponse(
            subject=email_data['subject'],
            body=email_data['body']
        )
        
    except ValueError as e:
        logger.error("Email generation error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error("Error drafting email: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.patch("/leads/{session_id}")
async def update_lead_status(session_id: str, request: UpdateLeadStatusRequest):
    """Update lead pipeline status (e.g., mark as Approached)"""
    try:
        logger.info("Updating lead status: %s -> %s", session_id, request.pipeline_status)
        
        result = supabase_client.table("leads").update({
            "pipeline_status": request.pipeline_status,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }).eq("session_id", session_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Lead not found")
        
        logger.info("Lead status updated to: %s", request.pipeline_status)
        return {"success": True, "lead": result.data[0]}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error updating lead status: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# Admin Endpoints
# ============================================

@app.post("/admin/force_decay")
async def force_decay():
    """
    Manually trigger time-decay on all eligible leads.
    Useful for live demos to show score decay in real-time.
    """
    try:
        logger.info("Manual time-decay triggered by admin")
        summary = apply_time_decay()
        return {
            "success": True,
            "message": f"Decay applied: {summary['updated']} leads updated, {summary['skipped']} skipped",
            "summary": summary
        }
    except Exception as e:
        logger.error("Force decay failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, background_tasks: BackgroundTasks):
    """
    Dual-Track Chat Endpoint
    
    Fast Track: RAG retrieval + LLM response
    Slow Track: Judge Agent + Extractor (async)
    """
    try:
        # Initialize session
        if request.session_id not in chat_sessions:
            chat_sessions[request.session_id] = []
        
        # Store user message
        chat_sessions[request.session_id].append({
            "role": "user",
            "content": request.message
        })
        
        logger.info("Query [%s]: %s", request.session_id[:12], request.message[:60])
        
        # Build conversation history (last 6 messages for context window)
        history = "\n".join(
            f"{msg['role'].title()}: {msg['content']}"
            for msg in chat_sessions[request.session_id][-6:]
        )
        
        # ============================================
        # CONTEXTUAL RAG: Resolve pronouns using chat history
        # ============================================
        
        vague_words = {"this", "that", "these", "those", "it", "them"}
        has_vague_reference = bool(
            vague_words & set(request.message.lower().split())
        )
        
        if has_vague_reference and len(chat_sessions[request.session_id]) > 1:
            recent_context = "\n".join(
                f"{msg['role'].title()}: {msg['content']}"
                for msg in chat_sessions[request.session_id][-4:]
            )
            contextual_query = f"{recent_context}\n\nCurrent question: {request.message}"
            logger.debug("Contextual RAG: augmented query with history")
        else:
            contextual_query = request.message
        
        # ============================================
        # FAST TRACK: RAG Retrieval
        # ============================================
        
        query_embedding = embeddings.embed_query(contextual_query)
        
        result = supabase_client.rpc(
            "match_documents",
            {"query_embedding": query_embedding, "match_count": TOP_K_RESULTS},
        ).execute()
        
        docs_data = result.data or []
        logger.info("RAG retrieved %d documents", len(docs_data))
        
        # Build context and sources
        if docs_data:
            context_parts = []
            sources: List[str] = []
            for doc in docs_data:
                context_parts.append(doc.get("content", ""))
                source = doc.get("metadata", {}).get("source", "Unknown")
                if source not in sources:
                    sources.append(source)
            context = "\n\n".join(context_parts)
        else:
            context = "No specific documentation found."
            sources = []
        
        # Fetch lead profile to know what info we have/need
        known_info = "New conversation - no info yet."
        try:
            lead_result = (
                supabase_client.table("leads")
                .select("company,email,name,role")
                .eq("session_id", request.session_id)
                .execute()
            )
            if lead_result.data:
                lead = lead_result.data[0]
                known = [
                    f"{k.title()}: {lead[k]}"
                    for k in ("name", "company", "email", "role")
                    if lead.get(k) and str(lead[k]).strip()
                ]
                if known:
                    known_info = " | ".join(known)
        except Exception as exc:
            logger.warning("Failed to fetch lead profile: %s", exc)
        
        # Generate response
        prompt = SYSTEM_PROMPT.format(
            known_info=known_info,
            history=history,
            context=context,
            message=request.message,
        )
        
        logger.debug("Generating LLM response...")
        response = chat_model.invoke([SystemMessage(content=prompt)])
        answer = response.content.strip()
        
        # Store bot response in memory
        chat_sessions[request.session_id].append({
            "role": "assistant",
            "content": answer,
        })
        
        logger.info("Response [%s]: %s", request.session_id[:12], answer[:80])
        
        # ============================================
        # Persist messages to Supabase conversations table
        # ============================================
        now_iso = datetime.now(timezone.utc).isoformat()

        background_tasks.add_task(
            _persist_messages,
            request.session_id,
            request.message,
            answer,
            now_iso,
        )
        
        # ============================================
        # SLOW TRACK: Background Tasks
        # ============================================
        
        background_tasks.add_task(
            analyze_lead,
            request.session_id,
            chat_sessions[request.session_id],
        )
        
        background_tasks.add_task(
            extract_lead_data,
            request.session_id,
            chat_sessions[request.session_id],
        )
        
        return ChatResponse(response=answer, sources=sources)
        
    except Exception as e:
        logger.error("Chat error: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# Helper: persist conversation to Supabase
# ============================================

def _persist_messages(
    session_id: str,
    user_message: str,
    assistant_message: str,
    timestamp: str,
) -> None:
    """Write user + assistant messages to the ``conversations`` table and
    update the lead's ``last_active`` timestamp so time-decay works correctly."""
    try:
        supabase_client.table("conversations").insert([
            {"session_id": session_id, "role": "user", "message": user_message},
            {"session_id": session_id, "role": "assistant", "message": assistant_message},
        ]).execute()

        # Touch last_active so time-decay knows the lead is still active
        supabase_client.table("leads").update({
            "last_active": timestamp,
            "updated_at": timestamp,
        }).eq("session_id", session_id).execute()
    except Exception as exc:
        logger.warning("Failed to persist conversation: %s", exc)


# ============================================
# Entrypoint
# ============================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
