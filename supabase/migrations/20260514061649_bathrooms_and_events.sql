-- Bathrooms / Baños
CREATE TABLE bathrooms (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  mall_id     uuid        NOT NULL REFERENCES malls(id) ON DELETE CASCADE,
  label       text        NOT NULL,
  floor       integer     NOT NULL,
  zone        text        NOT NULL,
  distance_m  integer     NOT NULL,
  accessible  boolean     NOT NULL DEFAULT true,
  family      boolean     NOT NULL DEFAULT false,
  active      boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE bathrooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_read_bathrooms" ON bathrooms FOR SELECT TO anon, authenticated USING (active = true);

-- Events / Eventos
CREATE TABLE events (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  mall_id     uuid        NOT NULL REFERENCES malls(id) ON DELETE CASCADE,
  title       text        NOT NULL,
  dates       text        NOT NULL,
  start_date  date        NOT NULL,
  end_date    date        NOT NULL,
  time        text        NOT NULL,
  location    text        NOT NULL,
  description text        NOT NULL,
  type        text        NOT NULL CHECK (type IN ('moda','musica','belleza','comida','familia')),
  active      boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_read_active_events" ON events FOR SELECT TO anon, authenticated USING (active = true);
