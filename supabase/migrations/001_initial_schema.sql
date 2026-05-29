-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Malls (Multi-tenant foundation)
CREATE TABLE malls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  city text,
  country text,
  floor_count int DEFAULT 3,
  created_at timestamptz DEFAULT now()
);

-- 2. Stores
CREATE TABLE stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mall_id uuid REFERENCES malls(id) ON DELETE CASCADE,
  name text NOT NULL,
  floor int NOT NULL,
  unit text NOT NULL,
  emoji text,
  color text, -- hex brand color
  description text,
  embedding vector(768), -- Using 768 for Gemini 1.5 embeddings
  created_at timestamptz DEFAULT now()
);

-- 3. Categories (Hierarchical)
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  parent_id uuid REFERENCES categories(id) ON DELETE CASCADE
);

-- Junction: Store <-> Categories
CREATE TABLE store_categories (
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (store_id, category_id)
);

-- 4. Brands
CREATE TABLE brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE
);

-- Junction: Store <-> Brands
CREATE TABLE store_brands (
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  brand_id uuid REFERENCES brands(id) ON DELETE CASCADE,
  PRIMARY KEY (store_id, brand_id)
);

-- 5. Tags (Simple string arrays tied to a store)
CREATE TABLE tags (
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  tag text NOT NULL,
  PRIMARY KEY (store_id, tag)
);

-- 6. Map Data: Nodes
CREATE TABLE nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mall_id uuid REFERENCES malls(id) ON DELETE CASCADE,
  floor int NOT NULL,
  x_coordinate float NOT NULL,
  y_coordinate float NOT NULL,
  type text NOT NULL -- 'corridor', 'escalator', 'elevator', 'store_entrance'
);

-- 7. Map Data: Edges
CREATE TABLE edges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  node_a_id uuid REFERENCES nodes(id) ON DELETE CASCADE,
  node_b_id uuid REFERENCES nodes(id) ON DELETE CASCADE,
  distance float NOT NULL,
  is_accessible boolean DEFAULT true -- false for escalators
);

-- Create Indexes for performance
CREATE INDEX on stores using ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

CREATE INDEX idx_store_brands_brand_id ON store_brands(brand_id);

-- Row Level Security (RLS) Configuration

-- Enable RLS on core tables
ALTER TABLE malls ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read malls and stores (public access for kiosk app)
CREATE POLICY "Public can view malls" ON malls FOR SELECT USING (true);
CREATE POLICY "Public can view stores" ON stores FOR SELECT USING (true);

-- To handle Role-Based Access Control (RBAC), we assume JWT tokens 
-- will contain 'user_role', 'mall_id', and 'store_id' in app_metadata.

-- Policy: Mall Admins can update any store in their mall
CREATE POLICY "Mall admins can update their mall stores" ON stores
  FOR UPDATE 
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'user_role') = 'mall_admin' 
    AND mall_id = (auth.jwt() -> 'app_metadata' ->> 'mall_id')::uuid
  );

-- Policy: Store Managers can only update their specific store
CREATE POLICY "Store managers can update their store" ON stores
  FOR UPDATE
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'user_role') = 'store_manager'
    AND id = (auth.jwt() -> 'app_metadata' ->> 'store_id')::uuid
  );
