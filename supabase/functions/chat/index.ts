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
    const { query, mallId } = await req.json();

    if (!query) throw new Error("Missing query parameter");
    if (!mallId) throw new Error("Missing mallId parameter");

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) throw new Error("Missing Gemini API Key");

    console.log(`[Edge] Processing query: "${query}" for Mall ID: ${mallId}`);

    // ==========================================
    // STEP 1: Generate Embedding for User Query
    // ==========================================
    console.log('[Edge] [Step 1] Generating embeddings (gemini-embedding-2)...');
    const startStep1 = Date.now();
    const embeddingResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key=${geminiApiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "models/gemini-embedding-2",
        content: { parts: [{ text: query }] },
      })
    });

    if (!embeddingResponse.ok) {
      throw new Error(`Embedding API error: ${await embeddingResponse.text()}`);
    }

    const embeddingData = await embeddingResponse.json();
    const queryEmbedding = embeddingData.embedding.values; // Array of 3072 floats
    console.log(`[Edge] [Step 1] Completed in ${Date.now() - startStep1}ms.`);

    // ==========================================
    // STEP 2: Vector Search via Postgres RPC
    // ==========================================
    // TIER 1: High-confidence — store clearly sells what was searched
    const startStep2 = Date.now();
    const { data: exactMatches, error: rpcError } = await supabase.rpc('match_stores', {
      query_embedding: queryEmbedding,
      match_threshold: 0.65,
      match_count: 5,
      p_mall_id: mallId
    });
    if (rpcError) throw rpcError;
    console.log(`[Edge] [Step 2] Exact matches: ${exactMatches?.length ?? 0} (${Date.now() - startStep2}ms)`);

    // TIER 2: Fallback — loosely related stores, only if no exact match
    let fallbackStores: any[] = [];
    if (!exactMatches || exactMatches.length === 0) {
      const { data: fallback } = await supabase.rpc('match_stores', {
        query_embedding: queryEmbedding,
        match_threshold: 0.40,
        match_count: 3,
        p_mall_id: mallId
      });
      fallbackStores = (fallback || []).filter((s: any) => s.similarity < 0.65);
      console.log(`[Edge] [Step 2b] Vector fallback: ${fallbackStores.length} stores sent to LLM.`);
    }

    const exactCatalog = (exactMatches || []).map((s: any) =>
      `ID: ${s.id} | Nombre: ${s.name} | Nivel: ${s.floor} | Local: ${s.unit} | Categoría: ${s.category || 'General'} | Detalles: ${s.description}`
    ).join('\n');

    const fullCatalog = fallbackStores.map((s: any) =>
      `ID: ${s.id} | Nombre: ${s.name} | Nivel: ${s.floor} | Local: ${s.unit} | Categoría: ${s.category || 'General'} | Detalles: ${s.description}`
    ).join('\n');

    const matchedStores = exactMatches?.length ? exactMatches : fallbackStores;
    console.log('[Edge] Exact catalog:\n', exactCatalog || '(none)');
    if (fullCatalog) console.log('[Edge] Full catalog sent to LLM for reasoning.');

    // ==========================================
    // STEP 3: Conversational Response (RAG)
    // ==========================================
    console.log('[Edge] [Step 3] Generating LLM response (gemini-2.5-flash-lite)...');
    const startStep3 = Date.now();
    const prompt = `
Eres el asistente de Kiki, un directorio digital de centros comerciales.
El visitante buscó: "${query}"

${
  exactCatalog
    ? `ENCONTRÉ ESTAS TIENDAS CON ALTA COINCIDENCIA:
${exactCatalog}

→ Responde: "¡Encontré [tienda] en Nivel [X], Local [Y] que tiene [lo buscado]!"`
    : `NO HAY MATCH EXACTO. El motor de búsqueda semántica sugiere estas posibles tiendas relacionadas:
${fullCatalog}

INSTRUCCIÓN CRÍTICA:
Actúa como un filtro de sentido común. Evalúa si ALGUNA de estas tiendas realmente tiene una relación lógica con "${query}", leyendo sus campos "Categoría" y "Detalles".

→ Si la tienda SÍ tiene relación lógica (Ej: buscan "base de dior" y la sugerencia es "Sephora" de categoría "Belleza"):
   Responde: "No encontré [X] exactamente, pero podrías revisar en [tienda] en Nivel [N], Local [L] donde quizás lo encuentres."

→ Si NINGUNA sugerencia tiene sentido lógico (Ej: buscan "sillas de oficina" y la sugerencia es "Apple Store" de categoría "Tecnología"):
   Responde: "No encontré tiendas que vendan [lo buscado] en este mall."
`
}

Responde en español, de forma cálida y breve (máximo 2 oraciones).
    `;

    const chatResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${geminiApiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          thinkingConfig: { thinkingBudget: 0 },
          responseSchema: {
            type: "OBJECT",
            properties: {
              message: { type: "STRING", description: "Tu respuesta para el visitante." },
              storeIds: {
                type: "ARRAY",
                items: { type: "STRING" },
                description: "Array de los IDs exactos de las tiendas recomendadas. Vacío si no recomiendas ninguna."
              }
            },
            required: ["message", "storeIds"]
          }
        }
      })
    });

    if (!chatResponse.ok) {
      throw new Error(`Chat API error: ${await chatResponse.text()}`);
    }

    const chatData = await chatResponse.json();
    const resultText = chatData.candidates[0].content.parts[0].text;
    const structuredResult = JSON.parse(resultText);

    console.log(`[Edge] [Step 3] Completed in ${Date.now() - startStep3}ms.`);
    console.log(`[Edge] Returning final response to client.`);

    return new Response(JSON.stringify(structuredResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Function Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
