-- Fix match_stores function to not reference non-existent columns (categories, brands, tags)
DROP FUNCTION IF EXISTS match_stores(vector, float, int, uuid);

CREATE OR REPLACE FUNCTION match_stores(
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  p_mall_id uuid
)
RETURNS TABLE (
  id uuid,
  name text,
  floor int,
  unit text,
  description text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    stores.id,
    stores.name,
    stores.floor,
    stores.unit,
    stores.description,
    1 - (stores.embedding <=> query_embedding) AS similarity
  FROM stores
  WHERE stores.mall_id = p_mall_id
    -- Only return matches above the threshold
    AND 1 - (stores.embedding <=> query_embedding) > match_threshold
  ORDER BY stores.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
