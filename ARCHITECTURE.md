# SalesGPT Architecture Documentation

## Overview
SalesGPT is a state-of-the-art AI-powered lead generation and qualification system. It employs a **Dual-Track Architecture** to provide sub-second responses to end-users while running complex, multi-agent analysis pipelines in the background.

## Core Stack
- **Frontend:** React + Vite + TailwindCSS + TanStack React Query
- **Backend:** Python FastAPI + LangGraph + LangChain
- **LLM Provider:** Groq (Llama 3.3 for Chat, Llama 3.1 for Extraction/Judging)
- **Database:** Supabase (PostgreSQL with `pgvector`)
- **Deployment:** Cloudflare Pages (Frontend) + Render (Backend Docker Container)

## The Dual-Track Architecture

### 1. Fast Track (Synchronous)
The Fast Track prioritizes user experience by returning answers as fast as possible (<1.5 seconds).
1. User sends a message via the ChatWidget.
2. The FastAPI backend performs Contextual RAG (Retrieval-Augmented Generation) using `all-MiniLM-L6-v2` embeddings to search the `documents` table via Supabase RPC (`match_documents`).
3. Groq's `llama-3.3-70b-versatile` answers the user immediately based on the retrieved context.
4. The response is returned to the frontend.

### 2. Slow Track (Asynchronous Agentic Workflow)
Once the Fast Track returns the response, FastAPI kicks off a background task using **LangGraph**. This is the "agentic" part of the application.

#### LangGraph State Machine (`backend/agent_graph.py`)
The `AgentState` flows through three sequential nodes:
1. **Extractor Node:** Uses `llama-3.1-8b-instant` to scan the chat history and extract strict JSON contact info (Name, Company, Email, Phone, Role, Needs).
2. **Judge Node:** Uses `llama-3.1-8b-instant` to evaluate the lead against the **BANT** (Budget, Authority, Need, Timeline) framework. It generates a score (0-100), a pipeline stage, and determines the `email_intent` (what exactly the user asked for).
3. **Database Update Node:** Consolidates the outputs from the Extractor and Judge, and safely commits them to the `leads` table in Supabase. This sequential update eliminates race conditions.

## Database Schema

- **`documents`:** Stores chunked markdown files with vector embeddings.
- **`chats`:** Tracks the high-level conversation state.
- **`conversations`:** Granular message history (role, message) linked to `session_id`.
- **`leads`:** The CRM table. Stores contact info, lead score, pipeline status, and email context. Auto-updated by the LangGraph pipeline.

### Auto-Migrations
The application automatically executes `schema.sql` on startup via `psycopg2` in `backend/db_setup.py`, ensuring that all tables, vector extensions, and RPC functions exist before accepting traffic.

## CI/CD Pipeline
GitHub Actions automatically deploy the application on push:
- **Frontend:** Deployed to Cloudflare Pages via Wrangler action, creating preview URLs for every branch.
- **Backend:** Deployed to Render via a Deploy Hook trigger.
