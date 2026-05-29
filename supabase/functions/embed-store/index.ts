import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { store_id } = await req.json();
    if (!store_id) throw new Error('Missing store_id');

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) throw new Error('Missing GEMINI_API_KEY');

    // ── 1. Fetch full store data ───────────────────────────
    const { data: store, error: storeErr } = await supabase
      .from('stores')
      .select('id, name, description')
      .eq('id', store_id)
      .single();
    if (storeErr || !store) throw new Error(`Store not found: ${storeErr?.message}`);

    const { data: catRows } = await supabase
      .from('store_categories')
      .select('categories(name)')
      .eq('store_id', store_id);

    const { data: brandRows } = await supabase
      .from('store_brands')
      .select('brands(name)')
      .eq('store_id', store_id);

    const categories = (catRows ?? []).map((r: any) => r.categories?.name).filter(Boolean).join(', ');
    const brands     = (brandRows ?? []).map((r: any) => r.brands?.name).filter(Boolean).join(', ');

    console.log(`[embed-store] Processing "${store.name}" (${store_id})`);

    // ── 2. Regenerate keywords via LLM ────────────────────
    const keywordPrompt = `Eres un experto en SEO para un directorio de tiendas en un centro comercial.

Tienda: ${store.name}
Descripción: ${store.description}
${categories ? `Categorías: ${categories}` : ''}
${brands ? `Marcas: ${brands}` : ''}

Genera entre 20 y 35 palabras clave de búsqueda en español que un visitante del mall podría escribir para encontrar esta tienda. Incluye variaciones del nombre de la tienda, productos específicos, marcas, y frases de búsqueda naturales.`;

    const kwRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: keywordPrompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            thinkingConfig: { thinkingBudget: 0 },
            responseSchema: {
              type: 'OBJECT',
              properties: {
                keywords: { type: 'ARRAY', items: { type: 'STRING' } },
              },
              required: ['keywords'],
            },
          },
        }),
      }
    );

    if (!kwRes.ok) throw new Error(`Keyword generation error: ${await kwRes.text()}`);
    const kwData = await kwRes.json();
    const keywords: string[] = JSON.parse(kwData.candidates[0].content.parts[0].text).keywords;

    console.log(`[embed-store] Generated ${keywords.length} keywords for "${store.name}"`);

    // ── 3. Build embedding text ────────────────────────────
    const parts = [store.name, store.description];
    if (keywords.length) parts.push(keywords.join(', '));
    if (categories)      parts.push(`Categorías: ${categories}`);
    if (brands)          parts.push(`Marcas: ${brands}`);
    const embeddingText = parts.join('. ');

    // ── 4. Generate new embedding (3072-dim) ──────────────
    const embRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'models/gemini-embedding-2',
          content: { parts: [{ text: embeddingText }] },
        }),
      }
    );

    if (!embRes.ok) throw new Error(`Gemini embedding error: ${await embRes.text()}`);
    const embData = await embRes.json();
    const embedding: number[] = embData.embedding.values;

    // ── 5. Update keywords + embedding ────────────────────
    const { error: updateErr } = await supabase
      .from('stores')
      .update({ keywords: keywords.join(', '), embedding })
      .eq('id', store_id);

    if (updateErr) throw new Error(`Failed to update store: ${updateErr.message}`);

    console.log(`[embed-store] Updated "${store.name}": ${keywords.length} keywords, ${embedding.length} dims`);

    return new Response(JSON.stringify({ ok: true, keywords: keywords.length, dims: embedding.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('[embed-store] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
