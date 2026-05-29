import fs from 'fs';

const MOCK_STORES = [
  {
    id: '11111111-1111-1111-1111-100000000001',
    name: 'Zara',
    floor: 1,
    unit: 'L1-01',
    emoji: '👗',
    description: 'Moda rápida para mujeres, hombres y niños. ropa mujer hombre niños vestidos pantalones'
  },
  {
    id: '11111111-1111-1111-1111-100000000002',
    name: 'Sephora',
    floor: 1,
    unit: 'L1-15',
    emoji: '💄',
    description: 'Amplia gama de productos de belleza, maquillaje y cuidado de la piel. maquillaje perfume cremas skincare labial perfumes'
  },
  {
    id: '11111111-1111-1111-1111-100000000003',
    name: 'Nike Store',
    floor: 2,
    unit: 'L2-05',
    emoji: '👟',
    description: 'Zapatillas deportivas, ropa y accesorios para atletas. zapatillas tenis ropa deportiva correr fútbol'
  },
  {
    id: '11111111-1111-1111-1111-100000000004',
    name: 'Apple Store',
    floor: 2,
    unit: 'L2-10',
    emoji: '💻',
    description: 'Teléfonos móviles, computadoras, tabletas y accesorios Apple. iphone macbook ipad reloj celular computadora audífonos'
  },
  {
    id: '11111111-1111-1111-1111-100000000005',
    name: 'Starbucks',
    floor: 1,
    unit: 'L1-00',
    emoji: '☕',
    description: 'Café, bebidas frías y calientes, bocadillos y postres. café té frappuccino postres desayuno'
  },
  {
    id: '11111111-1111-1111-1111-100000000006',
    name: 'Lego Store',
    floor: 3,
    unit: 'L3-22',
    emoji: '🧱',
    description: 'Sets de construcción Lego para todas las edades. bloques juguetes regalos niños construcción'
  }
];

async function generateEmbedding(text, apiKey) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "models/gemini-embedding-2",
      content: { parts: [{ text }] },
      outputDimensionality: 768
    })
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return `[${data.embedding.values.join(',')}]`;
}

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY");

  let sql = `
-- Insert Mall
INSERT INTO malls (id, name, city) 
VALUES ('11111111-1111-1111-1111-111111111111', 'Kiki Mall', 'Ciudad') 
ON CONFLICT (id) DO NOTHING;

`;

  for (const store of MOCK_STORES) {
    console.log(`Generating embedding for ${store.name}...`);
    const embeddingStr = await generateEmbedding(store.name + " " + store.description, apiKey);
    sql += `INSERT INTO stores (id, mall_id, name, floor, unit, emoji, description, embedding) 
VALUES (
  '${store.id}', 
  '11111111-1111-1111-1111-111111111111', 
  '${store.name.replace(/'/g, "''")}', 
  ${store.floor}, 
  '${store.unit}', 
  '${store.emoji}', 
  '${store.description.replace(/'/g, "''")}', 
  '${embeddingStr}'
) ON CONFLICT (id) DO UPDATE SET embedding = EXCLUDED.embedding, description = EXCLUDED.description;\n\n`;
  }

  fs.writeFileSync('seed_data.sql', sql);
  console.log("SQL file created at seed_data.sql");
}

main().catch(console.error);
