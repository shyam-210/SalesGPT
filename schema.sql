-- ============================================
-- SalesGPT SaaS - Complete Database Schema
-- Multi-Tenant Architecture
-- ============================================

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables to enforce the new schema
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS chats CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS agents CASCADE;

-- ============================================
-- TABLE 1: agents (SaaS Customers)
-- ============================================
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL, -- Supabase Auth User ID
  company_name TEXT,
  description TEXT,
  quick_questions JSONB DEFAULT '[]'::jsonb,
  tools JSONB DEFAULT '[]'::jsonb,
  persona_prompt TEXT,
  onboarding_status TEXT DEFAULT 'pending' CHECK (onboarding_status IN ('pending', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agents_user_id ON agents(user_id);

-- ============================================
-- TABLE 2: documents (Knowledge Base)
-- ============================================
CREATE TABLE IF NOT EXISTS documents (
  id BIGSERIAL PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  embedding vector(384) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_documents_agent_id ON documents(agent_id);
CREATE INDEX IF NOT EXISTS idx_documents_embedding ON documents 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- ============================================
-- TABLE 3: chats (Session State Tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS chats (
  id BIGSERIAL PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  session_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  conversation_state TEXT DEFAULT 'greeting',
  state_message_count JSONB DEFAULT '{
    "greeting": 0, "discovery": 0, "qualification": 0, "email_collection": 0, "closing": 0
  }'::jsonb,
  last_action TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chats_tenant_session ON chats(agent_id, session_id);

-- ============================================
-- TABLE 4: conversations (Message History)
-- ============================================
CREATE TABLE IF NOT EXISTS conversations (
  id BIGSERIAL PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_tenant_session ON conversations(agent_id, session_id);

-- ============================================
-- TABLE 5: leads (CRM / Lead Scoring)
-- ============================================
CREATE TABLE IF NOT EXISTS leads (
  id BIGSERIAL PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  session_id TEXT UNIQUE NOT NULL,
  lead_score INTEGER DEFAULT 0 CHECK (lead_score >= 0 AND lead_score <= 100),
  pipeline_status TEXT DEFAULT 'Visitor' CHECK (
    pipeline_status IN ('Visitor', 'Engaged', 'Qualified', 'Hot Lead', 'Approached')
  ),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT,
  company TEXT,
  email TEXT,
  phone TEXT,
  role TEXT,
  needs TEXT,
  email_intent TEXT,
  email_context TEXT
);

CREATE INDEX IF NOT EXISTS idx_leads_tenant_pipeline ON leads(agent_id, pipeline_status);

-- ============================================
-- FUNCTION: match_documents (Multi-Tenant Vector Search)
-- ============================================
DROP FUNCTION IF EXISTS match_documents(vector,uuid,integer);
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(384),
  p_agent_id UUID,
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
  WHERE documents.agent_id = p_agent_id
  ORDER BY documents.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
