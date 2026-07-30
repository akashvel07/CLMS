-- ═══════════════════════════════════════════════════════════════
-- CLMS MIGRATION 004 — High Court, Supreme Court & News Feed
-- Paste this into Supabase SQL Editor and run
-- ═══════════════════════════════════════════════════════════════

-- ─── Ensure the updated_at trigger function exists ────────────────────────────
-- (Defined in 000_complete_setup.sql — recreated here for safety)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

-- ─── COURT CASES (High Court) ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS court_cases (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_number     TEXT NOT NULL UNIQUE,
  title           TEXT NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  -- The active law this case is about (must reference laws table)
  law_id          UUID REFERENCES laws(id) ON DELETE SET NULL,
  law_title       TEXT NOT NULL DEFAULT '',
  -- Case type
  case_type       TEXT NOT NULL DEFAULT 'challenge'
                  CHECK (case_type IN ('challenge', 'discussion', 'contempt', 'petition')),
  -- Who filed
  filed_by_name   TEXT NOT NULL,
  filed_by_role   TEXT NOT NULL,
  -- Status lifecycle
  status          TEXT NOT NULL DEFAULT 'filed'
                  CHECK (status IN ('filed', 'approved_for_trial', 'in_trial', 'order_issued', 'closed', 'appealed_to_supreme', 'rejected')),
  -- Justice notes
  justice_notes   TEXT DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER court_cases_updated_at
  BEFORE UPDATE ON court_cases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── COURT ORDERS (High Court verdicts) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS court_orders (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id         UUID NOT NULL REFERENCES court_cases(id) ON DELETE CASCADE,
  case_number     TEXT NOT NULL,
  case_title      TEXT NOT NULL,
  -- Verdict
  verdict         TEXT NOT NULL CHECK (verdict IN ('upheld', 'rejected', 'maintained', 'modified', 'dismissed')),
  verdict_details TEXT NOT NULL DEFAULT '',
  -- Impact on law
  law_impact      TEXT NOT NULL DEFAULT 'none'
                  CHECK (law_impact IN ('none', 'suspended', 'repealed', 'maintained')),
  -- Announcement
  announcement    TEXT NOT NULL DEFAULT '',
  issued_by       TEXT NOT NULL DEFAULT 'Hon. Justice',
  issued_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── SUPREME COURT CASES ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS supreme_court_cases (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sc_case_number    TEXT NOT NULL UNIQUE,
  -- Linked to High Court
  original_case_id  UUID REFERENCES court_cases(id) ON DELETE SET NULL,
  original_order_id UUID REFERENCES court_orders(id) ON DELETE SET NULL,
  title             TEXT NOT NULL,
  description       TEXT NOT NULL DEFAULT '',
  law_id            UUID REFERENCES laws(id) ON DELETE SET NULL,
  law_title         TEXT NOT NULL DEFAULT '',
  -- Who appealed
  appellant_name    TEXT NOT NULL,
  appellant_role    TEXT NOT NULL,
  -- Grounds for appeal
  grounds           TEXT NOT NULL DEFAULT '',
  -- Status
  status            TEXT NOT NULL DEFAULT 'filed'
                    CHECK (status IN ('filed', 'in_review', 'final_order_issued', 'closed', 'dismissed')),
  chief_justice_notes TEXT DEFAULT '',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER supreme_cases_updated_at
  BEFORE UPDATE ON supreme_court_cases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── SUPREME COURT ORDERS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS supreme_court_orders (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sc_case_id      UUID NOT NULL REFERENCES supreme_court_cases(id) ON DELETE CASCADE,
  sc_case_number  TEXT NOT NULL,
  case_title      TEXT NOT NULL,
  -- Final ruling
  ruling          TEXT NOT NULL CHECK (ruling IN ('upheld', 'overturned', 'modified', 'dismissed', 'remanded')),
  ruling_details  TEXT NOT NULL DEFAULT '',
  -- Bill/Draft suspension power
  suspended_bill_id   UUID REFERENCES bills(id) ON DELETE SET NULL,
  suspended_bill_title TEXT DEFAULT '',
  -- Announcement (landmark ruling)
  announcement    TEXT NOT NULL DEFAULT '',
  issued_by       TEXT NOT NULL DEFAULT 'Chief Justice',
  issued_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── NEWS FEED ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS news_feed (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category    TEXT NOT NULL CHECK (category IN ('parliament', 'court', 'supreme_court', 'president', 'ministry', 'system')),
  headline    TEXT NOT NULL,
  body        TEXT NOT NULL DEFAULT '',
  -- Reference to source entity
  ref_type    TEXT DEFAULT '',   -- 'bill', 'law', 'court_case', 'court_order', 'sc_order', 'request'
  ref_id      TEXT DEFAULT '',   -- UUID as text for flexibility
  -- Severity / importance
  priority    TEXT NOT NULL DEFAULT 'normal'
              CHECK (priority IN ('breaking', 'high', 'normal', 'low')),
  posted_by   TEXT NOT NULL DEFAULT 'System',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_news_created ON news_feed(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_category ON news_feed(category, created_at DESC);

-- ─── RLS (open access — same pattern as 003_no_auth_open_access) ──────────────
ALTER TABLE court_cases         ENABLE ROW LEVEL SECURITY;
ALTER TABLE court_orders        ENABLE ROW LEVEL SECURITY;
ALTER TABLE supreme_court_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE supreme_court_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_feed           ENABLE ROW LEVEL SECURITY;

-- Public read for all court & news (fully transparent)
CREATE POLICY "public_read_court_cases"    ON court_cases         FOR SELECT USING (true);
CREATE POLICY "public_read_court_orders"   ON court_orders        FOR SELECT USING (true);
CREATE POLICY "public_read_sc_cases"       ON supreme_court_cases FOR SELECT USING (true);
CREATE POLICY "public_read_sc_orders"      ON supreme_court_orders FOR SELECT USING (true);
CREATE POLICY "public_read_news"           ON news_feed           FOR SELECT USING (true);

-- Anyone can insert (anon included — matches our no-auth pattern)
CREATE POLICY "anyone_insert_court_case"   ON court_cases         FOR INSERT WITH CHECK (true);
CREATE POLICY "anyone_update_court_case"   ON court_cases         FOR UPDATE USING (true);
CREATE POLICY "anyone_insert_court_order"  ON court_orders        FOR INSERT WITH CHECK (true);
CREATE POLICY "anyone_insert_sc_case"      ON supreme_court_cases FOR INSERT WITH CHECK (true);
CREATE POLICY "anyone_update_sc_case"      ON supreme_court_cases FOR UPDATE USING (true);
CREATE POLICY "anyone_insert_sc_order"     ON supreme_court_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "anyone_insert_news"         ON news_feed           FOR INSERT WITH CHECK (true);

-- ─── SEED initial news item ───────────────────────────────────────────────────
INSERT INTO news_feed (category, headline, body, priority, posted_by)
VALUES (
  'system',
  'CLMS Judiciary Module Now Active',
  'The High Court and Supreme Court have been officially inaugurated. Citizens, ministers, and officials can now file cases referencing active laws. All proceedings are publicly visible.',
  'breaking',
  'CLMS System'
);
