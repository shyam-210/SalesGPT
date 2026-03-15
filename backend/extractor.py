"""
SalesGPT - Lead Data Extractor
Phase 3.3: Extract contact information from conversations

This module extracts lead data (name, company, email, etc.) from chat history
and updates the leads table.
"""

import os
from typing import List, Dict
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage
from supabase import create_client, Client

from backend.utils import get_logger, format_conversation, extract_json

load_dotenv()

logger = get_logger(__name__)

# ============================================
# Configuration
# ============================================

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
EXTRACTOR_MODEL = os.getenv("EXTRACTOR_MODEL", "llama-3.1-8b-instant")

# Initialize Groq Model (fast model for extraction)
extractor_model = ChatGroq(
    groq_api_key=GROQ_API_KEY,
    model_name=EXTRACTOR_MODEL,
    temperature=0,  # Deterministic extraction
    max_tokens=256
)

# Initialize Supabase Client
supabase_client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ============================================
# Extraction Prompt
# ============================================

EXTRACTION_PROMPT = """You are a data extraction assistant. Analyze the conversation and extract lead information.

CRITICAL: ONLY extract information that is EXPLICITLY mentioned. Do NOT infer, guess, or make assumptions.

Extract these fields:
- **name**: Person's full name (e.g., "John Smith", "Sarah")
- **company**: Company name (e.g., "Acme Inc", "TechCorp")  
- **email**: Email address (e.g., "john@acme.com")
- **phone**: Phone number (e.g., "+1-555-0123")
- **role**: Job title (e.g., "CTO", "VP Engineering", "Developer")
- **needs**: Key pain points or requirements mentioned (e.g., "latency issues", "need 99.99% uptime")

RULES:
1. ONLY extract if the user EXPLICITLY stated it
2. Do NOT infer email from company name (e.g., don't guess "shyam@chainai.com")
3. Do NOT add comments or explanations to the JSON
4. Output ONLY valid JSON with no additional text

Output format (valid JSON only):
{
  "name": "...",
  "company": "...",
  "email": "...",
  "phone": "...",
  "role": "...",
  "needs": "..."
}

Use null for fields not explicitly mentioned."""

# ============================================
# Main Extraction Function
# ============================================

async def extract_lead_data(session_id: str, chat_history: List[Dict[str, str]]):
    """
    Extract lead contact information from conversation.
    
    Args:
        session_id: Unique session identifier
        chat_history: List of message dicts with 'role' and 'text'/'content' keys
    """
    try:
        logger.info("Extracting lead data for session: %s", session_id)
        
        # Step 1: Format conversation
        conversation_text = format_conversation(chat_history)
        
        # Step 2: Call extraction model
        messages = [
            SystemMessage(content=EXTRACTION_PROMPT),
            HumanMessage(content=f"Conversation:\n{conversation_text}\n\nExtract lead data:")
        ]
        
        response = extractor_model.invoke(messages)
        
        # Step 3: Parse JSON (robust extraction via shared util)
        extracted_data = extract_json(response.content)

        if extracted_data is None:
            logger.warning("Failed to parse extraction JSON. Raw: %s", response.content[:200])
            return

        # Filter out null/empty values
        clean_data = {k: v for k, v in extracted_data.items() if v is not None and v != ""}
        
        if clean_data:
            logger.info("Extracted: %s", ", ".join(f"{k}={v}" for k, v in clean_data.items()))
            update_lead_data(session_id, clean_data)
        else:
            logger.debug("No new data extracted for %s", session_id)
        
    except Exception as e:
        logger.error("Error in lead extraction: %s", e, exc_info=True)

def update_lead_data(session_id: str, data: Dict[str, str]):
    """
    Update lead in database with extracted contact information.
    Only updates fields that are new or have changed.
    
    Args:
        session_id: Unique session identifier
        data: Dictionary of extracted fields
    """
    try:
        # Check if lead exists
        existing = supabase_client.table("leads").select("*").eq("session_id", session_id).execute()
        
        if existing.data:
            # Get existing lead data
            existing_lead = existing.data[0]
            
            # Only update fields that are new or different
            updates = {}
            for key, value in data.items():
                existing_value = existing_lead.get(key)
                # Update if field is empty or value is different
                if not existing_value or existing_value != value:
                    updates[key] = value
            
            if updates:
                supabase_client.table("leads").update(updates).eq("session_id", session_id).execute()
                logger.info("Updated lead contact info: %s", session_id)
            else:
                logger.debug("No new data to update for: %s", session_id)
        else:
            # Create new lead with extracted data
            data["session_id"] = session_id
            supabase_client.table("leads").insert(data).execute()
            logger.info("Created lead with contact info: %s", session_id)
            
    except Exception as e:
        logger.error("Database error in extractor: %s", e)
