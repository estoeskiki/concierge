-- Store sales / baratillo deals
-- A store shows the BARATILLO badge when it has at least one active row here.

CREATE TABLE IF NOT EXISTS store_sales (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id    uuid        NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  description text        NOT NULL,  -- e.g. "30% descuento en toda la tienda"
  active      boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_store_sales_active
  ON store_sales(store_id) WHERE active = true;

ALTER TABLE store_sales ENABLE ROW LEVEL SECURITY;

-- Public kiosk reads only active sales (no auth needed)
CREATE POLICY "anon_read_active_sales"
  ON store_sales FOR SELECT
  TO anon, authenticated
  USING (active = true);
