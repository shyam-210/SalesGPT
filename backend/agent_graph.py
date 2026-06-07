"""
SalesGPT - LangGraph Agentic Workflow
Phase 4: Structured Background Tasks

This module defines the LangGraph StateGraph that sequentially runs
the Extractor and the Judge, then safely updates the database in one step.
"""

import os
from typing import TypedDict, List, Dict, Optional, Any
from langgraph.graph import StateGraph, START, END

from backend.judge import analyze_lead
from backend.extractor import extract_lead_data
from backend.utils import get_logger
from supabase import create_client, Client

logger = get_logger(__name__)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if SUPABASE_URL and SUPABASE_KEY:
    supabase_client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
else:
    supabase_client = None


class AgentState(TypedDict):
    session_id: str
    chat_history: List[Dict[str, str]]
    # Outputs
    extracted_data: Optional[Dict[str, Any]]
    judge_result: Optional[Dict[str, Any]]


async def extractor_node(state: AgentState) -> dict:
    """Run the LLM data extractor on the chat history."""
    logger.info("Graph: Running extractor node for %s", state["session_id"])
    extracted = await extract_lead_data(state["session_id"], state["chat_history"])
    return {"extracted_data": extracted or {}}


async def judge_node(state: AgentState) -> dict:
    """Run the LLM BANT judge on the chat history."""
    logger.info("Graph: Running judge node for %s", state["session_id"])
    judge_res = await analyze_lead(state["session_id"], state["chat_history"])
    return {"judge_result": judge_res or {}}


async def db_update_node(state: AgentState) -> dict:
    """Commit both the extracted data and judge score to Supabase safely."""
    session_id = state["session_id"]
    extracted = state.get("extracted_data") or {}
    judge = state.get("judge_result") or {}
    
    logger.info("Graph: Running db_update node for %s", session_id)
    
    if not supabase_client:
        logger.error("Supabase client not initialized in agent_graph.")
        return {}

    try:
        # Check if lead exists
        existing = supabase_client.table("leads").select("*").eq("session_id", session_id).execute()
        
        updates = {}
        
        # Merge extracted data (only overwrite if new/changed)
        if existing.data:
            existing_lead = existing.data[0]
            for key, value in extracted.items():
                if not existing_lead.get(key) or existing_lead.get(key) != value:
                    updates[key] = value
        else:
            updates.update(extracted)
        
        # Merge judge data
        if judge:
            updates["lead_score"] = judge.get("score", 0)
            updates["pipeline_status"] = judge.get("stage", "Visitor")
            updates["notes"] = judge.get("reasoning", "")
            updates["email_intent"] = judge.get("email_intent", "general_followup")
            updates["email_context"] = judge.get("email_context", "")
            
        if updates:
            if existing.data:
                supabase_client.table("leads").update(updates).eq("session_id", session_id).execute()
                logger.info("Graph: Safely updated existing lead %s", session_id)
            else:
                updates["session_id"] = session_id
                supabase_client.table("leads").insert(updates).execute()
                logger.info("Graph: Safely created new lead %s", session_id)
        else:
            logger.debug("Graph: No updates needed for %s", session_id)
            
    except Exception as e:
        logger.error("Graph: Database update error for %s: %s", session_id, e)
        
    return {}


def build_graph():
    """Build and compile the LangGraph StateGraph."""
    workflow = StateGraph(AgentState)
    
    # Add nodes
    workflow.add_node("extractor", extractor_node)
    workflow.add_node("judge", judge_node)
    workflow.add_node("db_update", db_update_node)
    
    # Add edges
    workflow.add_edge(START, "extractor")
    workflow.add_edge("extractor", "judge")
    workflow.add_edge("judge", "db_update")
    workflow.add_edge("db_update", END)
    
    return workflow.compile()

# Compile the graph
agent_graph = build_graph()

async def run_agent_graph(session_id: str, chat_history: List[Dict[str, str]]):
    """Entry point for the background task to run the graph."""
    try:
        logger.info("Starting LangGraph workflow for session %s", session_id)
        state = {
            "session_id": session_id,
            "chat_history": chat_history,
            "extracted_data": {},
            "judge_result": {}
        }
        await agent_graph.ainvoke(state)
        logger.info("Finished LangGraph workflow for session %s", session_id)
    except Exception as e:
        logger.error("Error in LangGraph workflow: %s", e, exc_info=True)
