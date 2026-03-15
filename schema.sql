-- ============================================
-- SalesGPT - Complete Database Schema
-- Based on Schema Diagram
-- ============================================
-- This file consolidates all database tables and functions
-- Run this ONCE in Supabase SQL Editor to set up the entire database

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- TABLE 1: documents (Knowledge Base)
-- ============================================
-- Stores chunked PDF content with vector embeddings for RAG

CREATE TABLE IF NOT EXISTS documents (
  id BIGSERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  embedding vector(384) NOT NULL  -- all-MiniLM-L6-v2 dimension
);

-- Indexes for vector search
CREATE INDEX IF NOT EXISTS idx_documents_embedding ON documents 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- ============================================
-- TABLE 2: chats (Session State Tracking)
-- ============================================
-- Stores ONE ROW per session with conversation state

CREATE TABLE IF NOT EXISTS chats (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  conversation_state TEXT DEFAULT 'greeting',
  state_message_count JSONB DEFAULT '{
    "greeting": 0,
    "discovery": 0,
    "qualification": 0,
    "email_collection": 0,
    "closing": 0
  }'::jsonb,
  last_action TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_chats_session_id ON chats(session_id);
CREATE INDEX IF NOT EXISTS idx_chats_state ON chats(conversation_state);

-- ============================================
-- TABLE 3: conversations (Message History)
-- ============================================
-- Stores individual messages for each session

CREATE TABLE IF NOT EXISTS conversations (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_conversations_session_id ON conversations(session_id);

-- Foreign key to chats (optional, for referential integrity)
-- ALTER TABLE conversations 
-- ADD CONSTRAINT fk_conversations_session 
-- FOREIGN KEY (session_id) REFERENCES chats(session_id) ON DELETE CASCADE;

-- ============================================
-- TABLE 4: leads (CRM / Lead Scoring)
-- ============================================
-- Stores lead information and BANT scores

CREATE TABLE IF NOT EXISTS leads (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT UNIQUE NOT NULL,
  lead_score INTEGER DEFAULT 0 CHECK (lead_score >= 0 AND lead_score <= 100),
  pipeline_status TEXT DEFAULT 'Visitor' CHECK (
    pipeline_status IN ('Visitor', 'Engaged', 'Qualified', 'Hot Lead', 'Approached')
  ),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contact Information (extracted by extractor.py)
  name TEXT,
  company TEXT,
  email TEXT,
  phone TEXT,
  role TEXT,
  needs TEXT,
  
  -- Email Intent (for dynamic email generation)
  email_intent TEXT,
  email_context TEXT
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_leads_session_id ON leads(session_id);
CREATE INDEX IF NOT EXISTS idx_leads_pipeline_status ON leads(pipeline_status);
CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(lead_score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);

-- Auto-update updated_at on every row change
CREATE OR REPLACE FUNCTION update_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_leads_updated_at ON leads;
CREATE TRIGGER trg_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_leads_updated_at();

-- Foreign key to chats (optional)
-- ALTER TABLE leads 
-- ADD CONSTRAINT fk_leads_session 
-- FOREIGN KEY (session_id) REFERENCES chats(session_id) ON DELETE CASCADE;

-- ============================================
-- FUNCTION: match_documents (Vector Search)
-- ============================================
-- Performs similarity search for RAG retrieval

CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(384),
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    documents.id,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) AS similarity
  FROM documents
  ORDER BY documents.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify setup:

-- Check tables exist
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('documents', 'chats', 'conversations', 'leads');

-- Check vector extension
-- SELECT * FROM pg_extension WHERE extname = 'vector';

-- Check function exists
-- SELECT routine_name FROM information_schema.routines 
-- WHERE routine_name = 'match_documents';

-- ============================================
-- NOTES
-- ============================================
-- 1. This schema matches the provided diagram exactly
-- 2. Foreign keys are commented out - uncomment if you want strict referential integrity
-- 3. The documents table requires pgvector extension
-- 4. Run backend/ingest.py to populate documents table with knowledge base
-- 5. The match_documents function is used by backend/main.py for RAG retrieval

-- ============================================
-- HOW TO RUN
-- ============================================
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Create new query
-- 3. Paste this entire file
-- 4. Click "Run" (Ctrl+Enter)
-- 5. Verify success with verification queries above
