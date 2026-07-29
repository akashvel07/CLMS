-- ═══════════════════════════════════════════════════════════════
-- CLMS Migration 003: Remove auth dependency + enable anon access
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════

-- 1. CLEAR ALL EXISTING DUMMY DATA
TRUNCATE laws, parliament_votes, ministry_reviews, requests, bills CASCADE;

-- 2. DROP existing FK constraints and add text-based columns to BILLS
ALTER TABLE bills DROP CONSTRAINT IF EXISTS bills_created_by_fkey;
ALTER TABLE bills DROP COLUMN IF EXISTS created_by;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS created_by_name TEXT NOT NULL DEFAULT '';
ALTER TABLE bills ADD COLUMN IF NOT EXISTS ministry_code TEXT NOT NULL DEFAULT '';

-- 3. DROP existing FK constraints from PARLIAMENT_VOTES
ALTER TABLE parliament_votes DROP CONSTRAINT IF EXISTS parliament_votes_user_id_fkey;
ALTER TABLE parliament_votes DROP COLUMN IF EXISTS user_id;
ALTER TABLE parliament_votes ADD COLUMN IF NOT EXISTS voted_by_name TEXT NOT NULL DEFAULT '';
ALTER TABLE parliament_votes ADD COLUMN IF NOT EXISTS voted_by_role TEXT NOT NULL DEFAULT 'ministry';
ALTER TABLE parliament_votes DROP CONSTRAINT IF EXISTS parliament_votes_bill_id_user_id_key;
ALTER TABLE parliament_votes ADD CONSTRAINT parliament_votes_bill_voted_by_key UNIQUE (bill_id, voted_by_name);

-- 4. DROP existing FK constraint from LAWS
ALTER TABLE laws DROP CONSTRAINT IF EXISTS laws_approved_by_fkey;
ALTER TABLE laws DROP COLUMN IF EXISTS approved_by;
ALTER TABLE laws ADD COLUMN IF NOT EXISTS approved_by_name TEXT NOT NULL DEFAULT 'President';
ALTER TABLE laws ADD COLUMN IF NOT EXISTS ministry_code TEXT NOT NULL DEFAULT '';

-- 5. REQUESTS: replace UUID-based columns with text ministry names
ALTER TABLE requests DROP CONSTRAINT IF EXISTS requests_from_ministry_fkey;
ALTER TABLE requests DROP CONSTRAINT IF EXISTS requests_to_ministry_fkey;
ALTER TABLE requests DROP COLUMN IF EXISTS from_ministry;
ALTER TABLE requests DROP COLUMN IF EXISTS to_ministry;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS from_ministry_name TEXT NOT NULL DEFAULT '';
ALTER TABLE requests ADD COLUMN IF NOT EXISTS to_ministry_name TEXT NOT NULL DEFAULT '';

-- 6. DISABLE ALL RLS (CLMS uses preset profiles, not real auth)
ALTER TABLE bills DISABLE ROW LEVEL SECURITY;
ALTER TABLE laws DISABLE ROW LEVEL SECURITY;
ALTER TABLE parliament_votes DISABLE ROW LEVEL SECURITY;
ALTER TABLE ministry_reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE ministries DISABLE ROW LEVEL SECURITY;

-- 7. GRANT anon key full access to working tables
GRANT SELECT, INSERT, UPDATE, DELETE ON bills TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON laws TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON parliament_votes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON requests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ministry_reviews TO anon;
GRANT SELECT ON ministries TO anon;

-- 8. Verify clean state
SELECT 'bills' as tbl, count(*) as rows FROM bills
UNION ALL SELECT 'laws', count(*) FROM laws
UNION ALL SELECT 'parliament_votes', count(*) FROM parliament_votes
UNION ALL SELECT 'requests', count(*) FROM requests;
