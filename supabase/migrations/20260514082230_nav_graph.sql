-- Navigation graph for A* pathfinding
CREATE TABLE nav_nodes (
  id          uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  mall_id     uuid    NOT NULL REFERENCES malls(id) ON DELETE CASCADE,
  floor       int     NOT NULL,
  x           float   NOT NULL,
  y           float   NOT NULL,
  type        text    NOT NULL CHECK (type IN ('corridor','elevator','bathroom','entrance','store')),
  label       text,
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE nav_edges (
  id           uuid  DEFAULT gen_random_uuid() PRIMARY KEY,
  mall_id      uuid  NOT NULL REFERENCES malls(id) ON DELETE CASCADE,
  from_node_id uuid  NOT NULL REFERENCES nav_nodes(id) ON DELETE CASCADE,
  to_node_id   uuid  NOT NULL REFERENCES nav_nodes(id) ON DELETE CASCADE,
  weight       float,   -- NULL = computed from Euclidean distance at query time
  active       boolean NOT NULL DEFAULT true
);

ALTER TABLE nav_nodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_read_nav_nodes" ON nav_nodes FOR SELECT TO anon, authenticated USING (active = true);

ALTER TABLE nav_edges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_read_nav_edges" ON nav_edges FOR SELECT TO anon, authenticated USING (active = true);

ALTER TABLE stores    ADD COLUMN IF NOT EXISTS node_id uuid REFERENCES nav_nodes(id);
ALTER TABLE bathrooms ADD COLUMN IF NOT EXISTS node_id uuid REFERENCES nav_nodes(id);
