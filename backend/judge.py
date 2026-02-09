"""
SalesGPT - Judge Agent
Phase 3.1: Background BANT Scoring

This module implements the "Slow Track" intelligence that analyzes
conversations in the background to score leads using the BANT framework.
"""

import os
import json
from typing import List, Dict
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage
from supabase import create_client, Client

load_dotenv()

# ============================================
# Configuration
# ============================================

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
JUDGE_MODEL = os.getenv("JUDGE_MODEL", "openai/gpt-oss-120b")

# Initialize Groq Judge Model
judge_model = ChatGroq(
    groq_api_key=GROQ_API_KEY,
    model_name=JUDGE_MODEL,
    temperature=0.5,  # Allow some creativity in reasoning
    max_tokens=512
)

# Initialize Supabase Client
supabase_client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ============================================
# Judge System Prompt
# ============================================

JUDGE_PROMPT = """You are the Senior Sales Judge for Team Defaulters, a cloud infrastructure company.

Your job is to analyze sales conversations and score leads using the BANT framework:

**BANT Criteria:**
- **Budget:** Can they afford enterprise cloud costs? Look for signals like company size, funding stage, current infrastructure spend
- **Authority:** Are they a decision maker? Look for titles like CTO, VP Engineering, Dev Lead, or phrases like "I'm evaluating" or "we need"
- **Need:** Do they have a clear pain point? Look for mentions of latency, scale, reliability, migration, downtime
- **Timeline:** When do they need this? Look for urgency signals like "ASAP", "this week", "urgent", or exploratory phrases like "just looking"

**Scoring Guide:**
- **0-30 (Visitor):** Just browsing, asking generic questions, no specific need mentioned
- **31-50 (Engaged):** Asking specific questions about features/pricing, showing interest but no clear need
- **51-70 (Qualified):** Has a clear need + budget signals (e.g., "we're a Series A startup", "enterprise plan")
- **71-100 (Hot Lead):** Urgent need + authority + budget + timeline (e.g., "I'm the CTO, we need to migrate within 2 weeks")

**Output Format:**
You MUST respond with ONLY valid JSON in this exact format:
{
  "score": <integer between 0-100>,
  "stage": "<one of: Visitor, Engaged, Qualified, Hot Lead>",
  "reasoning": "<concise 1-2 sentence summary of BANT assessment>"
}

**Examples:**

Conversation: "What is Team Defaulters?"
Output: {"score": 10, "stage": "Visitor", "reasoning": "Generic question, no specific need or context provided."}

Conversation: "What's your pricing for compute instances? Do you offer discounts?"
Output: {"score": 45, "stage": "Engaged", "reasoning": "Asking about pricing shows interest, but no clear need or authority signals."}

Conversation: "We're a Series A startup migrating from AWS. What's your SLA? We need 99.99% uptime."
Output: {"score": 68, "stage": "Qualified", "reasoning": "Has budget (Series A), clear need (migration), specific requirements (SLA). Missing authority and timeline."}

Conversation: "I'm the CTO at a fintech company. We're experiencing 200ms latency and need to migrate ASAP. What's your enterprise pricing?"
Output: {"score": 92, "stage": "Hot Lead", "reasoning": "Authority (CTO), urgent need (ASAP migration), budget signals (enterprise), clear pain point (latency)."}

Remember: Output ONLY the JSON, no additional text."""

# ============================================
# Main Judge Function
# ============================================

async def analyze_lead(session_id: str, chat_history: List[Dict[str, str]]):
    """
    Analyze conversation and update lead score in Supabase.
    
    This function runs in the background (async) and does NOT block
    the user's chat response.
    
    Args:
        session_id: Unique session identifier
        chat_history: List of message dicts with 'role' and 'text' keys
    """
    try:
        print(f"\n🔍 Judge analyzing session: {session_id}")
        
        # Step 1: Format conversation for Judge
        conversation_text = format_conversation(chat_history)
        
        # Step 2: Call Judge Model
        messages = [
            SystemMessage(content=JUDGE_PROMPT),
            HumanMessage(content=f"Conversation:\n{conversation_text}\n\nAnalyze this lead:")
        ]
        
        print(f"🤖 Calling Judge Model ({JUDGE_MODEL})...")
        response = judge_model.invoke(messages)
        
        # Step 3: Parse JSON response
        try:
            result = json.loads(response.content.strip())
            score = result.get("score", 0)
            stage = result.get("stage", "Visitor")
            reasoning = result.get("reasoning", "No reasoning provided")
            
            print(f"📊 Score: {score} | Stage: {stage}")
            print(f"💭 Reasoning: {reasoning}")
            
        except json.JSONDecodeError as e:
            print(f"❌ Failed to parse JSON: {e}")
            print(f"Raw response: {response.content}")
            # Fallback values
            score = 0
            stage = "Visitor"
            reasoning = f"Error parsing response: {response.content[:100]}"
        
        # Step 4: Update/Insert lead in Supabase
        update_lead_in_db(session_id, score, stage, reasoning)
        
        print(f"✅ Lead analysis complete for {session_id}\n")
        
    except Exception as e:
        print(f"❌ Error in Judge Agent: {e}")
        import traceback
        traceback.print_exc()

def format_conversation(chat_history: List[Dict[str, str]]) -> str:
    """
    Format chat history into a readable string for the Judge.
    
    Args:
        chat_history: List of message dicts
        
    Returns:
        Formatted conversation string
    """
    lines = []
    for msg in chat_history:
        role = "Customer" if msg["role"] == "user" else "Assistant"
        # Support both 'text' (old format) and 'content' (new format)
        message_text = msg.get('content') or msg.get('text', '')
        lines.append(f"{role}: {message_text}")
    
    return "\n".join(lines)

def update_lead_in_db(session_id: str, score: int, stage: str, reasoning: str):
    """
    Update or insert lead in Supabase leads table.
    
    Args:
        session_id: Unique session identifier
        score: BANT score (0-100)
        stage: Pipeline stage
        reasoning: Judge's reasoning
    """
    try:
        # Check if lead exists
        existing = supabase_client.table("leads").select("*").eq("session_id", session_id).execute()
        
        if existing.data:
            # Update existing lead
            supabase_client.table("leads").update({
                "lead_score": score,
                "pipeline_status": stage,
                "notes": reasoning
            }).eq("session_id", session_id).execute()
            
            print(f"📝 Updated existing lead: {session_id}")
        else:
            # Insert new lead
            supabase_client.table("leads").insert({
                "session_id": session_id,
                "lead_score": score,
                "pipeline_status": stage,
                "notes": reasoning
            }).execute()
            
            print(f"📝 Created new lead: {session_id}")
            
    except Exception as e:
        print(f"❌ Database error: {e}")
        # Don't print full traceback - just log the error
        print(f"   Attempted to save: session={session_id}, score={score}, stage={stage}")
