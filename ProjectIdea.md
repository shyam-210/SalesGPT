To answer your specific question first:

**Session Timeout Strategy:**

* **Active Chat Timeout: 30 Minutes.**
If the user stops typing for 30 minutes, the "current session" is considered closed. This helps the AI define where one conversation ends and a new one begins.
* **Lead Identity Persistence: 30 Days.**
We will store the User UUID in `LocalStorage` for 30 days. If the user returns 2 weeks later, the system instantly recognizes them ("Welcome back!"), retrieves their previous **Lead Score**, and continues tracking them.

---

Here is the **Finalized Master Project Description** for "Team Defaulters," updated with your specific requirements.

# **Project Title:** SalesGPT

**Subtitle:** An Asynchronous Agentic Framework for Autonomous Lead Qualification and Dynamic Intent Scoring
**Target Organization:** Team Defaulters (Demo Company)


---

### **1. Executive Summary**

**SalesGPT** is an autonomous AI ecosystem designed to solve "Lead Leakage" for **Team Defaulters**. Unlike traditional chatbots that serve as passive information kiosks, SalesGPT functions as a **Dual-Track Agentic System**. It actively engages customers with instant, accurate answers while simultaneously running a background "Judge Agent" that analyzes conversation psychology to identify high-value prospects. By automating lead qualification (using the **BANT** framework), dynamic scoring, and follow-up email drafting, SalesGPT transforms the Team Defaulters landing page from a support channel into a 24/7 proactive sales engine.

---

### **2. System Architecture (The "Dual-Track" Core)**

The system resolves the trade-off between **Speed** and **Intelligence** by decoupling them into two parallel loops:

1. **The Fast Track (Interaction Layer):** A low-latency RAG agent that answers user queries in <1.5 seconds using **Team Defaulters'** specific company documents (Pricing, Service Terms, etc.).
2. **The Slow Track (Reasoning Layer):** An asynchronous "Judge Agent" (powered by **ChatGPT OSS 120B** on Groq) that silently observes the chat, scores the lead, and updates the CRM pipeline without slowing down the conversation.

---

### **3. Module Breakdown**

The project is divided into **5 Core Modules**:

#### **Module 1: The Interactive Client (Frontend)**

* **Role:** The user interface for both Customers and Admins.
* **Components:**
* **Customer Widget:** A modern, floating chat interface branded for Team Defaulters. It uses **UUID-based LocalStorage** to track users across sessions without requiring login.
* **Admin Dashboard:** A "Mission Control" center featuring real-time graphs and a Kanban board for lead management.
* **Live Sockets:** Uses **Supabase Realtime** to push score updates to the admin instantly.



#### **Module 2: The Orchestration Layer (Backend)**

* **Role:** The central nervous system managing traffic and async tasks.
* **Tech:** **FastAPI (Python)**.
* **Function:** Handles API requests, manages WebSocket connections, and dispatches background tasks to the AI agents using `asyncio`.

#### **Module 3: The Intelligence Engine (AI)**

* **Role:** The "Brain" of the operation.
* **Track A (Chat Agent):** Uses **Groq (Llama-3-8B)** for sub-second, polite, hallucination-free responses via RAG.
* **Track B (Judge Agent):** Uses **Groq (ChatGPT OSS 120B)** (Reasoning Model) to analyze intent, calculate BANT scores, and detect "Trap/Troll" users.

#### **Module 4: Dynamic Knowledge Base (Memory)**

* **Role:** The storage for company intelligence.
* **Tech:** **Supabase (PostgreSQL + pgvector)**.
* **Innovation:** Supports **Dynamic RAG**. The Admin can upload/delete PDFs (e.g., "Team_Defaulters_Pricing_2026.pdf") instantly. The system uses local **HuggingFace Embeddings** to update the vector index in  time, ensuring the bot learns new data immediately.

#### **Module 5: The CRM Pipeline**

* **Role:** Tracks the lifecycle of a lead.
* **Stages:**
1. **Visitor:** Anonymous user browsing.
2. **Engaged:** User asking product questions.
3. **Qualified:** Judge Agent assigns a score > 70.
4. **Approached:** Copilot drafted & sent an email.
5. **Completed:** Deal closed by human.



---

### **4. Key Features**

1. **Asynchronous Dual-Track Processing:** The user never waits for the "Judge" to think. The chat is instant, while the scoring happens silently in the background.
2. **BANT Semantic Scoring:** Instead of keyword matching, the Judge Agent analyzes:
* **B**udget: Can they afford Team Defaulters' services?
* **A**uthority: Are they the decision-maker?
* **N**eed: Do they have a problem we solve?
* **T**imeline: When do they need it?


3. **Smart Session Management:**
* **Active Timeout:** 30 Minutes (resets conversation context).
* **Identity Retention:** 30 Days (remembers returning leads).


4. **Time-Decay Algorithm:** Scores degrade if a user goes silent (). This keeps the "Hot Leads" list fresh.
5. **Dynamic Knowledge Management:** Add or remove PDFs on the fly. The AI forgets old data instantly upon deletion.
6. **Drafting Copilot:** When a lead becomes "Qualified," the system generates a context-aware email draft for the sales team to review and send.
7. **Troll Detection:** The Judge Agent identifies non-serious users to save API costs and marks them as "Low Priority."

---

### **5. Implementation Roadmap**

We will execute this in **4 Phases**:

#### **Phase 1: Foundation (Data & Backend)**

* **Goal:** Set up the "Brain" and Database.
* **Actions:**
1. Initialize Supabase project with `pgvector`.
2. Build the FastAPI backend structure.
3. Implement the **PDF Ingestion Pipeline** (Upload  Chunk  Embed with HuggingFace  Store in DB).



#### **Phase 2: The Chat Loop (RAG)**

* **Goal:** A working chatbot that knows Team Defaulters' data.
* **Actions:**
1. Create the **10 Dummy PDFs** for Team Defaulters (Services, Pricing, About Us).
2. Build the React Chat Widget.
3. Connect the Chat Agent (Llama-3-8B) to the Vector Store for answering questions.



#### **Phase 3: The Intelligence (Judge & CRM)**

* **Goal:** Add the reasoning layer.
* **Actions:**
1. Implement the background `async` task for the Judge Agent (**ChatGPT OSS 120B**).
2. Design the **System Prompt** for BANT scoring.
3. Build the **Kanban Dashboard** in React to visualize leads moving through stages.



#### **Phase 4: Polish & Automation**

* **Goal:** Full production cycle.
* **Actions:**
1. Add the **Email Copilot** button.
2. Implement the **Time-Decay** script (cron job) and Session Timeout logic.
3. Final UI polish.



---

### **6. Technology Stack Summary**

| Component | Technology Selected | Reasoning |
| --- | --- | --- |
| **Frontend** | React + Vite + Tailwind CSS | Industry standard, high performance. |
| **Backend** | Python FastAPI | Best-in-class support for Async tasks. |
| **Database** | Supabase (PostgreSQL) | Combines Relational Data (CRM) + Vector Data (RAG). |
| **Judge AI** | **Groq (ChatGPT OSS 120B)** | Reasoning capability needed for accurate BANT scoring. |
| **Chat AI** | **Groq (Llama-3-8B)** | Ultra-low latency for natural conversation flow. |
| **Embeddings** | HuggingFace (`all-MiniLM-L6-v2`) | Local execution avoids API limits and costs. |

---

**Next Step:** This is the locked final version. You are ready to start coding. Copy the **Developer Prompt** (remembering to update the company name to "Team Defaulters" inside it) and start your new chat.