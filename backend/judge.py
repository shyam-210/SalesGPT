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
    temperature=0,
    max_tokens=1500  # Enough room for detailed email_context extraction
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

**ADDITIONAL TASK - EMAIL INTENT EXTRACTION:**

Analyze what the customer is ASKING FOR to determine what kind of follow-up email they need.

**EMAIL INTENT Categories:**
- "pricing_request" - Asked about pricing, costs, or budget
- "technical_specs" - Need technical specifications or architecture details
- "plan_comparison" - Want to compare different plans or instance types
- "startup_program" - Interested in startup credits or program
- "custom_solution" - Need custom architecture or proposal
- "general_followup" - No specific request, just general interest

**EMAIL CONTEXT:** Extract EVERY specific detail the customer discussed or the assistant quoted.
This context will be used to generate the follow-up email — accuracy is critical.

For pricing_request — extract ALL numbers mentioned:
- Instance types and per-unit costs: "G1.xlarge: $6,325/month"
- Annual totals: "$70,900/year"
- Credits/offers: "$5,000 startup credits"
- Discounts: "20% annual discount"
- Tier info: "Enterprise tier, 99.99% SLA"
- Quantity: "10 instances", "50 users"

For technical_specs — extract ALL specs:
- Instance name, GPU model, vCPUs, RAM, storage, network
- Performance numbers discussed

For plan_comparison — extract EACH option:
- Plan A vs Plan B with key differences

For startup_program — extract program details:
- Credit amount, duration, eligibility, how to apply

For custom_solution — extract solution components:
- Use case, recommended config, pricing estimate

Format as detailed bullet points. Include EVERY relevant number or detail.
Example: "G1.xlarge: $6,325/mo ($70,900/yr). 10 instances = $63,250/mo. Startup credits: $5K. 20% annual discount available. 16 vCPUs, 32GB RAM, A100 GPU per instance."

**Updated Output Format:**
{
  "score": <0-100>,
  "stage": "<Visitor|Engaged|Qualified|Hot Lead>",
  "reasoning": "<BANT assessment>",
  "email_intent": "<intent category>",
  "email_context": "<specific details>"
}

**Examples with Email Intent:**

Conversation: "G1.xlarge is $6,325/month. With $5,000 startup credits, ~$70,900/year. Can you mail me that?"
Output: {"score": 75, "stage": "Hot Lead", "reasoning": "Requesting pricing via email shows buying intent.", "email_intent": "pricing_request", "email_context": "G1.xlarge: $6,325/mo, ~$70,900/yr. Credits: $5K."}

Conversation: "What's the annual enterprise pricing with 20% discount? Send details."
Output: {"score": 78, "stage": "Hot Lead", "reasoning": "Specific pricing request for enterprise tier.", "email_intent": "pricing_request", "email_context": "Enterprise: $416K-$624K/yr base, $332K-$499K with 20% discount. 99.99% SLA."}

Conversation: "What GPUs do you have? Email me the specs."
Output: {"score": 52, "stage": "Engaged", "reasoning": "Asking for technical specs shows interest.", "email_intent": "technical_specs", "email_context": "GPUs: G1.xlarge (A100, 16 vCPUs, 32GB RAM), G1.large (V100, 8 vCPUs)."}

Conversation: "Tell me about your services"
Output: {"score": 15, "stage": "Visitor", "reasoning": "Generic question, no specific need.", "email_intent": "general_followup", "email_context": "General interest, no specific request"}

**TROLL / OFF-TOPIC DETECTION:**
If the user is clearly playing around, asking non-business questions (riddles, jokes, memes, insults,
personal questions, or anything completely unrelated to cloud infrastructure / business), you MUST:
- Set score to 0
- Set stage to "Visitor"
- Set reasoning to "TROLL DETECTED - <brief explanation>"
- Set email_intent to "general_followup"
- Set email_context to "Non-business interaction, no follow-up needed"

Examples of troll behaviour:
- "Tell me a joke", "What is 2+2?", "Who is the president?"
- "You're stupid", "lol", "asdf", random gibberish
- Any conversation with ZERO relevance to cloud, infrastructure, pricing, or business

Now analyze the following conversation:

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
        print(f"\n[SEARCH] Judge analyzing session: {session_id}")
        
        # Step 1: Format conversation for Judge
        conversation_text = format_conversation(chat_history)
        
        # Step 2: Call Judge Model
        messages = [
            SystemMessage(content=JUDGE_PROMPT),
            HumanMessage(content=f"Conversation:\n{conversation_text}\n\nAnalyze this lead:")
        ]
        
        print(f"[AI] Calling Judge Model ({JUDGE_MODEL})...")
        response = judge_model.invoke(messages)
        
        # Step 3: Parse JSON response
        try:
            result = json.loads(response.content.strip())
            score = result.get("score", 0)
            stage = result.get("stage", "Visitor")
            reasoning = result.get("reasoning", "No reasoning provided")
            email_intent = result.get("email_intent", "general_followup")
            email_context = result.get("email_context", "")
            
            print(f"[DATA] Score: {score} | Stage: {stage} | Intent: {email_intent}")
            print(f"[THOUGHT] Reasoning: {reasoning}")
            
        except json.JSONDecodeError as e:
            print(f"[ERROR] Failed to parse JSON: {e}")
            print(f"Raw response: {response.content}")
            # Fallback values
            score = 0
            stage = "Visitor"
            reasoning = f"Error parsing response: {response.content[:100]}"
            email_intent = "general_followup"
            email_context = ""
        
        # Step 4: Update/Insert lead in Supabase
        update_lead_in_db(session_id, score, stage, reasoning, email_intent, email_context)
        
        print(f"[OK] Lead analysis complete for {session_id}\n")
        
    except Exception as e:
        print(f"[ERROR] Error in Judge Agent: {e}")
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

def update_lead_in_db(session_id: str, score: int, stage: str, reasoning: str, email_intent: str = "general_followup", email_context: str = ""):
    """
    Update or insert lead in Supabase leads table.
    
    Args:
        session_id: Unique session identifier
        score: BANT score (0-100)
        stage: Pipeline stage
        reasoning: Judge's reasoning
        email_intent: What customer asked for (for email generation)
        email_context: Context of what they asked for
    """
    try:
        # Check if lead exists
        existing = supabase_client.table("leads").select("*").eq("session_id", session_id).execute()
        
        if existing.data:
            # Update existing lead
            supabase_client.table("leads").update({
                "lead_score": score,
                "pipeline_status": stage,
                "notes": reasoning,
                "email_intent": email_intent,
                "email_context": email_context
            }).eq("session_id", session_id).execute()
            
            print(f"[NOTE] Updated existing lead: {session_id}")
        else:
            # Insert new lead
            supabase_client.table("leads").insert({
                "session_id": session_id,
                "lead_score": score,
                "pipeline_status": stage,
                "notes": reasoning,
                "email_intent": email_intent,
                "email_context": email_context
            }).execute()
            
            print(f"[NOTE] Created new lead: {session_id}")
            
    except Exception as e:
        print(f"[ERROR] Database error: {e}")
        # Don't print full traceback - just log the error
        print(f"   Attempted to save: session={session_id}, score={score}, stage={stage}")
