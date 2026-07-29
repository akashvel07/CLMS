-- Migration: Add Budget Allocations table
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS budget_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  allocations JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(month, year)
);

-- DISABLE ALL RLS (CLMS uses preset profiles, not real auth)
ALTER TABLE budget_allocations DISABLE ROW LEVEL SECURITY;

-- GRANT anon key full access to working tables
GRANT SELECT, INSERT, UPDATE, DELETE ON budget_allocations TO anon;

-- FORCE POSTGREST SCHEMA CACHE RELOAD
NOTIFY pgrst, 'reload schema';
