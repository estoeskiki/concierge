-- ============================================================
-- RLS Full Coverage
-- Enables RLS and adds policies on all previously unprotected
-- tables. Uses app_metadata (admin-set, secure) for role checks.
-- ============================================================

-- Helper: extract role / mall_id / store_id from JWT app_metadata
-- Using (select ...) wrapper for plan-cache performance.

-- ─── CATEGORIES ─────────────────────────────────────────────
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_read_categories"
  ON categories FOR SELECT
  USING (true);

CREATE POLICY "mall_admin_insert_categories"
  ON categories FOR INSERT
  WITH CHECK (
    (select (auth.jwt()->'app_metadata'->>'user_role')) = 'mall_admin'
  );

CREATE POLICY "mall_admin_update_categories"
  ON categories FOR UPDATE
  USING (
    (select (auth.jwt()->'app_metadata'->>'user_role')) = 'mall_admin'
  );

CREATE POLICY "mall_admin_delete_categories"
  ON categories FOR DELETE
  USING (
    (select (auth.jwt()->'app_metadata'->>'user_role')) = 'mall_admin'
  );

-- ─── BRANDS ─────────────────────────────────────────────────
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_read_brands"
  ON brands FOR SELECT
  USING (true);

CREATE POLICY "store_or_admin_insert_brands"
  ON brands FOR INSERT
  WITH CHECK (
    (select (auth.jwt()->'app_metadata'->>'user_role')) IN ('store_manager', 'mall_admin')
  );

CREATE POLICY "mall_admin_update_brands"
  ON brands FOR UPDATE
  USING (
    (select (auth.jwt()->'app_metadata'->>'user_role')) = 'mall_admin'
  );

CREATE POLICY "mall_admin_delete_brands"
  ON brands FOR DELETE
  USING (
    (select (auth.jwt()->'app_metadata'->>'user_role')) = 'mall_admin'
  );

-- ─── STORE_CATEGORIES ───────────────────────────────────────
ALTER TABLE store_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_read_store_categories"
  ON store_categories FOR SELECT
  USING (true);

CREATE POLICY "store_or_admin_insert_store_categories"
  ON store_categories FOR INSERT
  WITH CHECK (
    (select (auth.jwt()->'app_metadata'->>'user_role')) = 'mall_admin'
    OR (
      (select (auth.jwt()->'app_metadata'->>'user_role')) = 'store_manager'
      AND store_id = (select (auth.jwt()->'app_metadata'->>'store_id'))::uuid
    )
  );

CREATE POLICY "store_or_admin_delete_store_categories"
  ON store_categories FOR DELETE
  USING (
    (select (auth.jwt()->'app_metadata'->>'user_role')) = 'mall_admin'
    OR (
      (select (auth.jwt()->'app_metadata'->>'user_role')) = 'store_manager'
      AND store_id = (select (auth.jwt()->'app_metadata'->>'store_id'))::uuid
    )
  );

-- ─── STORE_BRANDS ────────────────────────────────────────────
ALTER TABLE store_brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_read_store_brands"
  ON store_brands FOR SELECT
  USING (true);

CREATE POLICY "store_or_admin_insert_store_brands"
  ON store_brands FOR INSERT
  WITH CHECK (
    (select (auth.jwt()->'app_metadata'->>'user_role')) = 'mall_admin'
    OR (
      (select (auth.jwt()->'app_metadata'->>'user_role')) = 'store_manager'
      AND store_id = (select (auth.jwt()->'app_metadata'->>'store_id'))::uuid
    )
  );

CREATE POLICY "store_or_admin_delete_store_brands"
  ON store_brands FOR DELETE
  USING (
    (select (auth.jwt()->'app_metadata'->>'user_role')) = 'mall_admin'
    OR (
      (select (auth.jwt()->'app_metadata'->>'user_role')) = 'store_manager'
      AND store_id = (select (auth.jwt()->'app_metadata'->>'store_id'))::uuid
    )
  );

-- ─── TAGS ────────────────────────────────────────────────────
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_read_tags"
  ON tags FOR SELECT
  USING (true);

CREATE POLICY "store_or_admin_insert_tags"
  ON tags FOR INSERT
  WITH CHECK (
    (select (auth.jwt()->'app_metadata'->>'user_role')) = 'mall_admin'
    OR (
      (select (auth.jwt()->'app_metadata'->>'user_role')) = 'store_manager'
      AND store_id = (select (auth.jwt()->'app_metadata'->>'store_id'))::uuid
    )
  );

CREATE POLICY "store_or_admin_delete_tags"
  ON tags FOR DELETE
  USING (
    (select (auth.jwt()->'app_metadata'->>'user_role')) = 'mall_admin'
    OR (
      (select (auth.jwt()->'app_metadata'->>'user_role')) = 'store_manager'
      AND store_id = (select (auth.jwt()->'app_metadata'->>'store_id'))::uuid
    )
  );

-- ─── STORE_SALES (add write policies) ───────────────────────
-- SELECT policy already exists (anon_read_active_sales).
-- Add INSERT / UPDATE / DELETE for store_manager + mall_admin.

CREATE POLICY "store_or_admin_insert_store_sales"
  ON store_sales FOR INSERT
  WITH CHECK (
    (select (auth.jwt()->'app_metadata'->>'user_role')) = 'mall_admin'
    OR (
      (select (auth.jwt()->'app_metadata'->>'user_role')) = 'store_manager'
      AND store_id = (select (auth.jwt()->'app_metadata'->>'store_id'))::uuid
    )
  );

CREATE POLICY "store_or_admin_update_store_sales"
  ON store_sales FOR UPDATE
  USING (
    (select (auth.jwt()->'app_metadata'->>'user_role')) = 'mall_admin'
    OR (
      (select (auth.jwt()->'app_metadata'->>'user_role')) = 'store_manager'
      AND store_id = (select (auth.jwt()->'app_metadata'->>'store_id'))::uuid
    )
  );

CREATE POLICY "store_or_admin_delete_store_sales"
  ON store_sales FOR DELETE
  USING (
    (select (auth.jwt()->'app_metadata'->>'user_role')) = 'mall_admin'
    OR (
      (select (auth.jwt()->'app_metadata'->>'user_role')) = 'store_manager'
      AND store_id = (select (auth.jwt()->'app_metadata'->>'store_id'))::uuid
    )
  );

-- ─── EVENTS (add write policies) ────────────────────────────
-- SELECT policy already exists (anon_read_active_events).

CREATE POLICY "mall_admin_insert_events"
  ON events FOR INSERT
  WITH CHECK (
    (select (auth.jwt()->'app_metadata'->>'user_role')) = 'mall_admin'
    AND mall_id = (select (auth.jwt()->'app_metadata'->>'mall_id'))::uuid
  );

CREATE POLICY "mall_admin_update_events"
  ON events FOR UPDATE
  USING (
    (select (auth.jwt()->'app_metadata'->>'user_role')) = 'mall_admin'
    AND mall_id = (select (auth.jwt()->'app_metadata'->>'mall_id'))::uuid
  );

CREATE POLICY "mall_admin_delete_events"
  ON events FOR DELETE
  USING (
    (select (auth.jwt()->'app_metadata'->>'user_role')) = 'mall_admin'
    AND mall_id = (select (auth.jwt()->'app_metadata'->>'mall_id'))::uuid
  );

-- ─── BATHROOMS (add write policies) ─────────────────────────
-- SELECT policy already exists (anon_read_bathrooms).

CREATE POLICY "mall_admin_insert_bathrooms"
  ON bathrooms FOR INSERT
  WITH CHECK (
    (select (auth.jwt()->'app_metadata'->>'user_role')) = 'mall_admin'
    AND mall_id = (select (auth.jwt()->'app_metadata'->>'mall_id'))::uuid
  );

CREATE POLICY "mall_admin_update_bathrooms"
  ON bathrooms FOR UPDATE
  USING (
    (select (auth.jwt()->'app_metadata'->>'user_role')) = 'mall_admin'
    AND mall_id = (select (auth.jwt()->'app_metadata'->>'mall_id'))::uuid
  );

CREATE POLICY "mall_admin_delete_bathrooms"
  ON bathrooms FOR DELETE
  USING (
    (select (auth.jwt()->'app_metadata'->>'user_role')) = 'mall_admin'
    AND mall_id = (select (auth.jwt()->'app_metadata'->>'mall_id'))::uuid
  );

-- ─── STORES (add INSERT + DELETE policies) ──────────────────
-- UPDATE policies already exist (mall_admin + store_manager).

CREATE POLICY "mall_admin_insert_stores"
  ON stores FOR INSERT
  WITH CHECK (
    (select (auth.jwt()->'app_metadata'->>'user_role')) = 'mall_admin'
    AND mall_id = (select (auth.jwt()->'app_metadata'->>'mall_id'))::uuid
  );

CREATE POLICY "mall_admin_delete_stores"
  ON stores FOR DELETE
  USING (
    (select (auth.jwt()->'app_metadata'->>'user_role')) = 'mall_admin'
    AND mall_id = (select (auth.jwt()->'app_metadata'->>'mall_id'))::uuid
  );

-- ─── MALLS (add UPDATE policy) ───────────────────────────────
-- SELECT policy already exists (public can view malls).

CREATE POLICY "mall_admin_update_malls"
  ON malls FOR UPDATE
  USING (
    (select (auth.jwt()->'app_metadata'->>'user_role')) = 'mall_admin'
    AND id = (select (auth.jwt()->'app_metadata'->>'mall_id'))::uuid
  );

-- ─── NAV_NODES (add write policies) ─────────────────────────
-- SELECT policy already exists.

CREATE POLICY "mall_admin_insert_nav_nodes"
  ON nav_nodes FOR INSERT
  WITH CHECK (
    (select (auth.jwt()->'app_metadata'->>'user_role')) = 'mall_admin'
    AND mall_id = (select (auth.jwt()->'app_metadata'->>'mall_id'))::uuid
  );

CREATE POLICY "mall_admin_update_nav_nodes"
  ON nav_nodes FOR UPDATE
  USING (
    (select (auth.jwt()->'app_metadata'->>'user_role')) = 'mall_admin'
    AND mall_id = (select (auth.jwt()->'app_metadata'->>'mall_id'))::uuid
  );

CREATE POLICY "mall_admin_delete_nav_nodes"
  ON nav_nodes FOR DELETE
  USING (
    (select (auth.jwt()->'app_metadata'->>'user_role')) = 'mall_admin'
    AND mall_id = (select (auth.jwt()->'app_metadata'->>'mall_id'))::uuid
  );

-- ─── NAV_EDGES (add write policies) ─────────────────────────
-- SELECT policy already exists.

CREATE POLICY "mall_admin_insert_nav_edges"
  ON nav_edges FOR INSERT
  WITH CHECK (
    (select (auth.jwt()->'app_metadata'->>'user_role')) = 'mall_admin'
    AND mall_id = (select (auth.jwt()->'app_metadata'->>'mall_id'))::uuid
  );

CREATE POLICY "mall_admin_update_nav_edges"
  ON nav_edges FOR UPDATE
  USING (
    (select (auth.jwt()->'app_metadata'->>'user_role')) = 'mall_admin'
    AND mall_id = (select (auth.jwt()->'app_metadata'->>'mall_id'))::uuid
  );

CREATE POLICY "mall_admin_delete_nav_edges"
  ON nav_edges FOR DELETE
  USING (
    (select (auth.jwt()->'app_metadata'->>'user_role')) = 'mall_admin'
    AND mall_id = (select (auth.jwt()->'app_metadata'->>'mall_id'))::uuid
  );
