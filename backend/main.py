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

from cachetools import TTLCache, cached

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, BackgroundTasks, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from langchain_groq import ChatGroq
from langchain_huggingface import HuggingFaceEndpointEmbeddings
from langchain_core.messages import SystemMessage
from langchain_text_splitters import RecursiveCharacterTextSplitter
from supabase import create_client, Client

from backend.agent_graph import run_agent_graph
from backend.email_intent_prompts import build_email_prompt
from backend.cron import apply_time_decay
from backend.utils import get_logger, extract_json
from backend.db_setup import run_auto_migrations

load_dotenv()

logger = get_logger(__name__)

# ============================================
# Configuration
# ============================================

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY")
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
    
    # Run auto-migrations
    run_auto_migrations()
    
    yield
    logger.info("SalesGPT API shutting down.")


app = FastAPI(
    title="SalesGPT API",
    description="Dual-track lead qualification system with analytics",
    version="3.0.0",
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

logger.info("Loading embedding model via Inference API...")
embeddings = HuggingFaceEndpointEmbeddings(
    model=EMBEDDING_MODEL,
    huggingfacehub_api_token=HUGGINGFACE_API_KEY,
)
logger.info("Embedding model initialized: %s", EMBEDDING_MODEL)

logger.info("Connecting to Supabase...")
supabase_client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
logger.info("Supabase client initialized")

# In-memory chat history (keyed by session_id) with 24-hour TTL to prevent memory leaks
chat_sessions = TTLCache(maxsize=10000, ttl=86400)
logger.info("Chat session storage initialized with TTLCache")

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

class LeadSearchRequest(BaseModel):
    query: str = Field(default="", max_length=256)
    pipeline_status: str | None = None
    min_score: int = Field(default=0, ge=0, le=100)
    max_score: int = Field(default=100, ge=0, le=100)
    sort_by: str = Field(default="lead_score", pattern=r"^(lead_score|created_at|updated_at|last_active)$")
    sort_order: str = Field(default="desc", pattern=r"^(asc|desc)$")
    limit: int = Field(default=50, ge=1, le=200)
    offset: int = Field(default=0, ge=0)


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
        "version": "3.0.0",
        "status": "running",
        "endpoints": {
            "chat": "/chat",
            "leads": "/leads",
            "lead_search": "/leads/search",
            "analytics": "/analytics/dashboard",
            "activity_feed": "/analytics/activity",
            "conversations": "/conversations/{session_id}",
            "draft_email": "/draft_email",
            "documents": "/documents",
            "documents_upload": "/documents/upload",
            "documents_delete": "/documents/{source}",
            "docs": "/docs",
        },
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


# ============================================
# Analytics & Intelligence Endpoints
# ============================================

analytics_cache = TTLCache(maxsize=1, ttl=10)

@app.get("/analytics/dashboard")
@cached(cache=analytics_cache)
def analytics_dashboard():
    """
    Comprehensive analytics: pipeline funnel, score distribution,
    conversion rates, top leads, activity timeline.
    """
    try:
        result = supabase_client.table("leads").select("*").execute()
        leads = result.data or []

        # Pipeline funnel counts
        stages = ["Visitor", "Engaged", "Qualified", "Hot Lead", "Approached"]
        funnel = {s: 0 for s in stages}
        score_buckets = {"0-20": 0, "21-40": 0, "41-60": 0, "61-80": 0, "81-100": 0}
        total_score = 0
        with_email = 0
        with_company = 0
        hot_leads = []

        for lead in leads:
            stage = lead.get("pipeline_status", "Visitor")
            score = lead.get("lead_score", 0)
            funnel[stage] = funnel.get(stage, 0) + 1
            total_score += score

            if score <= 20: score_buckets["0-20"] += 1
            elif score <= 40: score_buckets["21-40"] += 1
            elif score <= 60: score_buckets["41-60"] += 1
            elif score <= 80: score_buckets["61-80"] += 1
            else: score_buckets["81-100"] += 1

            if lead.get("email"): with_email += 1
            if lead.get("company"): with_company += 1
            if score >= 70:
                hot_leads.append({
                    "session_id": lead["session_id"],
                    "name": lead.get("name", "Anonymous"),
                    "company": lead.get("company", "Unknown"),
                    "score": score,
                    "stage": stage,
                    "email": lead.get("email"),
                })

        total = len(leads)
        avg_score = round(total_score / total, 1) if total else 0

        # Conversion rates
        engaged_plus = sum(funnel.get(s, 0) for s in ["Engaged", "Qualified", "Hot Lead", "Approached"])
        qualified_plus = sum(funnel.get(s, 0) for s in ["Qualified", "Hot Lead", "Approached"])
        approached = funnel.get("Approached", 0)

        conversion_rates = {
            "visitor_to_engaged": round(engaged_plus / total * 100, 1) if total else 0,
            "engaged_to_qualified": round(qualified_plus / engaged_plus * 100, 1) if engaged_plus else 0,
            "qualified_to_approached": round(approached / qualified_plus * 100, 1) if qualified_plus else 0,
            "overall_conversion": round(approached / total * 100, 1) if total else 0,
        }

        return {
            "total_leads": total,
            "average_score": avg_score,
            "email_capture_rate": round(with_email / total * 100, 1) if total else 0,
            "company_capture_rate": round(with_company / total * 100, 1) if total else 0,
            "pipeline_funnel": funnel,
            "score_distribution": score_buckets,
            "conversion_rates": conversion_rates,
            "hot_leads": sorted(hot_leads, key=lambda x: x["score"], reverse=True)[:10],
        }
    except Exception as e:
        logger.error("Analytics error: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/leads/search")
async def search_leads(request: LeadSearchRequest):
    """
    Advanced lead search with filters, sorting, and pagination.
    """
    try:
        query = supabase_client.table("leads").select("*", count="exact")

        if request.pipeline_status:
            query = query.eq("pipeline_status", request.pipeline_status)

        query = query.gte("lead_score", request.min_score).lte("lead_score", request.max_score)

        # Text search across name, company, email, needs
        if request.query.strip():
            search_term = request.query.strip()
            query = query.or_(
                f"name.ilike.%{search_term}%,"
                f"company.ilike.%{search_term}%,"
                f"email.ilike.%{search_term}%,"
                f"needs.ilike.%{search_term}%,"
                f"session_id.ilike.%{search_term}%"
            )

        is_desc = request.sort_order == "desc"
        query = query.order(request.sort_by, desc=is_desc)
        query = query.range(request.offset, request.offset + request.limit - 1)

        result = query.execute()

        return {
            "leads": result.data or [],
            "total": result.count if hasattr(result, "count") and result.count is not None else len(result.data or []),
            "offset": request.offset,
            "limit": request.limit,
        }
    except Exception as e:
        logger.error("Lead search error: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/conversations/{session_id}")
async def get_conversations(session_id: str):
    """
    Retrieve full conversation history for a session.
    """
    try:
        result = (
            supabase_client.table("conversations")
            .select("*")
            .eq("session_id", session_id)
            .order("created_at")
            .execute()
        )
        messages = result.data or []

        # Also fetch lead data for context
        lead_result = (
            supabase_client.table("leads")
            .select("*")
            .eq("session_id", session_id)
            .execute()
        )
        lead = lead_result.data[0] if lead_result.data else None

        return {
            "session_id": session_id,
            "message_count": len(messages),
            "messages": messages,
            "lead": lead,
        }
    except Exception as e:
        logger.error("Conversation fetch error: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/leads/{session_id}")
async def delete_lead(session_id: str):
    """Delete a lead and its conversations."""
    try:
        # Delete conversations first
        supabase_client.table("conversations").delete().eq("session_id", session_id).execute()
        # Delete the lead
        result = supabase_client.table("leads").delete().eq("session_id", session_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Lead not found")
        # Clean up chat session memory
        chat_sessions.pop(session_id, None)
        return {"success": True, "deleted_session": session_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Delete lead error: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/analytics/activity")
async def analytics_activity():
    """
    Recent activity feed — last 50 lead updates for the activity timeline.
    """
    try:
        result = (
            supabase_client.table("leads")
            .select("session_id,name,company,lead_score,pipeline_status,updated_at,email")
            .order("updated_at", desc=True)
            .limit(50)
            .execute()
        )
        return {"activities": result.data or []}
    except Exception as e:
        logger.error("Activity feed error: %s", e, exc_info=True)
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
        logger.debug("LLM raw response (first 500 chars): %s", raw_content[:500])
        
        email_data = extract_json(raw_content)

        if email_data is None:
            logger.error("Failed to extract JSON from response. Raw content length: %d", len(raw_content))
            logger.error("First 300 chars of response: %s", raw_content[:300])
            raise ValueError(f"LLM returned unparseable response: {raw_content[:200]}")

        if not isinstance(email_data, dict):
            logger.error("Parsed data is not a dict, got: %s", type(email_data))
            raise ValueError(f"LLM response is not a valid JSON object")
        
        if "subject" not in email_data or "body" not in email_data:
            logger.error("Missing required keys in parsed JSON. Keys found: %s", list(email_data.keys()))
            raise ValueError(f"LLM JSON missing required keys: {list(email_data.keys())}")
        
        subject = email_data.get("subject", "").strip()
        body = email_data.get("body", "").strip()
        
        if not subject or not body:
            logger.error("Subject or body is empty. Subject length: %d, Body length: %d", len(subject), len(body))
            raise ValueError("LLM generated empty subject or body")
        
        logger.info("Email generated successfully: %s", subject[:50])
        
        return DraftEmailResponse(
            subject=subject,
            body=body
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
# Document Management Endpoints (Dynamic RAG)
# ============================================

CHUNK_SIZE = 500
CHUNK_OVERLAP = 50


@app.get("/documents")
async def list_documents():
    """List all documents in the knowledge base, grouped by source."""
    try:
        result = supabase_client.table("documents").select("id,metadata").execute()
        rows = result.data or []

        source_map: dict[str, int] = {}
        for row in rows:
            source = (row.get("metadata") or {}).get("source", "unknown")
            source_map[source] = source_map.get(source, 0) + 1

        documents = [
            {"source": src, "chunk_count": cnt}
            for src, cnt in sorted(source_map.items())
        ]
        return {"documents": documents, "total_chunks": len(rows)}
    except Exception as e:
        logger.error("List documents error: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/documents/upload")
async def upload_document(file: UploadFile = File(...)):
    """Upload a .md file: chunk, embed and store in the vector database."""
    if not file.filename or not file.filename.endswith(".md"):
        raise HTTPException(status_code=400, detail="Only .md files are supported")

    try:
        raw = await file.read()
        content = raw.decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File must be valid UTF-8 text")

    source_name = file.filename
    logger.info("Uploading document: %s (%d bytes)", source_name, len(raw))

    try:
        # Remove any existing chunks from this source before re-uploading
        existing = (
            supabase_client.table("documents")
            .select("id,metadata")
            .execute()
        )
        ids_to_delete = [
            r["id"] for r in (existing.data or [])
            if (r.get("metadata") or {}).get("source") == source_name
        ]
        if ids_to_delete:
            for i in range(0, len(ids_to_delete), 100):
                batch = ids_to_delete[i:i + 100]
                supabase_client.table("documents").delete().in_("id", batch).execute()
            logger.info("Cleared %d existing chunks for %s", len(ids_to_delete), source_name)

        # Chunk the document
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=CHUNK_SIZE,
            chunk_overlap=CHUNK_OVERLAP,
            length_function=len,
            separators=["\n\n", "\n", " ", ""],
        )
        chunks = splitter.split_text(content)

        if not chunks:
            raise HTTPException(status_code=400, detail="File produced no text chunks")

        # Embed and prepare records
        records = []
        for chunk_text in chunks:
            embedding = embeddings.embed_query(chunk_text)
            records.append({
                "content": chunk_text,
                "embedding": embedding,
                "metadata": {"source": source_name, "filename": source_name.replace(".md", "")},
            })

        # Upload in batches
        BATCH_SIZE = 100
        for i in range(0, len(records), BATCH_SIZE):
            supabase_client.table("documents").insert(records[i:i + BATCH_SIZE]).execute()

        logger.info("Uploaded %d chunks for %s", len(records), source_name)
        return {"success": True, "source": source_name, "chunks_created": len(records)}

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Document upload error: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/documents/{source}")
async def delete_document(source: str):
    """Delete all chunks belonging to a document source."""
    try:
        result = supabase_client.table("documents").select("id,metadata").execute()
        ids_to_delete = [
            r["id"] for r in (result.data or [])
            if (r.get("metadata") or {}).get("source") == source
        ]

        if not ids_to_delete:
            raise HTTPException(status_code=404, detail=f"No document found with source '{source}'")

        for i in range(0, len(ids_to_delete), 100):
            batch = ids_to_delete[i:i + 100]
            supabase_client.table("documents").delete().in_("id", batch).execute()

        logger.info("Deleted %d chunks for source: %s", len(ids_to_delete), source)
        return {"success": True, "source": source, "chunks_deleted": len(ids_to_delete)}

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Document delete error: %s", e, exc_info=True)
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
        # SLOW TRACK: Background LangGraph Workflow
        # ============================================
        
        background_tasks.add_task(
            run_agent_graph,
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
