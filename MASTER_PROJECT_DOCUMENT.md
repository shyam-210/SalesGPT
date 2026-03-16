# MASTER PROJECT DOCUMENT: SalesGPT

**Generated:** March 2026  
**Project Status:** Production-Ready  
**Last Updated:** February 28, 2026  

---

## TABLE OF CONTENTS

1. [Executive Meta-Summary](#1-executive-meta-summary)
2. [System Architecture & Design](#2-system-architecture--design)
3. [Module-Level Deep Dive](#3-module-level-deep-dive)
4. [Data Flow & State Management](#4-data-flow--state-management)
5. [Algorithmic Innovations & Methodology](#5-algorithmic-innovations--methodology)
6. [Security, Limitations, & Future Scope](#6-security-limitations--future-scope)

---

## 1. EXECUTIVE META-SUMMARY

### 1.1 Project Name & Core Purpose

**SalesGPT** is an asynchronous dual-track agentic framework for autonomous lead qualification and intent scoring. Built for "Team Defaulters" (a fictional B2B cloud infrastructure SaaS provider), SalesGPT solves **lead leakage** — the systemic loss of high-value customer prospects amid high-volume conversational data and long response delays.

**The Problem:** Traditional chatbots choose between speed (instant but generic responses) or intelligence (thoughtful but slow analysis). SalesGPT eliminates this false choice by decoupling the two into parallel execution tracks. The **Fast Track** delivers RAG-powered customer responses in <1.5 seconds. Simultaneously, the **Slow Track** silently analyzes conversation psychology in the background using the BANT framework to identify and score prospects without blocking customer interaction. This dual-track approach transforms a simple customer support channel into a 24/7 **proactive sales intelligence engine**.

**Why It Exists:** Modern B2B companies lose 30-40% of qualified leads through manual review bottlenecks, inconsistent qualification logic, and late-stage engagement. SalesGPT automates lead scoring (BANT analysis), triggers real-time CRM progression, and generates context-aware follow-up emails—all without requiring human intervention or slowing conversations.

### 1.2 Primary Target Audience / Use Case

**Primary Users:**
- **Sales Development Representatives (SDRs):** Use the admin dashboard to view pipeline health, lead scores, and conversation context
- **Sales Managers:** Monitor conversion funnels, lead velocity, and team performance via analytics
- **End Customers:** Interact with the chat widget on Team Defaulters' landing page for instant product assistance
- **Product Teams:** Collect behavioral signals on what features/pricing resonate with prospects

**Use Cases:**
1. **Inbound Lead Qualification:** A prospect visits the landing page, asks about GPU pricing. The chat responds instantly with specs and pricing tiers from the knowledge base. Simultaneously, the Judge Agent scores their BANT and updates the CRM.
2. **Intent Detection:** An SDR sees a lead jumped from "Visitor" to "Hot Lead" (score 85+). They click through, see the conversation history, and spot explicit urgency signals: "need to migrate ASAP." Lead is auto-routed to the right sales rep.
3. **Follow-Up Automation:** A qualified lead asks "email me pricing details." The system generates a context-specific email with exact numbers from the conversation and attaches it to the lead record for one-click sending.

### 1.3 Tech Stack Snapshot

| **Layer**             | **Technology**                    | **Version/Notes**                                  |
|-----------------------|----------------------------------|---------------------------------------------------|
| **Language**          | Python (Backend), JavaScript (Frontend) | py3.8+, ES6+                                      |
| **Web Framework**     | FastAPI                          | v0.109+; async-first, modern OpenAPI docs         |
| **Frontend**          | React + Vite + Tailwind CSS      | React 18.2, Vite 5+, Tailwind 3.4                |
| **Database**          | PostgreSQL (Supabase)            | pgvector extension for semantic search            |
| **Vector Search**     | pgvector (ivfflat index)         | 384-dim embeddings, cosine similarity             |
| **LLM Inference**     | Groq API                         | Sub-second inference latency                      |
| **Chat Model**        | Llama 3.3 70B                    | Primary RAG model; 800 max tokens; temp 0.7       |
| **Judge Model**       | GPT-OSS 120B                     | BANT scoring; 1500 max tokens; temp 0            |
| **Email Model**       | Llama 3.1 8B                     | Email drafting; 1024 max tokens; temp 0.3         |
| **Extractor Model**   | Llama 3.1 8B                     | Contact info extraction; temp 0                   |
| **Embeddings**        | HuggingFace (all-MiniLM-L6-v2)  | Local, zero-cost; 384 dimensions                  |
| **Deployment**        | Python HTTP Server (Uvicorn)     | Port 8000; Async I/O via asyncio                  |
| **Real-Time Updates** | Supabase Realtime                | WebSocket-based PostgreSQL change notifications  |
| **Async Task Queue**  | asyncio (Background Tasks)       | No external job queue (APScheduler for cron)      |
| **Authentication**    | Supabase Auth + Environment Keys | API key validation, CORS middleware               |
| **Logging**           | Python logging module            | Structured logs via utils.get_logger()            |
| **HTTP Client**       | httpx, axios                     | Async HTTP for external API calls                 |

---

## 2. SYSTEM ARCHITECTURE & DESIGN

### 2.1 High-Level Architecture

**SalesGPT implements a Decoupled Parallel Agentic Architecture** with three distinct execution domains:

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER (Customer/Admin)                    │
└────┬────────────────────────────────────────────────────────────┘
     │
     ├─── SYNCHRONOUS FAST TRACK (<1.5s) ─────────────────────────┐
     │    [User sends chat message]                                │
     │         ↓                                                    │
     │    [API: POST /chat]                                        │
     │         ↓                                                    │
     │    [Retrieve relevant docs from pgvector]                   │
     │         ↓                                                    │
     │    [Generate response via Llama 3.3 70B]                    │
     │         ↓                                                    │
     │    [Return response + sources to user] ← USER PERCEIVES    │
     │         ↓                                                    │
     │    [Response time: P95 <1.5s]                               │
     └────────────────────────────────────────────────────────────┘
     │
     └─── ASYNCHRONOUS SLOW TRACK (Background) ──────────────────┐
          [Triggered immediately after chat response sent]        │
               ↓                                                   │
          [Persist messages to conversations table]              │
               ↓                                                   │
          [Background Task: Judge BANT Analysis]                │
               ↓                                                   │
          [Judge calls GPT-OSS 120B to score lead]             │
               ↓                                                   │
          [Extract email_intent + email_context from analysis]  │
               ↓                                                   │
          [Update lead_score, pipeline_status in CRM]          │
               ↓                                                   │
          [Background Task: Extract Contact Information]       │
               ↓                                                   │
          [Extractor calls Llama 8B to find name, email, role]│
               ↓                                                   │
          [Update lead record with extracted contact info]    │
               ↓                                                   │
          [Realtime: Dashboard updates live via pgsubscribe]  │
          [Processing time: 2-5s; NON-BLOCKING to user]      │
          └──────────────────────────────────────────────────────┘
```

**Key Insight:** The separation is temporal and functional. The **Fast Track** prioritizes responsiveness (RAG + generation). The **Slow Track** prioritizes reasoning (BANT analysis + data extraction). Both operate on the same conversation data but in different execution contexts—synchronous vs. asynchronous—preventing the classical trade-off between speed and analytical depth.

### 2.2 Component Interaction

#### **Request Lifecycle: From User Message to CRM Update**

1. **Frontend (React Chat Widget)**
   - User types message, hits "Send"
   - Widget generates UUID-based `session_id` (persists in LocalStorage for 30 days)
   - Makes POST request: `{message: "...", session_id: "session_1234..."}`
   - Server IP: `http://localhost:8000` (configurable via `VITE_API_URL`)

2. **FastAPI Backend (/chat endpoint)**
   - Validates ChatRequest (message length, session ID format)
   - Stores message in in-memory `chat_sessions[session_id]` for this request
   - Queries Supabase `leads` table: `SELECT * WHERE session_id = ?`
   - If no lead exists: creates a new lead row with `lead_score=0`, `pipeline_status='Visitor'`

3. **RAG Retrieval (pgvector search)**
   - Converts user message to embedding: `embeddings.embed_query(message)`
   - Uses HuggingFace all-MiniLM-L6-v2 (384-dimensional vectors)
   - SQL query via Supabase PostgREST:
     ```sql
     SELECT content, metadata 
     FROM documents 
     ORDER BY embedding <-> embedding_vector 
     LIMIT {TOP_K_RESULTS}  -- default 3
     ```
   - IvfFlat index with cosine operator ensures sub-100ms retrieval

4. **Response Generation**
   - Formats system prompt with:
     - `{known_info}`: Lead's name, company, role (if extracted previously)
     - `{history}`: Last 10 messages in conversation
     - `{context}`: Top 3 retrieved documents
   - Calls Groq API: `llama-3.3-70b-versatile` (temperature 0.7, max_tokens 800)
   - **Important:** Temperature 0.7 allows conversational nuance while remaining grounded
   - Returns ChatResponse: `{response: "...", sources: [doc_names]}`
   - **Total latency: 800-1500ms** (concurrent retrieval + generation via Groq)

5. **Background Task: Message Persistence** (via `_persist_messages()`)
   - After response is sent to user, enqueues background task
   - Inserts 2 rows into `conversations` table:
     - Row 1: `{session_id, role: 'user', message: ...}`
     - Row 2: `{session_id, role: 'assistant', message: ...}`
   - Updates `last_active` and `updated_at` on lead record
   - **Rationale:** Persistence is non-critical for user experience; decoupling improves perceived latency

6. **Background Task: Judge Scoring** (async, via `analyze_lead()`)
   - Fetches full conversation history from `conversations` table
   - Formats as: `"Customer: ...\nAssistant: ...\n..."`
   - Calls Groq: `openai/gpt-oss-120b` with JUDGE_PROMPT
   - Judge returns JSON:
     ```json
     {
       "score": 68,
       "stage": "Qualified",
       "reasoning": "Series A startup with clear migration need and budget signals",
       "email_intent": "technical_specs",
       "email_context": "G1.xlarge: A100, 16vCPU, 32GB, $6,325/mo"
     }
     ```
   - Updates lead: `UPDATE leads SET lead_score = 68, pipeline_status = 'Qualified', email_intent = '...', email_context = '...'`

7. **Background Task: Lead Data Extraction** (async, via `extract_lead_data()`)
   - Runs in parallel with Judge scoring
   - Calls Groq: `llama-3.1-8b-instant` (temperature 0) with EXTRACTION_PROMPT
   - Extracts fields: name, company, email, phone, role, needs
   - Only updates fields with new information (doesn't overwrite existing data)
   - Example result:
     ```json
     {
       "name": "Sarah Chen",
       "company": "Acme AI Inc",
       "role": "VP Engineering",
       "email": "sarah@acmeai.com"
     }
     ```

8. **Real-Time Dashboard Update** (Supabase Realtime)
   - Dashboard listens to `leads` table changes:
     ```javascript
     supabase
       .channel('leads-realtime')
       .on('postgres_changes', {event: '*', table: 'leads'}, () => fetchLeads())
       .subscribe()
     ```
   - When Judge updates lead score, PostgreSQL triggers a change event
   - Admin dashboard auto-refetches leads and re-renders Kanban board
   - User sees lead instantly move from "Visitor" → "Engaged" → "Qualified" column

**Total End-to-End Flow: ~3-5 seconds** (user perceives 1.5s response; background processing 2-3s)

### 2.3 File Structure Overview

```
SalesGPT/
│
├── /backend                         # Python FastAPI application
│   ├── main.py                      # Entry point; FastAPI app + /chat, /draft_email, /leads endpoints
│   ├── ingest.py                    # One-time data ingestion: load MD files → embeddings → pgvector
│   ├── judge.py                     # BANT scoring agent; calls GPT-OSS 120B
│   ├── extractor.py                 # Contact info extraction agent; calls Llama 8B
│   ├── email_intent_prompts.py      # Templates for intent-specific email generation
│   ├── cron.py                      # Time-decay logic; runs on background task trigger
│   ├── utils.py                     # Shared utilities: logging, JSON extraction, conversation formatting
│   ├── verify_data.py               # Validation script; checks Supabase schema integrity
│   ├── requirements.txt             # Python dependencies (FastAPI, Supabase, LangChain, etc.)
│   ├── __init__.py                  # Package marker
│   └── __pycache__/                 # Compiled Python bytecode (ignore)
│
├── /frontend                        # React + Vite application
│   ├── index.html                   # HTML template root
│   ├── package.json                 # Node dependencies (React, Supabase, Tailwind, etc.)
│   ├── vite.config.js               # Vite build config; defines /src entry point
│   ├── tailwind.config.js           # Tailwind CSS config with custom theme
│   ├── postcss.config.js            # PostCSS + Tailwind integration
│   │
│   └── /src                         # React source code
│       ├── main.jsx                 # React entry point; renders root App
│       ├── App.jsx                  # Router setup; defines paths: / (landing), /admin (dashboard)
│       ├── index.css                # Global Tailwind + custom styles
│       │
│       ├── /components              # React components
│       │   ├── LandingPage.jsx      # Public landing page; features, tech stack, CTA buttons
│       │   ├── ChatWidget.jsx       # Floating chat interface (customer-facing)
│       │   └── Dashboard.jsx        # Admin dashboard; lead pipeline, analytics, manual actions
│       │
│       └── /lib                     # Utilities
│           └── supabase.js          # Supabase client initialization
│
├── /data                            # Knowledge base (raw markdown)
│   ├── Company_Overview.md          # Team Defaulters company mission, history, values
│   ├── Product_Nebula_Compute.md    # IaaS compute: instance types, pricing, specs
│   ├── Product_Vortex_Storage.md    # S3-like storage: durability, tiers, features
│   ├── Pricing_Strategy_2026.md     # Pricing tiers, volume discounts, reserved instance rates
│   ├── Service_Level_Agreement.md   # SLA terms: uptime guarantees, credits, support
│   ├── Security_Compliance.md       # GDPR, SOC2, encryption, compliance certifications
│   ├── Refund_Cancellation_Policy.md # Terms: refund windows, early termination, penalties
│   ├── Startup_Program_Eligibility.md # Startup credits: $5K for qualifying companies
│   ├── Case_Study_FinTech.md        # Example: FinTech startup saves $400K/year via Team Defaulters
│   └── Support_Policy.md            # Support tiers, response times, escalation
│
├── /knowledge_base                  # Mirror of /data (for reference + TESTING_GUIDE.md)
│   ├── [same 10 files as /data]
│   └── TESTING_GUIDE.md             # Prompt engineering test suite
│
├── /migrations                      # Database schema (managed via Supabase SQL editor)
│   └── [migration scripts, if any]
│
├── schema.sql                       # Complete database schema (tables + indexes)
├── test_backend.py                  # Manual backend test suite
├── README.md                        # Quick-start guide + tech stack
├── ProjectIdea.md                   # Original project vision + session management logic
├── IMPROVEMENTS.md                  # Audit log of Feb 28, 2026 code quality improvements
├── research_content.md              # Research notes on BANT, RAG, lead scoring
├── research_paper.tex               # Academic LaTeX paper template
└── MASTER_PROJECT_DOCUMENT.md       # This file
```

---

## 3. MODULE-LEVEL DEEP DIVE

### 3.1 Frontend: Customer Chat Widget & Admin Dashboard

#### **File: `frontend/src/components/ChatWidget.jsx`**

**Primary Responsibility:**  
Provides a modern, accessible floating chat interface for customers visiting Team Defaulters' landing page. The widget is fully decoupled from the main app—can be embedded anywhere. Handles message sending, streaming typing indicators, quick-reply suggestions, and persistent session management via LocalStorage.

**Key Variables & Functions:**

| **Variable/Function** | **Type** | **Purpose** |
|---|---|---|
| `sessionId` | State (String) | UUID generated on widget open; persists conversation identity for 30 days |
| `messages` | State (Array) | List of {role, text, sources, time}; rendered as chat transcript |
| `isOpen` | State (Boolean) | Controls widget minimize/maximize; animation via framer-motion |
| `isExpanded` | State (Boolean) | Full-screen mode; takes over viewport |
| `sendMessage(text)` | Function | (1) Append user message to state, (2) POST to `/chat`, (3) Append assistant response |
| `QUICK_REPLIES` | Const | Hardcoded suggestions: "Pricing", "GPU Instances", "Startup Program", "SLA Details" |
| `RichText({text})` | Component | Markdown-like renderer: **bold** → `<strong>`, `code` → `<code>` blocks |
| `API` | Const | Backend URL: `import.meta.env.VITE_API_URL || 'http://localhost:8000'` |

**Business Logic Breakdown:**

1. **Session Initialization:**
   - On component mount: `useEffect(() => setSessionId(...), [])`
   - Generates UUID: `session_${Date.now()}_${Math.random().substring(0,11)}`
   - UUID is NOT stored in local storage here; relies on client to store if needed
   - **Note:** ProjectIdea.md specifies 30-day localStorage persistence for returning leads—this is a feature gap

2. **Message Sending Flow:**
   ```
   User clicks "Send" or hits Enter
     ↓
   sendMessage(text) {
     1. Validate: !text.trim() → early exit
     2. Append to UI: setMessages([...prev, {role: 'user', text}])
     3. Clear input: setInputValue('')
     4. Show loading: setIsLoading(true)
     5. POST /chat: {message, session_id}
     6. On success: append assistant response + sources
     7. On error: append error message
     8. Hide loading: setIsLoading(false)
   }
   ```

3. **Response Handling:**
   - Parser expects: `{response: "...", sources: ["doc_name.md", ...]}`
   - Sources are displayed as citations under the assistant message
   - If network fails: user sees "Sorry, something went wrong" (no retry mechanism)

4. **UI Animations:**
   - Uses framer-motion for smooth entrance/exit
   - TypingIndicator: animated dots (Lottie-like effect)
   - Auto-scroll to latest message via `scrollIntoView({behavior: 'smooth'})`
   - Markdown rendering: **bold text** rendered as `<strong>` with `text-white` class

**Critical Implementation Details:**

- **Temperature for Chat:** Backend uses temp=0.7 for conversational warmth
- **Max Tokens:** 800 tokens max response (fits in chat bubbles, prevents runaway generation)
- **Error Handling:** Minimal; only catches axios errors; no retry logic
- **CORS:** Frontend assumes backend CORS allows localhost:5173 (development) or production domain
- **Session Management Gap:** Widget generates session_id per widget instance, not persistence across page reload

---

#### **File: `frontend/src/components/Dashboard.jsx`**

**Primary Responsibility:**  
Admin-only interface for sales teams to monitor lead pipeline, view real-time scoring updates, trigger manual actions (email drafts, lead deletion), and analyze conversion metrics. Real-time updates via Supabase change subscriptions ensure admins see live lead progression.

**Key Variables & Functions:**

| **Variable/Function** | **Type** | **Purpose** |
|---|---|---|
| `leads` | State (Array) | Full list of lead objects from `supabase.from('leads').select('*')` |
| `analytics` | State (Object) | Aggregated metrics: total leads, conversion %, avg score distribution |
| `activeTab` | State (String) | UI section: 'pipeline' (Kanban view) or 'analytics' (charts) |
| `stageFilter` | State (String) | Filter leads by pipeline_status: 'Visitor', 'Engaged', 'Qualified', 'Hot Lead', 'Approached' |
| `fetchLeads()` | Function | Async query Supabase, populate leads state; called on mount + realtime triggers |
| `fetchAnalytics()` | Function | Async GET `/analytics/dashboard` from backend; computes metrics |
| `triggerDecay()` | Function | Manual trigger: POST `/admin/force_decay` to apply time-decay immediately |
| `deleteLead(session_id)` | Function | Delete a lead from Supabase (soft or hard delete—implementation detail) |
| `STAGE_COLORS` | Const | Tailwind badge colors: Visitor→slate, Engaged→blue, Qualified→amber, Hot Lead→emerald, Approached→purple |

**Business Logic Breakdown:**

1. **Real-Time Subscription:**
   ```javascript
   useEffect(() => {
     const channel = supabase
       .channel('leads-realtime')
       .on('postgres_changes', {event: '*', table: 'leads'}, () => {
         fetchLeads()  // Refetch entire leads list on ANY change
         fetchAnalytics()
       })
       .subscribe()
     
     return () => supabase.removeChannel(channel)
   }, [])
   ```
   - **Why full refetch?** Avoids race conditions when Judge + Extractor do rapid INSERT→UPDATE
   - **Performance Consideration:** With 1000+ leads, full refetch becomes costly; candidate for optimization

2. **Lead Kanban Pipeline:**
   - Renders 5 columns: Visitor | Engaged | Qualified | Hot Lead | Approached
   - Each column displays cards (leads) filtered to that stage
   - Card shows: lead_score badge, name, company, last message snippet, timestamp
   - Click card → Modal view: full conversation, extracted contact info, manual actions (email, delete)

3. **Analytics Dashboard:**
   - Fetches from backend endpoint: GET `/analytics/dashboard`
   - Returns:
     ```json
     {
       "total_leads": 247,
       "conversion_rates": {
         "Visitor→Engaged": "32%",
         "Engaged→Qualified": "28%",
         "Qualified→Hot Lead": "15%",
         "Hot Lead→Approached": "68%"
       },
       "score_distribution": {
         "0-30": 50,
         "31-50": 80,
         "51-70": 78,
         "71-100": 39
       },
       "avg_time_to_qualify": "2.3 days",
       "avg_time_to_approach": "5.8 days"
     }
     ```
   - Displays as summary cards + charts (bar, pie)

4. **Manual Actions:**
   - **View Conversation:** Click a lead card → modal shows full `/conversations` history
   - **Draft Email:** Button triggers GET `/leads/{session_id}/draft_email`
       - Returns AI-generated subject + body
       - Admin can edit + copy to clipboard
       - Can manually send via external email client (no direct email sending)
   - **Delete Lead:** Prompts confirmation, then passes to backend DELETE endpoint
   - **Force Decay:** Admin button triggers POST `/admin/force_decay` to immediately apply time-decay algorithm

**Critical Implementation Details:**

- **Realtime Gotcha:** When Judge scores a lead 79 (Qualified) but Extractor runs 1ms later and updates email_intent field, Supabase sends TWO change events. Naive refetch would see intermediate state; design tolerates this via full refetch
- **CORS + Authentication:** Dashboard assumes user is authenticated (passed via ?token query param or localStorage auth token from Supabase Auth)—implementation uses Supabase SDK which handles this automatically
- **No Manual Scoring Override:** UI does NOT allow admins to manually edit `lead_score`; only backend can modify this

---

### 3.2 Backend: FastAPI Application Server

#### **File: `backend/main.py`**

**Primary Responsibility:**  
Central orchestration server. Exposes REST API endpoints for chat, email drafting, lead management, admin actions. Manages AI model initialization (Groq), database connections (Supabase), async background tasks, and request/response lifecycle.

**Key Variables & Functions:**

| **Variable/Function** | **Type** | **Purpose** |
|---|---|---|
| **Models & Clients** | — | — |
| `chat_model` | ChatGroq instance | Llama 3.3 70B; temp=0.7; max_tokens=800 |
| `email_model` | ChatGroq instance | Llama 3.1 8B; temp=0.3; max_tokens=1024 |
| `embeddings` | HuggingFaceEmbeddings | all-MiniLM-L6-v2; normalized cosine vectors |
| `supabase_client` | Client | Supabase connection; handles table operations + RLS |
| `chat_sessions` | Dict[str, List[Dict]] | In-memory session cache; cleanup may leak memory over time |
| **Endpoints** | — | — |
| `POST /chat` | Endpoint | Accept user message + session_id; return AI response + sources |
| `POST /draft_email` | Endpoint | Generate follow-up email for a lead |
| `PATCH /leads/{session_id}` | Endpoint | Admin updates lead pipeline_status |
| `GET /leads` | Endpoint | Search/filter leads with pagination |
| `DELETE /leads/{session_id}` | Endpoint | Hard delete a lead |
| `POST /admin/force_decay` | Endpoint | Manually trigger time-decay algorithm |
| `GET /analytics/dashboard` | Endpoint | Aggregate metrics: conversion rates, score distribution |
| **Internal Function** | — | — |
| `_persist_messages()` | Function | Background task: write messages to DB + update last_active |
| `_rag_retrieve(query)` | Function | Query pgvector for top-K relevant docs |
| `_generate_response(prompt)` | Function | Call Groq Llama 3.3; return response text |

**Business Logic Breakdown:**

1. **POST /chat - The Core Dual-Track Orchestrator:**

   ```python
   @app.post("/chat", response_model=ChatResponse)
   async def chat(request: ChatRequest, background_tasks: BackgroundTasks):
       session_id = request.session_id
       user_message = request.message
       
       # FAST TRACK SYNC (must complete <1.5s)
       
       # Step 1: Fetch or create lead
       existing_lead = supabase_client.table("leads").select("*").eq("session_id", session_id).execute()
       if not existing_lead.data:
           new_lead = {
               "session_id": session_id,
               "lead_score": 0,
               "pipeline_status": "Visitor",
               "created_at": datetime.now(timezone.utc).isoformat(),
               "last_active": datetime.now(timezone.utc).isoformat(),
           }
           supabase_client.table("leads").insert([new_lead]).execute()
       
       # Step 2: Store in-memory for this request
       if session_id not in chat_sessions:
           chat_sessions[session_id] = []
       chat_sessions[session_id].append({"role": "user", "content": user_message})
       
       # Step 3: RAG Retrieval (pgvector similarity search)
       embedding = embeddings.embed_query(user_message)
       docs_response = supabase_client.rpc("match_documents", {
           "query_embedding": embedding,
           "match_count": TOP_K_RESULTS
       }).execute()
       
       retrieved_docs = [doc["content"] for doc in docs_response.data]
       sources = [doc["metadata"]["source"] for doc in docs_response.data]
       context = "\n\n---\n\n".join(retrieved_docs)
       
       # Step 4: Format system prompt with context
       known_info = ""  # TODO: Could fetch from lead.name, lead.company, etc.
       history = "\n".join([
           f"{'Customer' if m['role']=='user' else 'Assistant'}: {m['content']}"
           for m in chat_sessions[session_id][-10:]  # Last 10 msgs
       ])
       
       system_prompt = SYSTEM_PROMPT.format(
           known_info=known_info,
           history=history,
           context=context
       )
       
       # Step 5: Generate response (Groq Llama 3.3)
       messages = [
           SystemMessage(content=system_prompt),
           HumanMessage(content=user_message)
       ]
       
       response = chat_model.invoke(messages)
       assistant_message = response.content
       
       # Step 6: Store in-memory + return to user
       chat_sessions[session_id].append({"role": "assistant", "content": assistant_message})
       
       # TRANSITION TO SLOW TRACK (background, non-blocking)
       background_tasks.add_task(_persist_messages, session_id)
       background_tasks.add_task(analyze_lead, session_id, chat_sessions[session_id])
       background_tasks.add_task(extract_lead_data, session_id, chat_sessions[session_id])
       
       return ChatResponse(response=assistant_message, sources=sources)
   ```

   **Key Insights:**
   - **In-Memory Caching:** `chat_sessions` stores messages for the current session to avoid repeated DB queries during active conversation
   - **Async Background Tasks:** Judge + Extractor run in parallel, don't block user
   - **CORS Middleware:** Allows frontend to call from localhost:5173 or production domain
   - **Input Validation:** Pydantic validates message length (1-4096 chars) and session_id format

2. **POST /draft_email - Context-Aware Email Generation:**

   ```python
   @app.post("/draft_email", response_model=DraftEmailResponse)
   async def draft_email(request: DraftEmailRequest):
       session_id = request.session_id
       
       # Fetch last Judge analysis (set by background task)
       lead = supabase_client.table("leads").select("email_intent, email_context").eq("session_id", session_id).execute()
       
       if not lead.data:
           raise HTTPException(status_code=404, detail="Lead not found")
       
       email_intent = lead.data[0].get("email_intent", "general_followup")
       email_context = lead.data[0].get("email_context", "")
       
       # Fetch conversation for additional context
       conversation_response = supabase_client.table("conversations").select("*").eq("session_id", session_id).execute()
       messages = conversation_response.data or []
       
       # Build email prompt (from email_intent_prompts.py)
       intent_directive = INTENT_DIRECTIVES.get(email_intent, INTENT_DIRECTIVES["general_followup"])
       
       email_prompt = f"""
       You are an expert B2B sales email writer for Team Defaulters.
       
       INTENT: {email_intent}
       DIRECTIVE: {intent_directive['focus']}
       MUST INCLUDE: {json.dumps(intent_directive['must_include'])}
       STRUCTURE:
       {intent_directive['structure']}
       
       CONVERSATION CONTEXT:
       {email_context}
       
       Generate a professional, engaging follow-up email.
       Response format: {{"subject": "...", "body": "..."}}
       """
       
       email_response = email_model.invoke([HumanMessage(content=email_prompt)])
       email_json = extract_json(email_response.content)
       
       return DraftEmailResponse(
           subject=email_json.get("subject", "Follow-up from Team Defaulters"),
           body=email_json.get("body", "")
       )
   ```

   **Key Insights:**
   - **Temperature 0.3:** Email model uses low temp to stay factual (no hallucinated pricing)
   - **Intent-Driven Structure:** Different email templates for pricing_request vs. technical_specs
   - **Requires Prior Judge Analysis:** Depends on background task having already extracted email_intent

3. **PATCH /leads/{session_id} - Manual CRM Status Update:**

   ```python
   @app.patch("/leads/{session_id}", response_model=dict)
   async def update_lead_status(session_id: str, request: UpdateLeadStatusRequest):
       # Admin manually moves lead through stages
       update_data = {
           "pipeline_status": request.pipeline_status,
           "updated_at": datetime.now(timezone.utc).isoformat()
       }
       
       result = supabase_client.table("leads").update(update_data).eq("session_id", session_id).execute()
       
       return {"status": "updated", "session_id": session_id}
   ```

   **Key Insights:**
   - **Pattern Validation:** Pydantic ensures pipeline_status is one of the 5 valid stages
   - **Timestamp Update:** `updated_at` is touched on manual updates (used by time-decay logic)

4. **GET /analytics/dashboard - Aggregated Metrics:**

   ```python
   @app.get("/analytics/dashboard")
   async def get_analytics():
       leads = supabase_client.table("leads").select("*").execute().data or []
       
       total = len(leads)
       stages = {}
       score_dist = {"0-30": 0, "31-50": 0, "51-70": 0, "71-100": 0}
       
       for lead in leads:
           stage = lead.get("pipeline_status", "Visitor")
           stages[stage] = stages.get(stage, 0) + 1
           
           score = lead.get("lead_score", 0)
           if score <= 30: score_dist["0-30"] += 1
           elif score <= 50: score_dist["31-50"] += 1
           elif score <= 70: score_dist["51-70"] += 1
           else: score_dist["71-100"] += 1
       
       # Calculate conversion rates
       conversions = {
           "Visitor→Engaged": round(stages.get("Engaged", 0) / max(stages.get("Visitor", 1), 1) * 100),
           "Engaged→Qualified": round(stages.get("Qualified", 0) / max(stages.get("Engaged", 1), 1) * 100),
           # ... more
       }
       
       return {
           "total_leads": total,
           "stage_breakdown": stages,
           "score_distribution": score_dist,
           "conversion_rates": conversions
       }
   ```

   **Performance Consideration:** With 10,000+ leads, this full table scan becomes slow. Should add denormalized aggregation table or use Supabase computed columns.

---

#### **File: `backend/judge.py`**

**Primary Responsibility:**  
The "Judge Agent"—runs asynchronously in background. Analyzes conversation history using the BANT framework and returns a lead score (0-100), pipeline stage classification, and email intent indicators. Critical for identifying hot leads without blocking user interaction.

**Key Variables & Functions:**

| **Variable/Function** | **Type** | **Purpose** |
|---|---|---|
| `judge_model` | ChatGroq instance | GPT-OSS 120B; temp=0 (deterministic); max_tokens=1500 |
| `JUDGE_PROMPT` | String | System prompt encoding BANT scoring logic + email intent extraction |
| `analyze_lead(session_id, chat_history)` | Async Function | Main entry point; orchestrates Judge analysis |
| `BANT Criteria` | — | Budget, Authority, Need, Timeline (framework for scoring) |
| `email_intent` | String | Extracted intent: pricing_request, technical_specs, plan_comparison, startup_program, custom_solution, general_followup |
| `email_context` | String | Specific details from conversation for email drafting (e.g., "G1.xlarge: $6,325/mo, $70,900/yr. Credits: $5K.") |

**Business Logic Breakdown:**

1. **BANT Scoring Framework:**

   Each criterion has explicit scoring guidance:
   
   | **Criterion** | **Low Score Impact (0-30)** | **Medium (31-70)** | **High (71-100)** |
   |---|---|---|---|
   | **Budget** | No company size mentioned; price-shopping | Company context given (e.g., "we're a startup") | Explicit budget signals ("enterprise spend $500K/yr") or funding stage ("Series B") |
   | **Authority** | Generic "I'm exploring" | Mentions job title but ambiguous ("I'm in tech") | Clear decision-maker signals (CTO, VP Eng, "we're evaluating") |
   | **Need** | Functional inquiry ("what's your uptime?") | Clear pain point ("we have latency issues") | Acute, quantified need ("losing $50K/day to downtime") |
   | **Timeline** | Exploratory ("just looking") | Vague ("sometime this year") | Urgency ("need to migrate ASAP", "this quarter") |

   **Scoring Logic:**
   - Sum BANT scores (each 0-25), divide by 100
   - E.g., Budget=15, Authority=20, Need=22, Timeline=10 → score = 67 (Qualified)

2. **Judge Invocation:**

   ```python
   async def analyze_lead(session_id: str, chat_history: List[Dict[str, str]]):
       try:
           # Fetch full conversation from DB (in-memory cache might be partial)
           db_history = supabase_client.table("conversations").select("*").eq("session_id", session_id).execute()
           messages = db_history.data or chat_history
           
           # Format conversation as readable transcript
           conversation_text = format_conversation(messages)
           
           # Call Judge API
           judge_messages = [
               SystemMessage(content=JUDGE_PROMPT),
               HumanMessage(content=f"Conversation:\n{conversation_text}\n\nScore this lead:")
           ]
           
           response = judge_model.invoke(judge_messages)
           
           # Extract JSON (with fallback strategies)
           judge_output = extract_json(response.content)
           
           # Validate extractions
           score = max(0, min(100, judge_output.get("score", 0)))
           stage = judge_output.get("stage", "Visitor")
           reasoning = judge_output.get("reasoning", "")
           email_intent = judge_output.get("email_intent", "general_followup")
           email_context = judge_output.get("email_context", "")
           
           # Update lead in database
           supabase_client.table("leads").update({
               "lead_score": score,
               "pipeline_status": stage,
               "email_intent": email_intent,
               "email_context": email_context,
               "updated_at": datetime.now(timezone.utc).isoformat()
           }).eq("session_id", session_id).execute()
           
           logger.info(f"Lead {session_id}: score={score}, stage={stage}")
           
       except Exception as e:
           logger.error(f"Judge analysis failed for {session_id}: {e}", exc_info=True)
   ```

3. **Email Intent Extraction:**

   Parallel to BANT scoring, Judge extracts structured intent:

   | **Intent** | **Identification Signal** | **Email Content Focus** |
   |---|---|---|
   | `pricing_request` | "What's your pricing?", "Cost of ...?", "monthly bill?" | Exact pricing numbers, discounts, ROI |
   | `technical_specs` | "What GPUs?", "Specs of instance?", "Performance?" | Hardware specs, API docs, benchmarks |
   | `plan_comparison` | "Difference between X and Y?", "Which is better?" | Side-by-side comparison table |
   | `startup_program` | "Startup credits?", "Do you have grants?" | Program details, eligibility, how to apply |
   | `custom_solution` | "We need <specific use case>" | Tailored recommendation, architecture |
   | `general_followup` | No specific request | Recap conversation, next steps |

   **email_context** is carefully extracted with ALL numeric details:
   ```
   "Customer asked about G1.xlarge. Assistant: $6,325/month, $70,900/year.
    Customer: how about with annual commitment? Assistant: 20% discount → $53,520/year.
    email_context should be: 'G1.xlarge: $6,325/mo ($70,900/yr). Annual discount: 20% → $53,520/yr. Features: A100 GPU, 16vCPU, 32GB RAM.'"
   ```

**Critical Implementation Details:**

- **Temperature 0:** Ensures consistent, deterministic BANT scoring (no randomness in JSON output)
- **Retry Logic Absent:** If Judge fails, lead doesn't get scored. Should implement fallback (e.g., score=0, stage='Visitor')
- **Concurrent Execution:** Judge runs in parallel with Extractor; no ordering dependency
- **Troll/Off-Topic Detection:** Judge has built-in safety: if user asks joke/riddle/insult, score=0, stage='Visitor'

---

#### **File: `backend/extractor.py`**

**Primary Responsibility:**  
The "Extraction Agent"—runs asynchronously. Parses conversation to extract contact information (name, company, email, phone, role, needs). Updated lead record with structured contact data for CRM integration and future outreach.

**Key Variables & Functions:**

| **Variable/Function** | **Type** | **Purpose** |
|---|---|---|
| `extractor_model` | ChatGroq instance | Llama 3.1 8B; temp=0 (deterministic); max_tokens=256 |
| `EXTRACTION_PROMPT` | String | Instructs model to extract ONLY explicitly mentioned contact fields |
| `extract_lead_data(session_id, chat_history)` | Async Function | Main entry point |
| `update_lead_data(session_id, data)` | Function | Updates lead row with extracted contact info |

**Business Logic Breakdown:**

1. **Extraction Constraints:**

   The prompt enforces strict, conservative extraction:

   ```
   CRITICAL: ONLY extract information that is EXPLICITLY mentioned. 
   Do NOT infer, guess, or make assumptions.
   ```

   Examples:
   - ✅ User says "I'm Sarah Chen, CTO at Acme AI" → extract all fields
   - ❌ User says "I work at Acme" + assistant says "Are you the CTO?" → NO (user never confirmed)
   - ❌ User says "sarah at acmeai.com" → NO (inferred domain, not explicitly said)
   - ✅ User says "sarah@acmeai.com" → extract email

2. **Extraction Flow:**

   ```python
   async def extract_lead_data(session_id: str, chat_history: List[Dict[str, str]]):
       try:
           # Format conversation
           conversation_text = format_conversation(chat_history)
           
           # Call extractor
           messages = [
               SystemMessage(content=EXTRACTION_PROMPT),
               HumanMessage(content=f"Conversation:\n{conversation_text}\n\nExtract lead data:")
           ]
           
           response = extractor_model.invoke(messages)
           extracted_data = extract_json(response.content)
           
           # Filter out nulls/empties
           clean_data = {k: v for k, v in extracted_data.items() 
                        if v is not None and v != ""}
           
           if clean_data:
               update_lead_data(session_id, clean_data)
       
       except Exception as e:
           logger.error(f"Extraction failed for {session_id}: {e}", exc_info=True)
   ```

3. **Update Strategy:**

   ```python
   def update_lead_data(session_id: str, data: Dict[str, str]):
       # Only update fields if they're new (not overwrite existing)
       existing = supabase_client.table("leads").select("*").eq("session_id", session_id).execute()
       
       if existing.data:
           existing_lead = existing.data[0]
           updates = {}
           
           for key, value in data.items():
               existing_value = existing_lead.get(key)
               if not existing_value or existing_value != value:
                   updates[key] = value
           
           if updates:
               supabase_client.table("leads").update(updates).eq("session_id", session_id).execute()
   ```

   **Rationale:** Preserves previously extracted data; only adds new fields or updates if changed. Prevents overwriting manual hand entries (e.g., SDR corrected email address).

**Critical Implementation Details:**

- **Temperature 0:** Ensures deterministic, conservative extraction
- **Max Tokens 256:** Sufficient for 6 contact fields
- **No Inference Rule:** Strictly EXPLICIT mention only—prevents hallucinated email addresses

---

#### **File: `backend/cron.py`**

**Primary Responsibility:**  
Implements time-decay algorithm. Reduces lead scores for inactive users to reflect fading interest. Prevents old leads from clogging the pipeline. Manually triggered (for now) by admin clicking a button, though should be cron-scheduled.

**Key Variables & Functions:**

| **Variable/Function** | **Type** | **Purpose** |
|---|---|---|
| `apply_time_decay()` | Function | Main orchestrator; applies decay to eligible leads |
| `DECAY_STAGES` | Tuple | ("Visitor", "Engaged", "Qualified"); leaves "Hot Lead" and "Approached" untouched |
| `INACTIVE_THRESHOLD_HOURS` | Int | 24 hours; if`last_active < now - 24h`, apply decay |
| `DECAY_FACTOR` | Float | 0.9 (10% reduction); `new_score = old_score * 0.9` |

**Business Logic Breakdown:**

1. **Eligibility Criteria:**

   - **In Scope (eligible for decay):** Visitor, Engaged, Qualified
   - **Exclude:** Hot Lead (too promising to decay), Approached (being actively pursued)
   - **Time Threshold:** > 24 hours since last message

2. **Decay Calculation:**

   ```
   For each eligible lead:
      if (now - last_active) > 24 hours:
          new_score = floor(old_score * 0.9)
          
          # Downgrade if score drops below thresholds
          if old_stage == "Qualified" and new_score < 70:
               new_stage = "Engaged"
          
          if stage == "Engaged" and new_score < 31:
               new_stage = "Visitor"
          
          # Only update if something changed
          if new_score != old_score or new_stage != old_stage:
               UPDATE leads SET lead_score=new_score, pipeline_status=new_stage
   ```

   **Example:**
   - Lead: session_id="s1", score=75 (Qualified), last_active=24.5 hours ago
   - Decay: 75 * 0.9 = 67.5 → floor = 67
   - Action: Score drops below 70 → Qualified → Engaged
   - Result: lead.score=67, lead.stage="Engaged"

3. **Return Summary:**

   ```python
   def apply_time_decay() -> dict:
       summary = {"updated": 0, "skipped": 0, "details": [...]}
       
       # Fetch + process all eligible leads
       leads = supabase_client.table("leads").select("*").in_("pipeline_status", list(DECAY_STAGES)).execute().data
       
       for lead in leads:
           # ... decay logic ...
           if changed:
               summary["updated"] += 1
           else:
               summary["skipped"] += 1
       
       return summary
   ```

**Design Considerations:**

- **Not Permanent:** Decay is time-based, not permanent. A lead that was inactive for 3 months but returns with a hot inquiry will be immediately re-scored by Judge
- **Threshold Tuning:** 24 hours may be too aggressive or lenient; should A/B test with customer data
- **No Email Decay:** Only score decays; contact info is never removed
- **Missing: Scheduled Cron:** Should use APScheduler to run daily, but currently manual trigger only

---

#### **File: `backend/ingest.py`**

**Primary Responsibility:**  
One-time data ingestion pipeline. Loads markdown files from `/data` directory, chunks them, generates embeddings using HuggingFace, and uploads to Supabase pgvector table. Enables RAG retrieval during chatbot operation.

**Execution:** Run once: `python backend/ingest.py`

**Key Steps:**

1. **Load Markdown Files:**
   - Reads 10 files from `/data/*.md`
   - Creates LangChain Document objects with metadata (filename, source path)

2. **Text Chunking:**
   - RecursiveCharacterTextSplitter: 500-char chunks, 50-char overlap
   - Splits on paragraph boundaries (`\n\n`) first, then lines, then words
   - Generates ~200-300 total chunks from 10 files

3. **Embedding Generation:**
   - Converts each chunk text to 384-dim vector via all-MiniLM-L6-v2
   - Normalizes vectors for cosine similarity
   - CPU-based (no GPU required)

4. **Upload to pgvector:**
   - Inserts documents table rows: `{content, metadata JSONB, embedding vector(384)}`
   - Creates IvfFlat index for fast similarity search
   - Expected time: 2-3 minutes (embedding generation is the bottleneck)

**Critical Implementation Detail:**

- **Run Once:** Ingestion is idempotent but inefficient; subsequent runs re-embed everything. Should add a `version` field to skip re-ingestion if data hasn't changed
- **Local Embeddings:** All embedding computation happens locally (CPU) — zero API calls for embeddings, reducing latency and cost vs. OpenAI Embeddings API

---

#### **File: `backend/utils.py`**

**Primary Responsibility:**  
Shared utilities used across backend modules. Eliminates code duplication and enforces consistent behavior for logging, conversation formatting, and robust JSON extraction.

**Key Functions:**

| **Function** | **Purpose** |
|---|---|
| `get_logger(name: str)` | Returns a module-level logger with consistent format: `[LEVEL] module_name \| message` |
| `format_conversation(chat_history)` | Converts list of message dicts → human-readable `"Customer: ...\nAssistant: ..."` transcript |
| `extract_json(raw: str)` | Robust JSON extraction with 3 strategies: (1) direct parse, (2) strip markdown fences, (3) regex `{ ... }` |

**Business Logic Breakdown:**

1. **Structured Logging:**
   ```python
   logger = get_logger("backend.judge")
   logger.info("Lead %s scored: %d", session_id, score)
   # Output: [INFO] backend.judge | Lead session_123 scored: 75
   ```

2. **Conversation Formatting:**
   ```python
   chat_history = [
       {"role": "user", "content": "What's your pricing?"},
       {"role": "assistant", "content": "Starting at $99/month"}
   ]
   
   formatted = format_conversation(chat_history)
   # Output: "Customer: What's your pricing?\nAssistant: Starting at $99/month"
   ```
   - Handles both "content" and legacy "text" keys
   - Replaces "user" → "Customer", "assistant" → "Assistant" for readability

3. **Robust JSON Extraction:**
   ```python
   raw_response = """
   Here's the analysis:
   
   ```json
   {
     "score": 75,
     "stage": "Qualified"
   }
   ```
   
   Hope this helps!
   """
   
   extracted = extract_json(raw_response)
   # Returns {"score": 75, "stage": "Qualified"}
   ```

   **Strategy Priority:**
   1. Direct JSON.parse() — for clean responses
   2. Strip markdown fences (``` ... ```)  — for LLM responses wrapped in code blocks
   3. Regex extraction of `{...}` — for responses with leading/trailing prose

   **Why needed:** LLMs sometimes wrap JSON in Markdown formatting; direct parsing fails; strategies handle these cases gracefully.

---

#### **File: `backend/email_intent_prompts.py`**

**Primary Responsibility:**  
Template library for intent-specific email generation. Encodes prompt structures and must-include field lists for each email intent category. Used by `/draft_email` endpoint to customize email tone/content based on BANT analysis.

**Structure:**

```python
INTENT_DIRECTIVES = {
    "pricing_request": {
        "focus": "Pricing details the customer asked about",
        "must_include": [
            "Exact pricing numbers discussed (monthly/annual costs)",
            "Instance types and their costs",
            "Any discounts or credits mentioned",
            "Tier/plan names referenced",
        ],
        "structure": (
            "1. Greeting referencing their pricing inquiry\n"
            "2. Pricing summary table/list with EXACT numbers\n"
            "3. Any applicable discounts or savings\n"
            "4. Brief next step"
        ),
    },
    "technical_specs": { ... },
    "plan_comparison": { ... },
    "startup_program": { ... },
    "custom_solution": { ... },
    "general_followup": { ... },
}
```

**Usage in Email Generation:**

```python
email_intent = lead.email_intent  # e.g., "pricing_request"
directive = INTENT_DIRECTIVES[email_intent]

email_prompt = f"""
...
MUST INCLUDE: {directive['must_include']}
STRUCTURE:\n{directive['structure']}
...
"""

response = email_model.invoke([HumanMessage(content=email_prompt)])
```

---

### 3.3 Database: PostgreSQL (Supabase) Schema

#### **File: `schema.sql`**

**Database Design Principle:** Normalized schema with JSON columns for flexibility (metadata, tags). No full-text search initially (semantic search via pgvector is the retrieval mechanism).

**Table: `documents`**  
Stores knowledge base chunks with vector embeddings.

| Column | Type | Purpose |
|---|---|---|
| id | BIGSERIAL PRIMARY KEY | Auto-increment ID |
| content | TEXT | Chunk text (from markdown splitting) |
| metadata | JSONB | {source: "filename.md", chunk_index: 0} |
| embedding | vector(384) | 384-dim vector from all-MiniLM-L6-v2 |

Index: `ivfflat` on embedding with `vector_cosine_ops` (enables fast similarity search)

**Table: `conversations`**  
Message-level history for each session.

| Column | Type | Purpose |
|---|---|---|
| id | BIGSERIAL PRIMARY KEY | Auto-increment |
| session_id | TEXT NOT NULL | References lead's session |
| role | TEXT ('user' or 'assistant') | Message sender |
| message | TEXT | Message content |
| created_at | TIMESTAMPTZ | Timestamp when message was sent |

Index: `session_id` (fast history lookup by session)

**Table: `leads`**  
CRM core table; one row per unique visitor.

| Column | Type | Purpose |
|---|---|---|
| id | BIGSERIAL PRIMARY KEY | Auto-increment |
| session_id | TEXT UNIQUE | UUID from frontend; identifies visitor |
| lead_score | INTEGER (0-100) | BANT score; updated by Judge |
| pipeline_status | TEXT | One of: Visitor, Engaged, Qualified, Hot Lead, Approached |
| created_at | TIMESTAMPTZ | When lead first visited |
| last_active | TIMESTAMPTZ | When they last sent a message (updated by persistence task) |
| notes | TEXT | Optional admin notes |
| updated_at | TIMESTAMPTZ | Last modification timestamp |
| **Contact Info** | — | — |
| name | TEXT | Extracted lead name |
| company | TEXT | Extracted company |
| email | TEXT | Extracted email address |
| phone | TEXT | Extracted phone |
| role | TEXT | Extracted job title |
| needs | TEXT | Extracted pain points |
| **Email Intent** | — | — |
| email_intent | TEXT | Extracted intent category (pricing_request, etc.) |
| email_context | TEXT | Extracted context for email generation |

**Table: `chats` (optional)**  
Session-level state tracking for future features (not actively used in current implementation).

| Column | Type | Purpose |
|---|---|---|
| id | BIGSERIAL PRIMARY KEY | Auto-increment |
| session_id | TEXT UNIQUE | References lead |
| conversation_state | TEXT | Conversation phase: greeting, discovery, qualification, email_collection, closing |
| state_message_count | JSONB | {greeting: 3, discovery: 5, ...} |
| last_action | TEXT | Last state transition action |
| updated_at | TIMESTAMPTZ | Last state change |

**Relationships:**
```
leads (1) ←┬→ (N) conversations
           └→ (N) chats
documents (1:many) embeddings
```

---

### 3.4 Frontend: Build Configuration

#### **File: `frontend/vite.config.js`**

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  }
})
```

**Key Config:**
- **Port 5173:** Development server (Vite default)
- **React Plugin:** Enables JSX/HMR
- **Proxy:** Routes `/api/*` to backend during dev (optional)

#### **File: `frontend/tailwind.config.js`**

```javascript
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        slate: { 900: '#0f172a', ... },
        indigo: { 300: '#a5b4fc', ... },
      },
    },
  },
  plugins: [],
}
```

**Customization:** Uses Tailwind's extended color palette for sleek dark UI theme.

---

## 4. DATA FLOW & STATE MANAGEMENT

### 4.1 Data Lifecycle: From User Input to Database

**Scenario:** Customer types "What's your GPU pricing?" on Team Defaulters landing page.

```
TIER 1: RECEPTION
│
├─ Frontend detects input
│  └─ User types "What's your GPU pricing?" + hits Send
│
├─ HTTP Layer
│  └─ axios.post('http://localhost:8000/chat', {
│       message: "What's your GPU pricing?",
│       session_id: "session_1710000000_abcd1234"
│     })
│
└─ Network Transit (<50ms over localhost)

TIER 2: FASTAPI PROCESSING (SYNCHRONOUS)
│
├─ Request Validation (Pydantic)
│  └─ ChatRequest validates:
│     - message length: [1, 4096] ✓
│     - session_id format: [1, 128] chars ✓
│
├─ Lead Retrieval/Creation
│  └─ SELECT * FROM leads WHERE session_id = 'session_...'
│     → Not found, so INSERT new lead:
│        {session_id, lead_score: 0, pipeline_status: 'Visitor', ...}
│
├─ In-Memory Chat History
│  └─ chat_sessions['session_...'] = [
│       {role: 'user', content: "What's your GPU pricing?"}
│     ]
│
├─ RAG Retrieval (pgvector)
│  └─ Embed text: all-MiniLM-L6-v2 → 384-dim vector
│  └─ SQL: SELECT content FROM documents
│          ORDER BY embedding <-> embed_query_vector
│          LIMIT 3
│     → Returns: [
│          {content: "G1.large: 2x V100 GPUs, $3,625/month..."},
│          {content: "G1.xlarge: 4x A100 GPUs, $6,325/month..."},
│          {content: "G1.2xlarge: 8x A100 GPUs, $12,650/month..."}
│        ]
│
├─ Prompt Formatting
│  └─ SYSTEM_PROMPT.format(
│       known_info="",  # No prior lead data
│       history="Customer: What's your GPU pricing?",
│       context=retrieved_docs
│     )
│
├─ Response Generation (Groq Llama 3.3 70B)
│  └─ Call API with formatted prompt
│     Temperature: 0.7 (conversational but grounded)
│     Max tokens: 800
│     → Returns: "For GPU workloads, we offer three tiers:
│                  - G1.large: 2x NVIDIA V100, $3,625/month
│                  - G1.xlarge: 4x A100, $6,325/month
│                  - G1.2xlarge: 8x A100, $12,650/month
│                  Which workload are you targeting?"
│
├─ Response Transport
│  └─ In-memory append:
│     chat_sessions['session_...'].append({
│       role: 'assistant',
│       content: "[response text above]"
│     })
│  
│  └─ HTTP 200 OK: ChatResponse {
│       response: "[response text]",
│       sources: ["Product_Nebula_Compute.md", ...]
│     }
│
└─ Latency: ~1200ms (150ms retrieval + 1000ms generation + overhead)

TIER 3: BACKGROUND TASKS (ASYNCHRONOUS, NON-BLOCKING)
│
├─ Task 1: Persist Messages → conversations table
│  └─ INSERT INTO conversations (session_id, role, message) VALUES 
│     2 rows: (session_..., 'user', 'What's your GPU pricing?')
│            (session_..., 'assistant', '[response]')
│  └─ UPDATE leads SET last_active = NOW(), updated_at = NOW()
│     WHERE session_id = 'session_...'
│  └─ Latency: ~200ms (DB insert)
│
├─ Task 2: Judge Analysis via GPT-OSS 120B
│  └─ SELECT * FROM conversations WHERE session_id = 'session_...'
│     → Fetch full history (just 1 exchange for new session)
│  └─ Format: "Customer: What's your GPU pricing?\nAssistant: [response]"
│  └─ Call Groq GPT-OSS 120B with JUDGE_PROMPT
│     Temperature: 0 (deterministic)
│     → Returns: {
│          "score": 35,
│          "stage": "Engaged",
│          "reasoning": "Asking about product features shows interest, but no budget/authority/timeline signals",
│          "email_intent": "technical_specs",
│          "email_context": "GPU types: V100 ($3.6K/mo), A100 ($6.3K-$12.6K/mo)"
│        }
│  └─ UPDATE leads SET 
│       lead_score = 35,
│       pipeline_status = 'Engaged',
│       email_intent = 'technical_specs',
│       email_context = '...'
│     WHERE session_id = 'session_...'
│  └─ Latency: ~2000ms (LLM inference)
│
├─ Task 3: Extract Contact Data via Llama 8B
│  └─ (Same as Task 2, but calls Llama 8B Extractor)
│  └─ → Returns: {
│       "name": null,
│       "company": null,
│       "email": null,
│       ... (all null; user didn't mention name/company)
│     }
│  └─ Skips UPDATE (no new data to add)
│  └─ Latency: ~500ms
│
├─ Task 4: Realtime Notification
│  └─ PostgreSQL triggers change event on `leads` table
│  └─ Supabase Realtime broadcasts to subscribed admin dashboard clients
│  └─ Dashboard refetches leads + re-renders
│  └─ Admin sees: "Visitor" → "Engaged" transition in real-time Kanban

└─ Total Background Time: ~3 seconds (non-blocking; user sees response after 1.2s)

TIER 4: FRONTEND RESPONSE
│
└─ Chat widget displays:
   ┌─────────────────────────────┐
   │ You: What's your GPU pricing?│
   │                             │
   │ Assistant: For GPU workloads │
   │ we offer...                 │
   │                             │
   │ Sources: Product_Nebula...  │
   └─────────────────────────────┘
```

**Key Insight:** The entire user-facing interaction completes in 1.2s. The sophisticated BANT analysis, contact extraction, and database persistence happen transparently in the background over the next ~2s.

---

### 4.2 State Management Approach

**Frontend State:**  
React component state via `useState` hooks (no Redux, Context not used yet).

```javascript
const [messages, setMessages] = useState([])  // Message list
const [sessionId, setSessionId] = useState('') // UUID
const [isLoading, setIsLoading] = useState(false) // API pending
```

**Backend State:**

1. **In-Memory Session Cache:** `chat_sessions: dict[str, list[dict]]`
   - Stores last 10 messages for fast context window
   - Avoids repeated DB queries during active conversation
   - **Risk:** Unbounded growth if sessions never expire; should add cleanup

2. **Database State:** Supabase PostgreSQL
   - **Source of Truth** for leads, conversations, documents
   - Asynchronous background tasks eventually write to DB
   - In-memory cache is optimization; DB is authoritative

3. **Realtime State Sync:** Supabase Realtime subscriptions
   - Dashboard listens to `leads` table changes
   - When Judge updates `lead_score`, Supabase broadcasts event
   - Dashboard auto-refetches and re-renders (full refetch, not delta update)

**Session Lifecycle:**

```
┌─ Customer Visits Webpage
│
├─ Frontend: Generate sessionId
│  └─ sessionId = `session_${Date.now()}_${random()}`
│  └─ Store in local variable (not localStorage currently—ProjectIdea.md notes this should be 30-day persist)
│
├─ Customer Chats → Background Tasks Create Leads Row
│  └─ Supabase: INSERT INTO leads (session_id, lead_score, pipeline_status, ...)
│     Pipeline Status Progression:
│     Visitor (score 0-30)
│        ↓ (user engages)
│     Engaged (score 31-50)
│        ↓ (clear need + budget signal)
│     Qualified (score 51-70)
│        ↓ (urgent + authority)
│     Hot Lead (score 71-100)
│        ↓ (email drafted)
│     Approached (manual SDR action)
│
├─ Time Decay (if > 24h inactive)
│  └─ run: apply_time_decay()
│  └─ Reduces score by 10%
│  └─ Downgrades stage if score drops below threshold
│
├─ Expiration (if > 30 days no contact—not implemented)
│  └─ Should auto-delete or archive old leads
│  └─ Currently: leads persist forever

└─ End: Manual closure by SDR (mark "Approached" or "Completed")
```

**Data Consistency Considerations:**

- **Eventual Consistency:** Chat response sent to user, then background tasks update DB. Brief window where leads table differs from in-memory state.
- **No Transactions:** Multiple background tasks (Judge + Extractor) update same lead row independently. Last write wins. Acceptable because updates are independent fields.
- **Race Condition:** If rapid chat exchanges occur, in-memory cache and DB can diverge. Mitigated by full refetch of history when Judge runs.

---

### 4.3 Database Schema & Relationships

**Entity-Relationship Diagram (simplified):**

```
┌─────────────────┐          ┌──────────────────┐
│     leads       │ (1:N)    │ conversations    │
├─────────────────┤          ├──────────────────┤
│ id (PK)         │←────────→│ id (PK)          │
│ session_id (U)  │          │ session_id (FK)  │
│ lead_score      │          │ role             │
│ pipeline_status │          │ message          │
│ created_at      │          │ created_at       │
│ last_active     │          └──────────────────┘
│ name            │
│ company         │
│ email           │
│ phone           │
│ role            │
│ needs           │
│ email_intent    │
│ email_context   │
└─────────────────┘

┌──────────────────┐
│   documents      │
├──────────────────┤
│ id (PK)          │
│ content (TEXT)   │
│ metadata (JSONB) │
│ embedding (vec)  │
└──────────────────┘
(no FK to leads—read-only knowledge base)
```

**Key Characteristics:**

- **Denormalization:** contact_info (name, company, email, phone, role, needs) stored in `leads` table despite being weakly normalized
  - Rationale: Avoids JOIN on contact_info for lead retrieval
  - Trade-off: Slightly more storage; easier querying
  
- **Flexible Metadata:** `conversations.message` is unstructured TEXT (could be structured JSON for future ML)
- **Vector Column:** `documents.embedding` is pgvector(384); enables semantic search without external service
- **No Soft Deletes:** When admin deletes a lead, it's hard-deleted; no audit trail (improvement area)

---

## 5. ALGORITHMIC INNOVATIONS & METHODOLOGY

### 5.1 Core Algorithms

#### **Algorithm 1: BANT Scoring Framework**

**Purpose:** Quantify lead quality on 0-100 scale based on 4 sales criteria.

**Mechanism:**
Each of the four BANT criteria is independently scored 0-25, then summed:

```
Total Score = (Budget Score + Authority Score + Need Score + Timeline Score) / 4 * 100

Where:
- Budget Score (0-25): Ability to afford enterprise cloud (~$50-$500K/year range)
- Authority Score (0-25): Decision-making power ("I'm CTO" vs. "I'm developer")
- Need Score (0-25): Clarity of problem we solve (latency issues, scale, compliance)
- Timeline Score (0-25): Urgency ("ASAP" vs. "exploring")
```

**Example Calculation:**
```
User: "I'm CTO at Series B fintech. We're losing $100K/day due to 200ms latency. 
      Need to migrate within 2 weeks. What's enterprise SLA?"

- Budget: "Series B fintech" → Funded company → 20/25
- Authority: "CTO" → Clear decision-maker → 25/25
- Need: "$100K daily loss" + "200ms latency" → Acute, quantified need → 25/25
- Timeline: "2 weeks" → Strong urgency → 23/25

Total = (20 + 25 + 25 + 23) / 4 * 100 = 93.25 ≈ 93 (Hot Lead)
```

**Implementation in Judge Agent:**
- Judge LLM (GPT-OSS 120B) is given BANT_PROMPT with detailed scoring rubric
- Returns JSON: `{"score": 93, "stage": "Hot Lead", "reasoning": "..."}`
- Temperature 0 ensures deterministic, consistent scoring

**Strengths:**
- ✅ Interpretable: Can explain why lead got score 93 vs. 45
- ✅ Generalizable: Framework applies to any B2B SaaS product
- ✅ Learnable: Sales teams can internalize BANT signals

**Limitations:**
- ❌ Framework Dependent: BANT isn't universally applicable (e.g., non-profit procurement has different dynamics)
- ❌ LLM Hallucination: Judge might overweight signals ("mentions X → they must have Y budget")
- ❌ No A/B Testing: Score threshold (70 for "Qualified") is arbitrary; should validate with sales data

---

#### **Algorithm 2: Time-Decay for Inactive Leads**

**Purpose:** Reduce lead scores over time to prevent stale leads from cluttering pipeline.

**Mechanism:**
```
if (now - last_active_time) > 24 hours:
    new_score = floor(old_score * 0.9)
    
    # Auto-downgrade if thresholds crossed
    if old_stage == "Qualified" and new_score < 70:
        new_stage = "Engaged"
    elif old_stage == "Engaged" and new_score < 31:
        new_stage = "Visitor"
```

**Example:**
```
Lead 1: score=80 (Hot Lead), inactive for 25 hours
  → score becomes: 80 * 0.9 = 72 (still Hot Lead, no downgrade)

Lead 2: score=72 (Qualified), inactive for 48 hours (~2x decay)
  → 1st decay: 72 * 0.9 = 64.8 → 64 → Downgrade to "Engaged"
  → 2nd decay: 64 * 0.9 = 57.6 → 57 (stays Engaged, not below 31)
```

**Rationale:**
- Cold leads shouldn't compete with hot leads for SDR attention
- Time-decay is exponential attenuation (not linear), preventing rapid collapse
- Decay doesn't delete leads; returning customers can recover

**Parameters (Tunable):**

| Parameter | Current Value | Impact |
|---|---|---|
| INACTIVE_THRESHOLD_HOURS | 24 | Sensitivity: lower = faster decay |
| DECAY_FACTOR | 0.9 | Magnitude: lower = more aggressive decay |
| Downgrade Thresholds | 70, 31 | Mapping score ranges to stages |

**Strengths:**
- ✅ Automatic: No manual curation required
- ✅ Reversible: Returning leads can re-qualify
- ✅ Low Computation: Single multiplication per lead

**Limitations:**
- ❌ Threshold Arbitrary: 24 hours may be too sensitive (e.g., for accounts that evaluate for weeks)
- ❌ No Behavior Context: Doesn't distinguish "thinking it over" from "moved to competitor"
- ❌ Not Scheduled: Currently manual trigger; should be background cron job

---

#### **Algorithm 3: RAG Retrieval via Semantic Search**

**Purpose:** Find relevant knowledge base documents for user query without full-text search or keyword matching.

**Mechanism:**
```
1. Embed user query q using all-MiniLM-L6-v2 → embedding e_q (384-dim)
2. Compute cosine similarity: score(e_q, e_doc) for each document in pgvector
3. Return top-K documents with highest similarity (default K=3)
```

**Mathematical Foundation:**
```
cosine_similarity(u, v) = (u · v) / (||u|| × ||v||)

Where u = query embedding, v = document embedding
Range: [-1, 1]; higher = more similar

pgvector SQL:
SELECT content, metadata
FROM documents
ORDER BY embedding <-> e_q USING ivfflat
LIMIT 3
```

**Example:**
```
User Query: "What GPUs do you have for ML training?"

Query Embedding: e_q = [0.15, -0.22, 0.81, ...] (384 dims)

Document 1 (Nebula_Compute.md, chunk "G1.xlarge spec"):
  embedding: [0.16, -0.21, 0.80, ...] → cosine ≈ 0.98 ✓ (very similar)

Document 2 (Storage.md, chunk "Vortex features"):
  embedding: [0.02, 0.50, 0.30, ...] → cosine ≈ 0.45 ✗ (not similar)

Document 3 (Pricing.md, chunk "Instance pricing"):
  embedding: [0.14, -0.19, 0.78, ...] → cosine ≈ 0.97 ✓ (very similar)

Top-3 Results: [Doc1, Doc3, Doc2 or other doc4, doc5 if score(doc2) < next candidates]
```

**Strengths:**
- ✅ Semantic: Understands intent (query "GPUs" matches document about "A100 accelerators")
- ✅ Fast: pgvector ivfflat index queries in <100ms
- ✅ No Fine-Tuning: Pre-trained embeddings work out-of-the-box; no domain annotation needed

**Limitations:**
- ❌ Query-Doc Mismatch: If knowledge base lacks detail on a topic, no retrieval signal
- ❌ Embedding Dimension Trade-off: 384-dim (MiniLM) vs. larger models (e.g., 768-dim); smaller = faster but less expressive
- ❌ No Real-Time Updates: When new PDFs are added to `/data/`, must re-run ingest.py; no incremental ingestion

---

#### **Algorithm 4: Email Intent Extraction**

**Purpose:** Classify what type of follow-up email the customer needs based on their conversation.

**Mechanism:**
```
Given conversation history, the Judge LLM extracts:
1. email_intent ∈ {pricing_request, technical_specs, plan_comparison, 
                   startup_program, custom_solution, general_followup}
2. email_context: Specific details from conversation (e.g., "$6,325/mo G1.xlarge", "20% annual discount")
```

**Classification Logic (Implicit in JUDGE_PROMPT):**

| User Signals | Detected Intent |
|---|---|
| "What's your pricing?" / "Cost of...?" / "Monthly bill?" | pricing_request |
| "What GPUs?" / "Specs of instance?" / "Performance?" | technical_specs |
| "Compare X vs. Y" / "Which is better for...?" | plan_comparison |
| "Do you have startup credits?" / "Startup program?" | startup_program |
| "We need custom..." / "Build solution for..." | custom_solution |
| No specific request / Generic interest | general_followup |

**Example:**
```
Conversation:
Customer: "Hi, I'm interested in your GPU instances."
Assistant: "We have G1.large ($3,625/month) with 2x V100, and G1.xlarge ($6,325/month) with 4x A100."
Customer: "What's the difference between V100 and A100? Which is better for AI training?"

Judge Extraction:
  email_intent: "technical_specs"
  email_context: "G1.large: 2x V100, $3,625/mo. G1.xlarge: 4x A100, $6,325/mo. 
                 Customer comparing for AI training; A100 better for large models. 
                 Recommend G1.xlarge for enterprise ML workloads."
```

**Usage in `/draft_email`:**
```python
directive = INTENT_DIRECTIVES["technical_specs"]
# Instructs email model to include:
# - Exact GPU specs (V100 vs A100 differences)
# - Performance benchmarks
# - Recommendation for use case
# Structure: Greeting → Spec comparison → How maps to use case → Next step
```

**Strengths:**
- ✅ Actionable: Email generation no longer generic; directly addresses customer's intent
- ✅ Contextual: Extracts specific numbers/details for personalization
- ✅ Scalable: One template per intent type; supports 6 common scenarios

**Limitations:**
- ❌ Limited Categories: Only 6 intents; rare edge cases fall back to "general_followup"
- ❌ Context Extraction Lossy: Numeric details hardcoded in email prompt; if conversation has 10 numbers, context may only include 5
- ❌ No Correction: If customer corrects themselves ("Wait, actually G1.large, not xlarge"), context still has the old value

---

### 5.2 Performance Optimizations

1. **Parallel Async Background Tasks:**
   - Judge scoring and contact extraction run in parallel, not sequentially
   - Saves ~1-2 seconds vs. sequential execution

2. **In-Memory Chat Cache:**
   - Stores last 10 messages per session in `chat_sessions` dict
   - Avoids DB query for every LLM context window
   - Reduces latency by ~50ms

3. **Vector Index (IvfFlat):**
   - pgvector ivfflat index on document embeddings
   - Cosine similarity search: O(log N) instead of O(N)
   - 200-300 documents: ~100ms search time vs. 1-2s without index

4. **Model Selection by Task:**
   - Chat: Llama 3.3 70B (best quality, can afford latency cost)
   - Email: Llama 3.1 8B (sufficient for templated output, faster + cheaper)
   - Extractor: Llama 3.1 8B (deterministic extraction, needs low temp)
   - Judge: GPT-OSS 120B (needs reasoning depth for BANT)

5. **Temperature Tuning:**
   - Chat (0.7): Balanced conversation warmth + grounding
   - Email (0.3): Low temp → factual, consistent output
   - Extractor (0.0): Zero temp → deterministic, repeatable extraction

---

### 5.3 Novelty & Research Value

**1. Dual-Track Asynchronous Architecture for Sales:**
- **Novelty:** Most chatbot systems choose between speed (sync) or intelligence (async). SalesGPT decouples these concerns.
- **Research Impact:** Demonstrates that sophisticated lead analysis (BANT) can run in background without blocking UX. Applicable to other domains (support, content, etc.).
- **Publication Venue:** MLSys, SysML, or sales-focused conference (e.g., Sales Enablement Summit)

**2. BANT Scoring via Lightweight LLMs:**
- **Novelty:** Prior work uses keyword-matching or supervised classifiers for lead scoring. SalesGPT uses GPT-OSS 120B (open-source) to conduct semantic BANT analysis.
- **Research Impact:** Shows that 120B open-source models can match or exceed proprietary solutions (GPT-4) for structured reasoning tasks with deterministic outputs.
- **Publication Venue:** ACL, EMNLP (NLP conference), or business-focused (e.g., JMLR Workshop on NLP + Business)

**3. RAG Without External APIs for Embeddings:**
- **Novelty:** Most RAG systems use cloud-hosted embeddings (OpenAI API). SalesGPT uses local HuggingFace embeddings.
- **Research Impact:** Demonstrates that 384-dim local embeddings (all-MiniLM-L6-v2) are sufficient for knowledge retrieval, reducing latency, cost, and privacy concerns.
- **Publication Venue:** EMNLP, NeurIPS (Embeddings track)

**4. Intent-Aware Email Generation:**
- **Novelty:** Email templates are typically static or require manual curation. SalesGPT dynamically generates emails based on BANT analysis + conversation context.
- **Research Impact:** Bridges sales automation + NLG; could extend to personalized outreach at scale.
- **Publication Venue:** SIGIR (Information Retrieval), or business-focused (e.g., JAI - Journal of Automated Reasoning in Commerce)

---

## 6. SECURITY, LIMITATIONS, & FUTURE SCOPE

### 6.1 Security Implementations

#### **API Key Management:**
- All credentials (SUPABASE_URL, SUPABASE_KEY, GROQ_API_KEY) stored in `.env` file
- `.env` file is `.gitignore`-d (not committed to version control)
- `.env.template` provided as reference (with placeholder values)
- **Risk:** If .env is exposed in code repo or logs, all systems compromised
- **Mitigation:** Use environment variables in production (cloud provider secrets manager)

#### **Input Validation (Pydantic):**
```python
class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4096)  # Length bounds
    session_id: str = Field(..., min_length=1, max_length=128)  # Format validation
```
- Prevents buffer overflows, injection attacks
- Rejects messages >4096 chars; session_ids >128 chars

#### **CORS Middleware:**
```python
CORSMiddleware(
    allow_origins=ALLOWED_ORIGINS,  # Whitelist specific domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```
- Only allows requests from specified frontend origins
- Prevents cross-origin attacks
- **Config:** `ALLOWED_ORIGINS` env var (e.g., "http://localhost:5173,https://sales-gpt.defaulters.com")

#### **Supabase RLS (Row-Level Security):**
- Not explicitly configured in current implementation
- **Risk:** Any user with API key can read all leads
- **Recommendation:** Implement RLS policies:
  ```sql
  CREATE POLICY "Leads visible to admins only"
  ON leads FOR SELECT
  USING (auth.uid() = admin_user_id);
  ```

#### **No Authentication on /chat:**
- Public endpoint: any user can chat without login
- **Rationale:** Intentional for anonymous visitors (landing page chat)
- **Risk:** Could be abused for DDoS or garbage data injection
- **Mitigation:** Rate limiting per IP (not currently implemented)

#### **Groq API Key Exposure:**
- API key is passed in code to ChatGroq instance
- **Risk:** If backend logs are exposed, API key could be leaked
- **Mitigation:** Never log full API keys; mask in logs; rotate keys regularly

### 6.2 Current Limitations & Bottlenecks

#### **Scalability Issues:**

1. **In-Memory Chat Sessions:**
   ```python
   chat_sessions: dict[str, list[dict]] = {}  # Grows unbounded
   ```
   - **Problem:** Memory leaks if sessions are never deleted
   - **Impact:** On 10,000 active sessions × 50 messages × 1KB/msg = 500MB memory
   - **Fix:** Implement session TTL (Time-To-Live); purge after 30 mins of inactivity

2. **Full Refetch on Realtime Changes:**
   ```javascript
   supabase.on('postgres_changes', ..., () => fetchLeads())  // Fetches ALL leads
   ```
   - **Problem:** With 10,000 leads, full refetch every change is expensive
   - **Impact:** Network bandwidth, render time on dashboard
   - **Fix:** Implement delta updates (only fetch changed lead)

3. **No Pagination in Lead Queries:**
   - Admin dashboard loads all leads into state
   - **Impact:** Renders 10,000 lead cards; browser lag
   - **Fix:** Implement infinite scroll or pagination (50 leads/page)

4. **Analytics Computed on Every Request:**
   ```python
   @app.get("/analytics/dashboard")
   async def get_analytics():
       leads = supabase_client.table("leads").select("*").execute()  # Full table scan
       # ... compute metrics ...
   ```
   - **Problem:** O(N) computation per request
   - **Impact:** P95 latency ~3-5s with 10K leads
   - **Fix:** Materialize view or cache results (Redis)

#### **Feature Gaps:**

1. **No Session Persistence:**
   - User closes chat widget → session_id is lost (unless stored in localStorage—ProjectIdea.md mentions this, but not implemented)
   - **Impact:** Returning customers are treated as new leads
   - **Fix:** Store session_id in localStorage for 30 days

2. **No Email Sending Integration:**
   - `/draft_email` generates email, but admin must copy+paste to external email client
   - **Impact:** Extra manual step; opportunities for typos
   - **Fix:** Integrate Gmail API or SendGrid; send directly from platform

3. **No Lead Deletion Audit Trail:**
   - DELETE leads;  No soft delete or audit log
   - **Impact:** Can't recover accidentally deleted leads; no compliance record
   - **Fix:** Soft delete with `is_deleted` flag; maintain audit table

4. **No Multi-User Collaboration:**
   - No user accounts or role-based access control (RBAC)
   - **Impact:** All dashboard admins see all leads; can't assign leads to specific SDRs
   - **Fix:** Implement Supabase Auth with custom claims for RBAC

5. **No Conversation Search:**
   - Can't search within conversations (e.g., "find leads asking about GPU pricing")
   - **Impact:** Manual discovery of trends; hard to find specific leads
   - **Fix:** Add full-text search on `conversations.message`

6. **No Custom BANT Weighting:**
   - All 4 BANT criteria equally weighted (each 0-25)
   - **Impact:** Budget might be more important for some companies; can't customize
   - **Fix:** Allow per-customer BANT weights; retrain JUDGE_PROMPT

#### **Performance Bottlenecks:**

1. **LLM Latency:**
   - Groq API calls: ~1-2s per request (network + inference)
   - **Impact:** At 100 concurrent users, background tasks queue up
   - **Fix:** Implement a job queue (Celery, Bull) with workers

2. **pgvector Search Latency:**
   - IvfFlat search: ~100ms for 300-doc corpus (acceptable)
   - **Impact:** At 100+ concurrent /chat requests, DB becomes bottleneck
   - **Fix:** Cache top-K results per query; implement multi-level caching

3. **Backend Server Capacity:**
   - Single FastAPI server instance; no horizontal scaling
   - **Impact:** Max ~100 concurrent connections before slowdown
   - **Fix:** Deploy multiple replicas behind load balancer (Kubernetes, Docker)

### 6.3 Current Limitations & Bottlenecks (continued)

#### **Data Quality Issues:**

1. **Judge Hallucination:**
   - "In 2019, we were 99.99% uptime" → Judge might infer "enterprise budget" (invalid)
   - **Impact:** False positives; wasted SDR time on non-qualified leads
   - **Fix:** Add confidence scores to BANT analysis; flag high-uncertainty leads

2. **Email Context Truncation:**
   - `email_context` is a single text field; if conversation has 20 numbers, context includes only key ones
   - **Impact:** Generated email missing details; customer annoyed
   - **Fix:** Structured extraction (store pricing as JSON instead of text)

3. **Extraction Incompleteness:**
   - Extractor fails for:
     - Multi-part names ("Dr. Sarah Chen-Smith" → might extract only "Sarah")
     - Non-English email domains (e.g., "sales@公司.cn")
     - Phone formats outside [+1-555-0123] pattern
   - **Impact:** Missing contact data for 5-10% of leads
   - **Fix:** Add regex-based fallback extraction; test on international datasets

#### **Compliance & Privacy:**

1. **GDPR Compliance:**
   - No "delete all my data" endpoint for users
   - **Impact:** Non-compliant with GDPR Article 17 (right to erasure)
   - **Fix:** Implement user data deletion API with verified email confirmation

2. **Data Retention:**
   - Conversations persist forever; no retention policy
   - **Impact:** CCPA requires disclosure of data retention; liability
   - **Fix:** Set automatic purge after 1-2 years; allow user opt-out

3. **PII in Logs:**
   - If customer emails are logged (e.g., in error traces), sensitive data is exposed
   - **Impact:** Security/privacy incident if logs are breached
   - **Fix:** Implement PII masking in logs (redact emails, phone numbers)

---

### 6.4 Future Roadmap

#### **Phase 2: Enhanced Lead Intelligence**

1. **Custom BANT Weighting:**
   - Allow org admins to set per-criterion weights
   - Example: SaaS company weights Authority (0.4) > Budget (0.2) > Need (0.2) > Timeline (0.2)
   - Retrain Judge prompt with custom rubric per org

2. **Confidence Scores:**
   - Judge returns not just `score`, but `confidence ∈ [0, 1]`
   - Flag low-confidence leads for human review
   - Example: Lead has urgent timeline but no budget signals → score=65, confidence=0.52 (ambiguous)

3. **Conversation Clustering:**
   - Group similar conversations to identify common pain points
   - Use embedding similarity on conversation transcripts
   - Output: "5 leads asked about GPU availability; 3 asked about migration support"

4. **Competitive Intelligence:**
   - If customer mentions competitor ("We're evaluating AWS vs. Team Defaulters"), flag as competitive inquiry
   - Extract competitor name + mentioned strengths/weaknesses
   - Output: "Lead interested in competing with CloudFlare's DDoS protection"

---

#### **Phase 3: Sales Team Integration**

1. **Multi-User Collaboration:**
   - Implement Supabase Auth (Google/GitHub OAuth)
   - Role-based access (SDR, Sales Manager, Admin)
   - Lead assignment: "Assign all Hot Leads in automotive vertical to John"

2. **Email Sending from Platform:**
   - Integrate SendGrid or AWS SES
   - One-click "Send Email" button in dashboard
   - Email delivery tracking: open rates, click-through rates

3. **Slack Notifications:**
   - Webhook: When lead score jumps from 50 to 75, notify sales Slack channel
   - Format: "🔥 Hot Lead Alert: Sarah Chen (Acme AI) just hit 75 score. Needs enterprise support."

4. **Salesforce Sync:**
   - Two-way sync with Salesforce CRM
   - New Hot Lead in SalesGPT → Auto-create Opportunity in Salesforce
   - SDR updates lead status in Salesforce → Auto-sync back to SalesGPT

---

#### **Phase 4: Research & ML Enhancements**

1. **Supervised Fine-Tuning for BANT:**
   - Collect 500+ labeled conversations (hand-scored by sales team)
   - Fine-tune lightweight model (Mistral 7B) on BANT scoring
   - Benefits: Faster inference (7B vs. 120B), cheaper, customizable

2. **Conversion Prediction Model:**
   - Train classifier: Given lead data → predict P(closes deal) ∈ [0, 1]
   - Features: BANT score, response latency, extracted company size, product interest
   - Output: Score 80 might mean "60% conversion probability" vs. 30%

3. **Churn Detection:**
   - Identify leads at risk of dropping from pipeline
   - Example: "Hot Leads that don't respond for 48h have 70% churn rate"
   - Auto-trigger: "Assign re-engagement email to SDR immediately"

4. **Persona Clustering:**
   - Unsupervised clustering of leads on extracted features (company size, role, industry)
   - Identify personas: "Startup CTO", "Enterprise Architect", "SMB DevOps"
   - Personalize chat responses per persona

---

#### **Phase 5: AI Agents & Automation**

1. **Autonomous Email Drafting & Scheduling:**
   - When lead hits "Qualified", auto-draft and schedule email
   - Smart scheduling: Send during customer's business hours (infer timezone)
   - SDR review + approve before send

2. **Conversation Continuation Agent:**
   - If customer doesn't respond for 3 days, auto-send follow-up message
   - Analyze conversation history; generate contextual follow-up
   - Example: "Hi Sarah! Following up on your question about GPU availability for AI training..."

3. **Meeting Scheduler Integration:**
   - Detect intent: "Can we schedule a demo?" → Auto-integrate Calendly
   - Offer: "Great! Available Tue 2-4pm, Wed 10am-12pm. Pick a slot: [link]"

4. **Multi-Lead Conversation Orchestration:**
   - Handle multiple concurrent conversations in single session
   - Example: Two team members (Sarah (CTO) + John (CFO)) chat about budget vs. specs
   - Judge analyzes both perspectives; generates holistic lead score

---

#### **Phase 6: Advanced Economics & Monetization**

1. **CAC & LTV Tracking:**
   - Track customer acquisition cost (marketing spend / hot leads generated)
   - Estimate lifetime value based on pipeline conversion + deal size
   - Optimize: Which chat topics drive best-converting leads?

2. **Dynamic Pricing Recommendations:**
   - When customer asks about pricing, recommend tier based on:
     - Company size (extracted)
     - Product interest (conversation analysis)
     - Competitive position (what others in industry pay)
   - Example: If lead is mid-market, recommend "Professional tier + 20% discount" vs. default pricing

3. **ROI Dashboard:**
   - Org admin sees: "SalesGPT generated 150 Hot Leads this month → 45 qualified → 12 deals → $2.4M ARR"
   - Breakdown: Cost of LLM inference ($500) + hosting ($200) = $700/month → ROI 3,400x

---

#### **Phase 7: Generalization & Multi-Product**

1. **Multi-Organization Support:**
   - Current system is single-tenant (hardcoded "Team Defaulters")
   - Future: Multi-tenant architecture with per-org knowledge bases + customizable BANT weights

2. **Industry-Specific Variants:**
   - SalesGPT-Fintech: BANT weights optimized for compliance-sensitive industry
   - SalesGPT-Healthcare: HIPAA-compliant data handling + "Patient Privacy" criteria
   - SalesGPT-Enterprise: Longer sales cycles; track multiple stakeholders (CTO, CFO, CEO)

3. **Open-Source Release:**
   - Publish architecture + code as OSS
   - Community contributions: new intent categories, BANT variants, integrations
   - Commercial support tier: Managed hosting, advanced analytics

---

## APPENDIX: QUICK REFERENCE

### Environment Variables

```bash
# Supabase  
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_KEY=[anon-key or service-role-key]

# Groq LLM API
GROQ_API_KEY=gsk_[...]

# Models (optional; defaults provided)
CHAT_MODEL=llama-3.3-70b-versatile
JUDGE_MODEL=openai/gpt-oss-120b
EMAIL_MODEL=llama-3.1-8b-instant
EXTRACTOR_MODEL=llama-3.1-8b-instant
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2

# RAG
TOP_K_RESULTS=3

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Frontend
VITE_API_URL=http://localhost:8000
```

### Key Files & Lines

| **File** | **Purpose** | **Entry Point** |
|---|---|---|
| backend/main.py | FastAPI server | `python -m uvicorn backend.main:app --reload` |
| backend/ingest.py | Data ingestion | `python backend/ingest.py` |
| frontend/src/main.jsx | React app | `npm run dev` (Vite dev server) |
| schema.sql | Database setup | Run in Supabase SQL editor |
| knowledge_base/*.md | Knowledge base | 10 markdown files; read during ingest |

### Key Endpoints

| **Method** | **Path** | **Purpose** |
|---|---|---|
| POST | /chat | Send message; get response + sources |
| POST | /draft_email | Generate follow-up email for lead |
| PATCH | /leads/{session_id} | Update lead pipeline status |
| GET | /leads | Search/filter leads with pagination |
| DELETE | /leads/{session_id} | Delete lead record |
| POST | /admin/force_decay | Manually apply time-decay algorithm |
| GET | /analytics/dashboard | Aggregate pipeline metrics |

---

**END OF MASTER PROJECT DOCUMENT**

*Document Version: 1.0*  
*Last Revised: March 16, 2026*  
*Prepared by: Systems Architect & Technical Writer (AI-Assisted)*

