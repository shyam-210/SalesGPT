# Local Development Guide

This guide explains how to run the SalesGPT system locally for development and testing. We support both Docker-based workflows and traditional local setups.

## Prerequisites

- Python 3.11+
- Node.js 18+
- Docker and Docker Compose (optional)
- Git

---

## 1. Environment Setup

Create a `.env` file in the root of the project (copy from `.env.template` if it exists).

```ini
# Backend Environment
SUPABASE_URL="your-supabase-url"
SUPABASE_KEY="your-supabase-service-role-key"
GROQ_API_KEY="your-groq-key"

# Frontend Environment
VITE_SUPABASE_URL="your-supabase-url"
VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
VITE_API_URL="http://localhost:8000"
```

Also, create a `.env` file inside the `/frontend` directory containing only the `VITE_*` variables.

---

## Method A: Standard Local Setup

### Running the Backend

1. Open a terminal in the root directory.
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: .\venv\Scripts\Activate.ps1
   ```
3. Install dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```
4. Run the data ingestion script to populate Supabase (only needed once):
   ```bash
   python backend/ingest.py
   ```
5. Start the FastAPI server:
   ```bash
   uvicorn backend.main:app --reload --port 8000
   ```

### Running the Frontend

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Access the app at `http://localhost:5173`.

---

## Method B: Docker Setup (Backend Only)

You can run the backend via Docker to ensure it precisely matches the production environment.

1. Ensure your `.env` file is complete in the root directory.
2. Run Docker Compose:
   ```bash
   docker-compose up --build
   ```
   This will build the Python 3.11 container and expose the API on `http://localhost:8000`.
3. Run the frontend normally via `npm run dev` in the `/frontend` directory.

---

## Useful Information

- **Architecture Details:** The application uses a dual-track system. The Fast Track (synchronous) handles the immediate RAG response via Groq Llama 3.3. The Slow Track uses background tasks (Judge and Extractor) to analyze BANT criteria asynchronously.
- **Frontend Optimization:** The application uses TanStack React Query for efficient data fetching and caching on the dashboard.
- **Backend Optimization:** `TTLCache` is implemented in `main.py` to handle in-memory session persistence without leaking memory over time.
