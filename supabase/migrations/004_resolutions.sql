-- ═══════════════════════════════════════════════════════════════
-- CLMS Resolutions Schema Migration
-- ═══════════════════════════════════════════════════════════════

-- ─── RESOLUTIONS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS resolutions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resolution_number TEXT NOT NULL UNIQUE,
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

CREATE TRIGGER resolutions_updated_at
  BEFORE UPDATE ON resolutions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── RESOLUTION VOTES ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS resolution_votes (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resolution_id UUID NOT NULL REFERENCES resolutions(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vote         TEXT NOT NULL CHECK (vote IN ('approve','reject','abstain')),
  timestamp    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (resolution_id, user_id)  -- one vote per user per resolution
);

-- ─── RESOLUTION REVIEWS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS resolution_reviews (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resolution_id UUID NOT NULL REFERENCES resolutions(id) ON DELETE CASCADE,
  ministry_id   UUID NOT NULL REFERENCES ministries(id) ON DELETE CASCADE,
  decision      TEXT NOT NULL CHECK (decision IN ('approve','suspend','reject')),
  reason        TEXT NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (resolution_id, ministry_id)
);
