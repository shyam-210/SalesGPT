# 🚀 SalesGPT - Autonomous Lead Qualification System

**An asynchronous dual-track agentic system for B2B lead qualification using RAG and BANT scoring.**

---

## 📋 Project Overview

**SalesGPT** is an AI-powered sales assistant for "Team Defaulters" (a fictional Cloud SaaS company) that:

- **Fast Track (RAG):** Answers customer queries instantly (<1.5s) using company knowledge base
- **Slow Track (Judge):** Silently analyzes conversations to score leads using BANT framework
- **Pipeline CRM:** Tracks leads through 5 stages (Visitor → Engaged → Qualified → Approached → Completed)
- **Dynamic Knowledge:** Admins can upload/delete PDFs; vector store updates in real-time

---

## 🏗️ Architecture

### Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React + Vite + Tailwind CSS | Customer chat widget + Admin dashboard |
| **Backend** | Python FastAPI | Async API server |
| **Database** | Supabase (PostgreSQL + pgvector) | Relational data + vector embeddings |
| **Chat Agent** | Groq (Llama-3-8B) | Fast RAG responses |
| **Judge Agent** | Groq (GPT-OSS-120B) | BANT scoring & reasoning |
| **Embeddings** | HuggingFace (all-MiniLM-L6-v2) | Local, zero-cost vectorization |

### Dual-Track System

```
User Query
    ↓
┌───────────────────────────────────────┐
│  FAST TRACK (Foreground)              │
│  --------------------------------      │
│  1. Retrieve relevant docs (RAG)      │
│  2. Generate response (Llama-3-8B)    │
│  3. Return to user (<1.5s)            │
└───────────────────────────────────────┘
    ↓
┌───────────────────────────────────────┐
│  SLOW TRACK (Background - Async)      │
│  --------------------------------      │
│  1. Analyze conversation history      │
│  2. Score BANT (GPT-OSS-120B)         │
│  3. Update lead pipeline              │
│  4. Trigger alerts if qualified       │
└───────────────────────────────────────┘
```

---

## 📁 Project Structure

```
SalesGPT/
├── backend/                 # Python FastAPI backend
│   ├── ingest.py           # Data ingestion script (run once)
│   ├── main.py             # API server entry point
│   ├── requirements.txt    # Python dependencies
│   └── [agents, api, db, services, utils]
│
├── frontend/               # React frontend (Vite + Tailwind)
│   └── [src, public, package.json]
│
├── data/                   # Knowledge base (10 markdown files)
│   ├── Company_Overview.md
│   ├── Product_Nebula_Compute.md
│   ├── Pricing_Strategy_2026.md
│   └── [7 more files]
│
├── .env.template           # Environment variables template
├── .gitignore
├── README.md               # This file
└── SETUP_INSTRUCTIONS.md   # Detailed setup guide
```

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.8+** installed
- **Node.js 18+** installed (for frontend)
- **Supabase account** with project created
- **Groq API key** (free tier available)

### Step 1: Clone & Navigate

```powershell
cd d:\FinalYearProject\SalesGPT
```

### Step 2: Create Virtual Environment

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### Step 3: Install Dependencies

```powershell
pip install -r backend/requirements.txt
```

### Step 4: Configure Environment

```powershell
# Copy template
Copy-Item .env.template .env

# Edit .env and add your credentials:
# - SUPABASE_URL
# - SUPABASE_KEY
# - GROQ_API_KEY
```

### Step 5: Run Data Ingestion

```powershell
python backend/ingest.py
```

**Expected output:**
```
🚀 SalesGPT Data Ingestion Pipeline
✅ Connected to Supabase
🤖 Loading embedding model...
📂 Found 10 markdown files
✂️  Splitting documents...
🧠 Generating embeddings... (2-3 minutes)
☁️  Uploading to Supabase...
✅ INGESTION COMPLETE!
```

### Step 6: Verify in Supabase

1. Go to your Supabase dashboard
2. Navigate to **Table Editor** → `documents`
3. You should see ~200-300 rows with embeddings

---

## 📊 Knowledge Base

The system is pre-loaded with **10 comprehensive documents** about "Team Defaulters":

| Document | Purpose | Logic Traps |
|----------|---------|-------------|
| Company_Overview.md | Mission, history, infrastructure | - |
| Product_Nebula_Compute.md | Compute instances & pricing | - |
| Product_Vortex_Storage.md | Object storage service | - |
| Pricing_Strategy_2026.md | Pricing tiers & discounts | 🔒 Enterprise 20% (2-year only) |
| Service_Level_Agreement.md | Uptime guarantees | 🔒 50% refund if SLA missed |
| Security_Compliance.md | SOC2, GDPR, HIPAA | - |
| Startup_Program_Eligibility.md | Startup credits | 🔒 $5K (Series A+ only) |
| Support_Policy.md | Support tiers | 🔒 24/7 phone (Platinum only) |
| Case_Study_FinTech.md | BankCorp success story | - |
| Refund_Cancellation_Policy.md | Refund terms | 🔒 30-day refund + 15-day notice |

**Total:** ~104 KB of content with **6 strategic logic traps** to test RAG accuracy.

---

## 🧪 Testing the RAG System

After ingestion, test with these questions:

### ✅ Test 1: Simple Retrieval
**Question:** "What is Team Defaulters' mission?"  
**Expected:** Should mention "Zero Downtime" and cloud infrastructure

### ✅ Test 2: Logic Trap (Startup Credits)
**Question:** "Can a pre-seed startup get $5,000 credits?"  
**Expected:** "No, ONLY Series A+ funded startups qualify"

### ✅ Test 3: Logic Trap (Enterprise Discount)
**Question:** "Do you offer discounts for Enterprise customers?"  
**Expected:** "Yes, 20% BUT ONLY with 2-year commitment + upfront/quarterly billing"

### ✅ Test 4: Multi-Hop Reasoning
**Question:** "What's the difference between Professional and Enterprise support?"  
**Expected:** Should mention phone support is Enterprise-only

See `knowledge_base/TESTING_GUIDE.md` for full test suite.

---

## 🔧 Development Workflow

### Running the Backend (After Phase 2)

```powershell
# Activate venv
.\venv\Scripts\Activate.ps1

# Run FastAPI server
uvicorn backend.main:app --reload --port 8000
```

### Running the Frontend (After Phase 3)

```powershell
cd frontend
npm install
npm run dev
```

---

## 📈 Implementation Roadmap

### ✅ Phase 1: Foundation (CURRENT)
- [x] Create knowledge base (10 markdown files)
- [x] Set up project structure
- [x] Create data ingestion script
- [x] Upload data to Supabase

### ⏳ Phase 2: Chat Loop (RAG)
- [ ] Build FastAPI backend
- [ ] Implement RAG retrieval service
- [ ] Connect Llama-3-8B for chat responses
- [ ] Create React chat widget
- [ ] Test end-to-end chat flow

### ⏳ Phase 3: Intelligence (Judge & CRM)
- [ ] Implement Judge Agent (GPT-OSS-120B)
- [ ] Build BANT scoring system
- [ ] Create async background tasks
- [ ] Build Kanban dashboard
- [ ] Implement lead pipeline tracking

### ⏳ Phase 4: Polish & Automation
- [ ] Add email copilot
- [ ] Implement time-decay scoring
- [ ] Add session timeout logic
- [ ] Final UI polish
- [ ] Deploy to production

---

## 🔐 Environment Variables

Required variables in `.env`:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_service_role_key

# Groq API
GROQ_API_KEY=your_groq_api_key

# Application
ENVIRONMENT=development
PORT=8000
```

See `.env.template` for full configuration options.

---

## 📚 Documentation

- **SETUP_INSTRUCTIONS.md** - Detailed setup guide with troubleshooting
- **PROJECT_STRUCTURE.md** - Complete folder structure explanation
- **knowledge_base/README.md** - Knowledge base summary & chunking strategy
- **knowledge_base/TESTING_GUIDE.md** - RAG testing questions & expected answers

---

## 🤝 Contributing

This is a final year project. Contributions are not currently accepted.

---

## 📄 License

Educational project - All rights reserved.

---

## 🙏 Acknowledgments

- **Supabase** for the database + vector store
- **Groq** for ultra-fast LLM inference
- **HuggingFace** for local embedding models
- **LangChain** for RAG orchestration

---

## 📞 Contact

For questions about this project, contact the development team.

---

**Built with ❤️ for the Final Year Project**
