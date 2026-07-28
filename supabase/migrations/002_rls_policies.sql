-- ═══════════════════════════════════════════════════════════════
-- CLMS Row-Level Security Policies
-- ═══════════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ministries ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE laws ENABLE ROW LEVEL SECURITY;
ALTER TABLE parliament_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ministry_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ministry_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$;

-- Helper function to get current user's ministry_id
CREATE OR REPLACE FUNCTION current_user_ministry()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT ministry_id FROM users WHERE id = auth.uid();
$$;

-- ─── USERS ──────────────────────────────────────────────────────
-- President: full access
CREATE POLICY "President full access on users" ON users
  FOR ALL USING (current_user_role() = 'president');

-- Ministry: see own profile
CREATE POLICY "Users see own profile" ON users
  FOR SELECT USING (id = auth.uid());

-- Ministry: update own profile
CREATE POLICY "Users update own profile" ON users
  FOR UPDATE USING (id = auth.uid());

-- ─── MINISTRIES ─────────────────────────────────────────────────
-- All authenticated: read all ministries
CREATE POLICY "All authenticated can read ministries" ON ministries
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- President: full control
CREATE POLICY "President full access on ministries" ON ministries
  FOR ALL USING (current_user_role() = 'president');

-- ─── BILLS ──────────────────────────────────────────────────────
-- All authenticated: read all non-deleted bills
CREATE POLICY "All read bills" ON bills
  FOR SELECT USING (auth.uid() IS NOT NULL AND status != 'deleted');

-- Ministry: create bills for own ministry
CREATE POLICY "Ministry create own bills" ON bills
  FOR INSERT WITH CHECK (
    current_user_role() = 'ministry' AND
    ministry_id = current_user_ministry() AND
    created_by = auth.uid()
  );

-- Ministry: update own draft bills
CREATE POLICY "Ministry update own draft bills" ON bills
  FOR UPDATE USING (
    current_user_role() = 'ministry' AND
    ministry_id = current_user_ministry() AND
    status = 'draft'
  );

-- President: full control on bills
CREATE POLICY "President full access on bills" ON bills
  FOR ALL USING (current_user_role() = 'president');

-- Public: read enacted bills
CREATE POLICY "Public read enacted bills" ON bills
  FOR SELECT USING (status = 'enacted');

-- ─── LAWS ───────────────────────────────────────────────────────
-- All authenticated: read laws
CREATE POLICY "All read laws" ON laws
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- President: insert laws
CREATE POLICY "President insert laws" ON laws
  FOR INSERT WITH CHECK (current_user_role() = 'president');

-- President: update/delete laws
CREATE POLICY "President update delete laws" ON laws
  FOR ALL USING (current_user_role() = 'president');

-- Public: read laws
CREATE POLICY "Public read laws" ON laws
  FOR SELECT USING (true);

-- ─── PARLIAMENT VOTES ────────────────────────────────────────────
-- All authenticated: read votes
CREATE POLICY "All read parliament votes" ON parliament_votes
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Ministry and President: cast own vote
CREATE POLICY "Ministry and President vote" ON parliament_votes
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    current_user_role() IN ('ministry', 'president') AND
    user_id = auth.uid()
  );

-- ─── MINISTRY REVIEWS ────────────────────────────────────────────
-- All authenticated: read reviews
CREATE POLICY "All read reviews" ON ministry_reviews
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Ministry: insert review for their ministry
CREATE POLICY "Ministry insert own reviews" ON ministry_reviews
  FOR INSERT WITH CHECK (
    current_user_role() = 'ministry' AND
    ministry_id = current_user_ministry()
  );

-- President: full access
CREATE POLICY "President full access on reviews" ON ministry_reviews
  FOR ALL USING (current_user_role() = 'president');

-- ─── REQUESTS ────────────────────────────────────────────────────
-- Ministry: read requests involving their ministry
CREATE POLICY "Ministry read own requests" ON requests
  FOR SELECT USING (
    current_user_role() IN ('ministry', 'president') AND
    (from_ministry = current_user_ministry() OR to_ministry = current_user_ministry() OR current_user_role() = 'president')
  );

-- Ministry: create requests from own ministry
CREATE POLICY "Ministry create requests" ON requests
  FOR INSERT WITH CHECK (
    current_user_role() = 'ministry' AND
    from_ministry = current_user_ministry()
  );

-- Ministry: update requests sent to their ministry (approve/reject/return)
CREATE POLICY "Ministry update incoming requests" ON requests
  FOR UPDATE USING (
    current_user_role() = 'ministry' AND
    to_ministry = current_user_ministry()
  );

-- President: full access
CREATE POLICY "President full access on requests" ON requests
  FOR ALL USING (current_user_role() = 'president');

-- ─── MINISTRY METRICS ────────────────────────────────────────────
-- All authenticated: read
CREATE POLICY "All read metrics" ON ministry_metrics
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Ministry: insert own metrics
CREATE POLICY "Ministry insert own metrics" ON ministry_metrics
  FOR INSERT WITH CHECK (
    current_user_role() = 'ministry' AND
    ministry_id = current_user_ministry()
  );

-- President: full access
CREATE POLICY "President full access on metrics" ON ministry_metrics
  FOR ALL USING (current_user_role() = 'president');

-- ─── NOTIFICATIONS ───────────────────────────────────────────────
-- Users: see own notifications
CREATE POLICY "Users read own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

-- Users: mark own notifications as read
CREATE POLICY "Users update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- President: insert notifications for any user
CREATE POLICY "President insert notifications" ON notifications
  FOR INSERT WITH CHECK (current_user_role() = 'president');

-- ─── AUDIT LOGS ──────────────────────────────────────────────────
-- Authenticated: insert only (write-only log)
CREATE POLICY "Authenticated insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- President: read all audit logs
CREATE POLICY "President read all audit logs" ON audit_logs
  FOR SELECT USING (current_user_role() = 'president');
