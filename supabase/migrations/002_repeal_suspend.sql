-- Migration: Add Repeal and Suspend Law features
-- Run this in your Supabase SQL Editor

ALTER TABLE bills 
ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'new' CHECK (type IN ('new', 'repeal', 'suspend')),
ADD COLUMN IF NOT EXISTS target_law_id UUID REFERENCES laws(id) ON DELETE CASCADE;
