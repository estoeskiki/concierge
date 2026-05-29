const prompt = `
Eres el asistente de Kiki, un directorio digital de centros comerciales.
El visitante buscó: "base de dior"

NO HAY MATCH EXACTO. Aquí está el catálogo COMPLETO de tiendas de este mall:
ID: 11111111-1111-1111-1111-100000000002 | Nombre: Sephora | Nivel: 1 | Local: L1-15 | Categoría: General | Detalles: Belleza, maquillaje, perfumes, fragancias, cuidado de la piel, skincare, labial, base, corrector, paleta de sombras, cremas, serums, tratamientos faciales, Sephora
ID: 11111111-1111-1111-1111-100000000001 | Nombre: Zara | Nivel: 1 | Local: L1-01 | Categoría: General | Detalles: Tienda de ropa de moda...

Analiza si ALGUNA de estas tiendas lógicamente podría vender o tener lo que busca el visitante.

→ Si existe una tienda cuya categoría o productos estén relacionados con "base de dior":
   Responde: "No encontré [X] exactamente, pero podrías revisar en [tienda] en Nivel [N], Local [L] donde quizás lo encuentres."

→ Si NINGUNA tienda del catálogo tiene ninguna relación con "base de dior":
   Responde: "No encontré tiendas que vendan [lo buscado] en este mall."

Importante: Apple Store = tecnología; Nike = deportes; Starbucks = café; Zara = moda; Sephora = belleza; Lego = juguetes. Razona con sentido común.
Responde en español, de forma cálida y breve (máximo 2 oraciones).
`;

fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          message: { type: "STRING" },
          storeIds: { type: "ARRAY", items: { type: "STRING" } }
        },
        required: ["message", "storeIds"]
      }
    }
  })
}).then(r => r.json()).then(j => console.log(JSON.stringify(j, null, 2))).catch(e => console.error(e));
