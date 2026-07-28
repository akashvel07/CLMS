-- ═══════════════════════════════════════════════════════════════
-- CLMS Initial Schema Migration
-- ═══════════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── MINISTRIES ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ministries (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  code        TEXT NOT NULL UNIQUE,
  status      TEXT NOT NULL DEFAULT 'good',
  budget      NUMERIC(14,2) NOT NULL DEFAULT 0,
  score       INTEGER NOT NULL DEFAULT 75,
  description TEXT NOT NULL DEFAULT ''
);

-- Seed 8 ministries
INSERT INTO ministries (name, code, status, budget, score, description) VALUES
  ('Health', 'health', 'very_good', 2400000, 87, 'National health, medical data, wellness indicators, and public healthcare policy.'),
  ('Education', 'education', 'good', 1800000, 79, 'Learning metrics, courses, certifications, and knowledge statistics.'),
  ('Finance', 'finance', 'exceptional', 5200000, 94, 'Treasury management, national budget, spending oversight, and revenue monitoring.'),
  ('Career Development', 'career', 'well', 1100000, 72, 'Employment opportunities, job matching, skills development, and career growth.'),
  ('Information Technology', 'it', 'good', 1600000, 81, 'Digital services, infrastructure, applications, and technology governance.'),
  ('Personal Development', 'personal_dev', 'underperforming', 600000, 58, 'Personal goals, habit tracking, growth programs, and wellness journaling.'),
  ('Entertainment', 'entertainment', 'well', 900000, 70, 'Recreation services, media oversight, cultural events, and entertainment standards.'),
  ('External Affairs', 'external_affairs', 'good', 1300000, 76, 'Inter-ministry communications, external partnerships, and diplomatic coordination.')
ON CONFLICT (code) DO NOTHING;

-- ─── USERS ──────────────────────────────────────────────────────
-- Extends Supabase auth.users via trigger
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'public' CHECK (role IN ('president', 'ministry', 'public')),
  ministry_id UUID REFERENCES ministries(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── BILLS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bills (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bill_number TEXT NOT NULL UNIQUE,
  title       TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status      TEXT NOT NULL DEFAULT 'draft'
              CHECK (status IN ('draft','submitted','voting','passed','rejected',
                                'suspended','awaiting_president','approved','enacted',
                                'archived','deleted')),
  created_by  UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  ministry_id UUID NOT NULL REFERENCES ministries(id) ON DELETE RESTRICT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER bills_updated_at
  BEFORE UPDATE ON bills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── LAWS ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS laws (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  law_number  TEXT NOT NULL UNIQUE,
  bill_id     UUID NOT NULL REFERENCES bills(id) ON DELETE RESTRICT,
  title       TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'active',
  approved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT
);

-- ─── PARLIAMENT VOTES ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS parliament_votes (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bill_id   UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vote      TEXT NOT NULL CHECK (vote IN ('approve','reject','abstain')),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (bill_id, user_id)  -- one vote per user per bill
);

-- ─── MINISTRY REVIEWS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ministry_reviews (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bill_id     UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  ministry_id UUID NOT NULL REFERENCES ministries(id) ON DELETE CASCADE,
  decision    TEXT NOT NULL CHECK (decision IN ('approve','suspend','reject')),
  reason      TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (bill_id, ministry_id)
);

-- ─── REQUESTS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS requests (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_ministry   UUID NOT NULL REFERENCES ministries(id) ON DELETE RESTRICT,
  to_ministry     UUID NOT NULL REFERENCES ministries(id) ON DELETE RESTRICT,
  title           TEXT NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  amount          NUMERIC(14,2) NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','approved','rejected','returned','completed')),
  president_status TEXT CHECK (president_status IN ('pending','approved','rejected','returned','completed')),
  priority        TEXT NOT NULL DEFAULT 'medium'
                  CHECK (priority IN ('low','medium','high','critical')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── MINISTRY METRICS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ministry_metrics (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ministry_id UUID NOT NULL REFERENCES ministries(id) ON DELETE CASCADE,
  metric      TEXT NOT NULL,
  value       NUMERIC NOT NULL DEFAULT 0,
  timestamp   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ministry_metrics_ministry ON ministry_metrics(ministry_id, timestamp DESC);

-- ─── NOTIFICATIONS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL DEFAULT '',
  read       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifs_user ON notifications(user_id, created_at DESC);

-- ─── AUDIT LOGS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  action     TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id  UUID,
  timestamp  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id, timestamp DESC);

-- ─── Auto-create user profile on signup ──────────────────────────
-- Reads role and ministry_code from user metadata and resolves ministry UUID
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_ministry_id UUID := NULL;
  v_ministry_code TEXT;
BEGIN
  -- Extract ministry_code from metadata and resolve to UUID
  v_ministry_code := NEW.raw_user_meta_data->>'ministry_code';
  IF v_ministry_code IS NOT NULL THEN
    SELECT id INTO v_ministry_id
    FROM public.ministries
    WHERE code = v_ministry_code
    LIMIT 1;
  END IF;

  INSERT INTO public.users (id, name, email, role, ministry_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'public'),
    v_ministry_id
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
