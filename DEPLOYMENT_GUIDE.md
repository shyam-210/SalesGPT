# SalesGPT Deployment Guide

This guide provides step-by-step instructions to deploy the SalesGPT system for a development team. We use a decoupled deployment strategy to bypass the Vercel free-tier team limits, ensuring your whole team can collaborate without blockers.

## Target Architecture

- **Frontend (React + Vite):** [Cloudflare Pages](https://pages.cloudflare.com/)
- **Backend (Python FastAPI):** [Render](https://render.com/)
- **Database (PostgreSQL + pgvector):** [Supabase](https://supabase.com/)

---

## 1. Supabase Database Deployment

1. **Create a Project:** Go to the [Supabase Dashboard](https://supabase.com/dashboard), click **New Project**, and choose an organization and region.
2. **Apply the Schema:** 
   - Navigate to the **SQL Editor**.
   - Copy the contents of `schema.sql` from your project root.
   - Run the SQL to create the `leads`, `conversations`, and `documents` tables, as well as the `match_documents` function.
3. **Get Credentials:** 
   - Go to **Project Settings** → **API**.
   - Note the **Project URL** and the **service_role secret**. You will need these for the backend.
   - Note the **anon public key**. You will need this for the frontend.

---

## 2. Backend Deployment (Render)

Render makes it easy to deploy the Dockerized FastAPI application directly from your GitHub repository.

1. **Connect GitHub:** Create a Render account and connect your GitHub profile.
2. **Create Web Service:**
   - Click **New** → **Web Service**.
   - Select your SalesGPT repository.
3. **Configure Service:**
   - **Name:** `salesgpt-backend`
   - **Language:** `Docker` (Render will automatically detect the Dockerfile in the root if you set the build context, or you can specify it).
   - **Docker Build Context:** `.` (Root directory)
   - **Dockerfile Path:** `backend/Dockerfile`
   - **Instance Type:** Free (Note: Spins down after 15 minutes of inactivity).
4. **Environment Variables:**
   - `SUPABASE_URL`: Your Supabase Project URL.
   - `SUPABASE_KEY`: Your Supabase **service_role secret**.
   - `GROQ_API_KEY`: Your Groq API key.
   - `ALLOWED_ORIGINS`: `https://your-frontend.pages.dev` (You can update this after deploying the frontend).
5. **Deploy:** Click **Create Web Service**. Wait for the build to finish. Copy the Render URL (e.g., `https://salesgpt-backend.onrender.com`).

---

## 3. Frontend Deployment (Cloudflare Pages)

Cloudflare Pages is the best alternative to Vercel for teams because the free tier allows unlimited team members to collaborate on the GitHub repository.

1. **Create Account:** Go to the [Cloudflare Dashboard](https://dash.cloudflare.com/) and navigate to **Workers & Pages**.
2. **Connect Repository:**
   - Click **Create application** → **Pages** → **Connect to Git**.
   - Select your SalesGPT repository.
3. **Configure Build:**
   - **Project Name:** `salesgpt-frontend`
   - **Production Branch:** `main` (or `optimization-and-deployment`)
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build`
   - **Build Output Directory:** `dist`
   - **Root Directory:** `/frontend`
4. **Environment Variables:**
   - `VITE_SUPABASE_URL`: Your Supabase Project URL.
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase **anon public key**.
   - `VITE_API_URL`: Your Render backend URL (e.g., `https://salesgpt-backend.onrender.com`).
## 4. GitHub CI/CD Workflows

The repository is configured with GitHub Actions to deploy branches automatically:

1. **Frontend (Cloudflare Pages):**
   - Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**.
   - Add `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` (generated from your Cloudflare profile).
   - Add `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_API_URL`.
   - On every push, GitHub Actions will build and deploy the frontend, generating a preview URL.

2. **Backend (Render):**
   - Go to your Render Web Service → **Settings** → **Deploy Hooks**.
   - Copy the Deploy Hook URL.
   - Go to GitHub repository → **Settings** → **Secrets**.
   - Add `RENDER_DEPLOY_HOOK_URL`.
   - On every push, GitHub will trigger Render to rebuild the Docker container.

---

## 5. Auto-Migrations

The backend uses `psycopg2` to automatically run `schema.sql` on startup. 
To enable this feature, you MUST add the **PostgreSQL Connection String** to your Render environment variables:
- `DATABASE_URL`: e.g., `postgresql://postgres:[password]@db.supabase.co:5432/postgres`

If this is missing, the backend will skip auto-migrations and run normally (assuming you ran `schema.sql` manually).

---

## Troubleshooting

- **CORS Errors on Chat:** Ensure your Cloudflare Pages URL is included in the `ALLOWED_ORIGINS` environment variable in your Render backend settings.
- **Backend Cold Starts:** Render's free tier sleeps after 15 mins. The first chat message may take ~50 seconds while the backend wakes up. For production, upgrade Render to the $7/mo plan or use Railway.app.
- **RAG Not Working:** Ensure you have run `python backend/ingest.py` at least once to populate Supabase with the vector embeddings.
