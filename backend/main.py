"""
SalesGPT - FastAPI Backend
Clean RAG Implementation with Dual-Track System

Fast Track: RAG chat (<1.5s response)
Slow Track: Judge Agent + Extractor (async background)
"""

import os
import json
import re
from typing import List
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_groq import ChatGroq
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.messages import SystemMessage
from supabase import create_client, Client
from backend.judge import analyze_lead
from backend.extractor import extract_lead_data
from backend.email_intent_prompts import build_email_prompt
from backend.cron import apply_time_decay

load_dotenv()

# ============================================
# Configuration
# ============================================

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
CHAT_MODEL = os.getenv("CHAT_MODEL", "llama-3.1-8b-instant")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
TOP_K_RESULTS = int(os.getenv("TOP_K_RESULTS", "3"))

if not all([SUPABASE_URL, SUPABASE_KEY, GROQ_API_KEY]):
    raise ValueError("Missing required environment variables")

# ============================================
# Initialize FastAPI
# ============================================

app = FastAPI(
    title="SalesGPT API",
    description="Dual-track lead qualification system",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# Initialize AI Models
# ============================================

print("[AI] Initializing Groq chat model...")
chat_model = ChatGroq(
    groq_api_key=GROQ_API_KEY,
    model_name=CHAT_MODEL,
    temperature=0.7,
    max_tokens=600  # Increased for detailed responses like quotations
)
print(f"[OK] Groq model initialized: {CHAT_MODEL}")

print("[BRAIN] Loading embedding model...")
embeddings = HuggingFaceEmbeddings(
    model_name=EMBEDDING_MODEL,
    model_kwargs={'device': 'cpu'},
    encode_kwargs={'normalize_embeddings': True}
)
print(f"[OK] Embedding model loaded: {EMBEDDING_MODEL}")

print("[LINK] Connecting to Supabase...")
supabase_client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
print("[OK] Supabase client initialized")

# In-memory chat history
chat_sessions = {}
print("[SAVE] Chat history storage initialized")

# ============================================
# Pydantic Models
# ============================================

class ChatRequest(BaseModel):
    message: str
    session_id: str

class ChatResponse(BaseModel):
    response: str
    sources: List[str]

class DraftEmailRequest(BaseModel):
    session_id: str

class DraftEmailResponse(BaseModel):
    subject: str
    body: str

class UpdateLeadStatusRequest(BaseModel):
    pipeline_status: str


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
        print(f"\n[EMAIL] Drafting email for session: {request.session_id}")
        
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
        
        print(f"[TARGET] Email Intent: {email_intent}")
        print(f"[NOTE] Context: {email_context}")
        print(f"[DATA] BANT Score: {lead.get('lead_score')} | Stage: {lead.get('pipeline_status')}")
        
        # Build email prompt using BANT analysis + intent + conversation
        email_prompt = build_email_prompt(lead, conversation_text, email_intent, email_context)
        
        # Initialize email drafting model (GPT-OSS-120B) — low temperature for accuracy
        email_model = ChatGroq(
            groq_api_key=GROQ_API_KEY,
            model_name="openai/gpt-oss-120b",
            temperature=0.3,
            max_tokens=1024
        )
        
        print("[AI] Calling GPT-OSS-120B for email generation...")
        response = email_model.invoke([SystemMessage(content=email_prompt)])
        
        # Parse JSON response (robust extraction)
        raw_content = response.content.strip()
        
        # Strategy 1: Strip markdown code blocks if present
        if raw_content.startswith("```"):
            lines = raw_content.split('\n')
            json_content = '\n'.join(lines[1:-1])
        else:
            json_content = raw_content
        
        # Strategy 2: If still invalid, try to find JSON object in the text
        try:
            email_data = json.loads(json_content)
        except json.JSONDecodeError:
            # Find the first { ... } block
            match = re.search(r'\{[\s\S]*\}', raw_content)
            if match:
                email_data = json.loads(match.group(0))
            else:
                raise json.JSONDecodeError("No JSON object found", raw_content, 0)
        
        print(f"[OK] Email generated: {email_data['subject']}")
        
        return DraftEmailResponse(
            subject=email_data['subject'],
            body=email_data['body']
        )
        
    except json.JSONDecodeError as e:
        print(f"[ERROR] Failed to parse email JSON: {e}")
        print(f"Raw response: {raw_content[:200]}")
        raise HTTPException(status_code=500, detail="Failed to generate email. Invalid response format.")
    except Exception as e:
        print(f"[ERROR] Error drafting email: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.patch("/leads/{session_id}")
async def update_lead_status(session_id: str, request: UpdateLeadStatusRequest):
    """Update lead pipeline status (e.g., mark as Approached)"""
    try:
        print(f"\n[NOTE] Updating lead status: {session_id} -> {request.pipeline_status}")
        
        result = supabase_client.table("leads").update({
            "pipeline_status": request.pipeline_status,
            "updated_at": "NOW()"
        }).eq("session_id", session_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Lead not found")
        
        print(f"[OK] Lead status updated to: {request.pipeline_status}")
        return {"success": True, "lead": result.data[0]}
        
    except Exception as e:
        print(f"[ERROR] Error updating lead status: {e}")
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
        print("\n[DECAY] Manual time-decay triggered by admin")
        summary = apply_time_decay()
        return {
            "success": True,
            "message": f"Decay applied: {summary['updated']} leads updated, {summary['skipped']} skipped",
            "summary": summary
        }
    except Exception as e:
        print(f"[ERROR] Force decay failed: {e}")
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
        
        print(f"\n[SEARCH] Query: {request.message[:50]}...")
        
        # Build conversation history
        history = "\n".join([
            f"{msg['role'].title()}: {msg['content']}"
            for msg in chat_sessions[request.session_id][-6:]
        ])
        
        # ============================================
        # CONTEXTUAL RAG: Resolve pronouns using chat history
        # ============================================
        
        # Check if query has vague pronouns that need context
        vague_words = ['this', 'that', 'these', 'those', 'it', 'them']
        has_vague_reference = any(word in request.message.lower().split() for word in vague_words)
        
        # Build contextual query for RAG
        if has_vague_reference and len(chat_sessions[request.session_id]) > 1:
            # Get last 2 exchanges for context
            recent_context = "\n".join([
                f"{msg['role'].title()}: {msg['content']}"
                for msg in chat_sessions[request.session_id][-4:]
            ])
            
            # Combine context with current query
            contextual_query = f"{recent_context}\n\nCurrent question: {request.message}"
            
            print(f"[REFRESH] Contextual query: {request.message} (with history)")
        else:
            # Use query as-is
            contextual_query = request.message
        
        # ============================================
        # FAST TRACK: RAG Retrieval
        # ============================================
        
        # Generate embedding with contextual query
        query_embedding = embeddings.embed_query(contextual_query)
        
        # Search Supabase
        result = supabase_client.rpc(
            'match_documents',
            {
                'query_embedding': query_embedding,
                'match_count': TOP_K_RESULTS
            }
        ).execute()
        
        docs_data = result.data if result.data else []
        print(f"[DOC] Found {len(docs_data)} documents")
        
        # Build context and sources
        if docs_data:
            context_parts = []
            sources = []
            for doc in docs_data:
                context_parts.append(doc.get('content', ''))
                source = doc.get('metadata', {}).get('source', 'Unknown')
                if source not in sources:
                    sources.append(source)
            context = "\n\n".join(context_parts)
        else:
            context = "No specific documentation found."
            sources = []
        
        # Fetch lead profile to know what info we have/need
        try:
            lead_result = supabase_client.table("leads").select("*").eq("session_id", request.session_id).execute()
            
            if lead_result.data:
                lead = lead_result.data[0]
                known = []
                
                # Check what we know
                if lead.get("company") and str(lead.get("company")).strip():
                    known.append(f"Company: {lead['company']}")
                
                if lead.get("email") and str(lead.get("email")).strip():
                    known.append(f"Email: {lead['email']}")
                
                if lead.get("name") and str(lead.get("name")).strip():
                    known.append(f"Name: {lead['name']}")
                
                if lead.get("role") and str(lead.get("role")).strip():
                    known.append(f"Role: {lead['role']}")
                
                known_info = " | ".join(known) if known else "New conversation - no info yet."
            else:
                known_info = "New conversation - no info yet."
        except:
            known_info = "New conversation - no info yet."
        
        # Generate response
        prompt = SYSTEM_PROMPT.format(
            known_info=known_info,
            history=history,
            context=context,
            message=request.message
        )
        
        print("[AI] Generating response...")
        response = chat_model.invoke([SystemMessage(content=prompt)])
        answer = response.content.strip()
        
        # Store bot response
        chat_sessions[request.session_id].append({
            "role": "assistant",
            "content": answer
        })
        
        print(f"[OK] Response: {answer[:100]}...")
        
        # ============================================
        # SLOW TRACK: Background Tasks
        # ============================================
        
        background_tasks.add_task(
            analyze_lead,
            request.session_id,
            chat_sessions[request.session_id]
        )
        
        background_tasks.add_task(
            extract_lead_data,
            request.session_id,
            chat_sessions[request.session_id]
        )
        
        return ChatResponse(response=answer, sources=sources)
        
    except Exception as e:
        print(f"[ERROR] Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# Startup Event
# ============================================

@app.on_event("startup")
async def startup():
    print("\n" + "="*60)
    print(" SalesGPT API Starting...")
    print("="*60)
    print(f" Supabase: {SUPABASE_URL}")
    print(f"[AI] Chat Model: {CHAT_MODEL}")
    print(f"[BRAIN] Embedding Model: {EMBEDDING_MODEL}")
    print("="*60)
    print("[OK] API Ready!")
    print(" Docs: http://localhost:8000/docs")
    print("="*60 + "\n")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
