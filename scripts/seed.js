import { createClient } from '@supabase/supabase-js';

const MOCK_STORES = [
  {
    name: 'Zara',
    floor: 1,
    unit: 'L1-01',
    emoji: '👗',
    description: 'Moda rápida para mujeres, hombres y niños. ropa mujer hombre niños vestidos pantalones'
  },
  {
    name: 'Sephora',
    floor: 1,
    unit: 'L1-15',
    emoji: '💄',
    description: 'Amplia gama de productos de belleza, maquillaje y cuidado de la piel. maquillaje perfume cremas skincare labial'
  },
  {
    name: 'Nike Store',
    floor: 2,
    unit: 'L2-05',
    emoji: '👟',
    description: 'Zapatillas deportivas, ropa y accesorios para atletas. zapatillas tenis ropa deportiva correr fútbol'
  },
  {
    name: 'Apple Store',
    floor: 2,
    unit: 'L2-10',
    emoji: '💻',
    description: 'Teléfonos móviles, computadoras, tabletas y accesorios Apple. iphone macbook ipad reloj celular computadora audífonos'
  },
  {
    name: 'Starbucks',
    floor: 1,
    unit: 'L1-00',
    emoji: '☕',
    description: 'Café, bebidas frías y calientes, bocadillos y postres. café té frappuccino postres desayuno'
  },
  {
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
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  // We need service role key to bypass RLS, but since we enabled public access to view and no RLS for insert by default? 
  // Wait, RLS is enabled and public can only SELECT. We must use service role key!
  // I will just use the anon key if RLS allows it, wait, RLS blocks inserts without proper token.
  // Actually, I can just use the anon key and temporarily disable RLS, or use the service role key.
  // Wait, the user has the service role key? Let's check `npx supabase status`.
  console.log("Supabase URL:", supabaseUrl);
}

main().catch(console.error);
