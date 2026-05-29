import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Replace with your actual Gemini API key
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 

if (!GEMINI_API_KEY) {
  console.error("Please set the GEMINI_API_KEY environment variable.");
  process.exit(1);
}

// Helper to delay for rate limits
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const RAW_STORES = [
  // 1-10: Moda
  { name: "Zara", category: "Moda", brands: ["Zara"], desc: "Ropa de moda para mujer, hombre y niños.", floor: 1, unit: "L1-01" },
  { name: "H&M", category: "Moda", brands: ["H&M"], desc: "Moda accesible para toda la familia.", floor: 1, unit: "L1-02" },
  { name: "Levi's", category: "Moda", brands: ["Levi's"], desc: "Ropa de mezclilla, jeans y chaquetas.", floor: 1, unit: "L1-03" },
  { name: "Mango", category: "Moda", brands: ["Mango"], desc: "Ropa de diseño español para mujer.", floor: 1, unit: "L1-04" },
  { name: "Bershka", category: "Moda", brands: ["Bershka"], desc: "Ropa juvenil y tendencias actuales.", floor: 1, unit: "L1-05" },
  { name: "Pull&Bear", category: "Moda", brands: ["Pull&Bear"], desc: "Moda casual y urbana.", floor: 1, unit: "L1-06" },
  { name: "Victoria's Secret", category: "Moda", brands: ["Victoria's Secret", "PINK"], desc: "Lencería, ropa interior y fragancias.", floor: 2, unit: "L2-01" },
  { name: "Forever 21", category: "Moda", brands: ["Forever 21"], desc: "Ropa de moda a precios accesibles.", floor: 2, unit: "L2-02" },
  { name: "Guess", category: "Moda", brands: ["Guess"], desc: "Ropa, relojes y accesorios de diseño.", floor: 2, unit: "L2-03" },
  { name: "Calvin Klein", category: "Moda", brands: ["Calvin Klein"], desc: "Ropa interior, jeans y moda minimalista.", floor: 2, unit: "L2-04" },

  // 11-20: Deportes
  { name: "Nike Store", category: "Deportes", brands: ["Nike", "Jordan"], desc: "Zapatillas, ropa deportiva y accesorios.", floor: 2, unit: "L2-05" },
  { name: "Adidas", category: "Deportes", brands: ["Adidas", "Originals"], desc: "Ropa deportiva, zapatillas y equipamiento.", floor: 2, unit: "L2-06" },
  { name: "Puma", category: "Deportes", brands: ["Puma"], desc: "Calzado deportivo y moda urbana.", floor: 2, unit: "L2-07" },
  { name: "Under Armour", category: "Deportes", brands: ["Under Armour"], desc: "Ropa de alto rendimiento para atletas.", floor: 2, unit: "L2-08" },
  { name: "Reebok", category: "Deportes", brands: ["Reebok"], desc: "Ropa y zapatillas para fitness y crossfit.", floor: 2, unit: "L2-09" },
  { name: "The North Face", category: "Deportes", brands: ["The North Face"], desc: "Ropa y equipamiento para montañismo y outdoor.", floor: 3, unit: "L3-01" },
  { name: "Columbia", category: "Deportes", brands: ["Columbia"], desc: "Ropa y accesorios para actividades al aire libre.", floor: 3, unit: "L3-02" },
  { name: "Vans", category: "Deportes", brands: ["Vans"], desc: "Zapatillas y ropa para skate.", floor: 3, unit: "L3-03" },
  { name: "Converse", category: "Deportes", brands: ["Converse"], desc: "Zapatillas clásicas y ropa urbana.", floor: 3, unit: "L3-04" },
  { name: "Decathlon", category: "Deportes", brands: ["Quechua", "Kipsta", "Domyos"], desc: "Equipamiento y ropa para más de 70 deportes.", floor: 3, unit: "L3-05" },

  // 21-30: Tecnología
  { name: "Apple Store", category: "Tecnología", brands: ["Apple", "Beats"], desc: "iPhones, MacBooks, iPads y accesorios.", floor: 2, unit: "L2-10" },
  { name: "Samsung Experience", category: "Tecnología", brands: ["Samsung"], desc: "Smartphones, tablets, relojes y TVs.", floor: 2, unit: "L2-11" },
  { name: "Sony Store", category: "Tecnología", brands: ["Sony", "PlayStation"], desc: "Televisores, cámaras, audífonos y consolas.", floor: 2, unit: "L2-12" },
  { name: "Xiaomi Store", category: "Tecnología", brands: ["Xiaomi", "Poco", "Redmi"], desc: "Teléfonos inteligentes y dispositivos smart home.", floor: 3, unit: "L3-06" },
  { name: "Huawei", category: "Tecnología", brands: ["Huawei"], desc: "Laptops, celulares y wearables.", floor: 3, unit: "L3-07" },
  { name: "Mac Center", category: "Tecnología", brands: ["Apple", "JBL", "Bose"], desc: "Distribuidor autorizado Apple y sonido.", floor: 3, unit: "L3-08" },
  { name: "GameStop", category: "Tecnología", brands: ["Nintendo", "PlayStation", "Xbox"], desc: "Videojuegos, consolas y coleccionables.", floor: 3, unit: "L3-09" },
  { name: "Bose", category: "Tecnología", brands: ["Bose"], desc: "Sistemas de sonido, audífonos y parlantes.", floor: 3, unit: "L3-10" },
  { name: "GoPro", category: "Tecnología", brands: ["GoPro"], desc: "Cámaras de acción y accesorios.", floor: 3, unit: "L3-11" },
  { name: "DJI", category: "Tecnología", brands: ["DJI"], desc: "Drones y estabilizadores de cámara.", floor: 3, unit: "L3-12" },

  // 31-40: Belleza y Salud
  { name: "Sephora", category: "Belleza", brands: ["Dior", "Fenty Beauty", "Rare Beauty", "Sephora Collection"], desc: "Cosméticos, perfumes y cuidado de la piel.", floor: 1, unit: "L1-15" },
  { name: "MAC Cosmetics", category: "Belleza", brands: ["MAC"], desc: "Maquillaje profesional y labiales.", floor: 1, unit: "L1-16" },
  { name: "Bath & Body Works", category: "Belleza", brands: ["Bath & Body Works"], desc: "Lociones, jabones y velas aromáticas.", floor: 1, unit: "L1-17" },
  { name: "Kiehl's", category: "Belleza", brands: ["Kiehl's"], desc: "Productos de cuidado de la piel de alta calidad.", floor: 1, unit: "L1-18" },
  { name: "L'Occitane", category: "Belleza", brands: ["L'Occitane"], desc: "Cosméticos y fragancias naturales francesas.", floor: 1, unit: "L1-19" },
  { name: "The Body Shop", category: "Belleza", brands: ["The Body Shop"], desc: "Cosmética natural y libre de crueldad.", floor: 1, unit: "L1-20" },
  { name: "Farmacia San Pablo", category: "Salud", brands: ["La Roche-Posay", "Vichy", "Eucerin"], desc: "Medicamentos, farmacia y dermocosmética.", floor: 1, unit: "L1-21" },
  { name: "GNC", category: "Salud", brands: ["GNC", "Optimum Nutrition"], desc: "Vitaminas, suplementos y proteínas.", floor: 3, unit: "L3-15" },
  { name: "Ópticas Devlyn", category: "Salud", brands: ["Ray-Ban", "Oakley", "Vogue"], desc: "Lentes graduados, de sol y examen de la vista.", floor: 2, unit: "L2-15" },
  { name: "Salón Beauty", category: "Salud", brands: ["Kerastase", "L'Oreal"], desc: "Peluquería, cortes y tintes.", floor: 2, unit: "L2-16" },

  // 41-50: Restaurantes y Café
  { name: "Starbucks", category: "Café", brands: ["Starbucks"], desc: "Café, frappuccinos y bocadillos.", floor: 1, unit: "L1-00" },
  { name: "McDonald's", category: "Restaurantes", brands: ["McDonald's"], desc: "Hamburguesas, papas fritas y comida rápida.", floor: 4, unit: "FC-01" },
  { name: "KFC", category: "Restaurantes", brands: ["KFC"], desc: "Pollo frito y complementos.", floor: 4, unit: "FC-02" },
  { name: "Subway", category: "Restaurantes", brands: ["Subway"], desc: "Sándwiches y ensaladas saludables.", floor: 4, unit: "FC-03" },
  { name: "Burger King", category: "Restaurantes", brands: ["Burger King"], desc: "Hamburguesas a la parrilla.", floor: 4, unit: "FC-04" },
  { name: "Dominos Pizza", category: "Restaurantes", brands: ["Dominos"], desc: "Pizzas, alitas y postres.", floor: 4, unit: "FC-05" },
  { name: "Panda Express", category: "Restaurantes", brands: ["Panda Express"], desc: "Comida rápida china americana.", floor: 4, unit: "FC-06" },
  { name: "Crepes & Waffles", category: "Restaurantes", brands: ["Crepes & Waffles"], desc: "Crepes dulces y salados, helados.", floor: 4, unit: "FC-07" },
  { name: "Juan Valdez", category: "Café", brands: ["Juan Valdez"], desc: "Café premium colombiano.", floor: 2, unit: "L2-00" },
  { name: "Cinnabon", category: "Postres", brands: ["Cinnabon"], desc: "Rollos de canela y bebidas dulces.", floor: 3, unit: "L3-00" }
];

async function enrichWithLLM(store) {
  console.log(`[1/2] Enriqueciendo: ${store.name}...`);
  const prompt = `
  Eres un experto en SEO para retail. Actúa como el pipeline automático de ingesta de datos.
  Un negocio nos dio esta información:
  Nombre: ${store.name}
  Categoría: ${store.category}
  Marcas Oficiales: ${store.brands.join(', ')}
  Descripción: ${store.desc}
  
  Tu tarea:
  Genera una lista separada por comas de 20-30 palabras clave, sinónimos, productos específicos, variaciones de escritura y casos de uso por los que un cliente buscaría esta tienda en un centro comercial. 
  NO expliques nada, NO devuelvas JSON. SOLO devuelve las palabras clave separadas por comas. Todas en minúsculas.
  `;

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      })
    });
    
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return data.candidates[0].content.parts[0].text.trim();
  } catch (error) {
    console.error(`Error enriqueciendo ${store.name}:`, error);
    return ""; // Fallback to empty keywords
  }
}

async function getEmbedding(text) {
  console.log(`[2/2] Vectorizando: ${text.substring(0, 30)}...`);
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'models/gemini-embedding-2',
          content: { parts: [{ text }] },
        })
      }
    );
    if (!response.ok) throw new Error(await response.text());
    const data = await response.json();
    return data.embedding.values;
  } catch (error) {
    console.error(`Error vectorizando:`, error);
    return null;
  }
}

async function main() {
  console.log("🚀 Iniciando Kiki Data Ingestion Pipeline...");
  const SQL_LINES = [];
  SQL_LINES.push("-- MOCK DATA INGESTION PIPELINE EXPORT");
  SQL_LINES.push(`DELETE FROM store_brands;`);
  SQL_LINES.push(`DELETE FROM store_categories;`);
  SQL_LINES.push(`DELETE FROM brands;`);
  SQL_LINES.push(`DELETE FROM categories;`);
  SQL_LINES.push(`DELETE FROM stores;`);

  const MALL_ID = '11111111-1111-1111-1111-111111111111';
  let i = 1;

  // Relational mappings
  const categoriesSet = new Set();
  const brandsSet = new Set();
  
  // Extract all unique categories and brands
  for (const store of RAW_STORES) {
    categoriesSet.add(store.category);
    store.brands.forEach(b => brandsSet.add(b));
  }

  // Assign deterministic UUIDs for categories and brands
  const categoryIds = {};
  let catIdx = 1;
  for (const cat of categoriesSet) {
    categoryIds[cat] = `c0000000-0000-0000-0000-${catIdx.toString().padStart(12, '0')}`;
    SQL_LINES.push(`INSERT INTO categories (id, name) VALUES ('${categoryIds[cat]}', '${cat}') ON CONFLICT DO NOTHING;`);
    catIdx++;
  }

  const brandIds = {};
  let brandIdx = 1;
  for (const brand of brandsSet) {
    brandIds[brand] = `b0000000-0000-0000-0000-${brandIdx.toString().padStart(12, '0')}`;
    SQL_LINES.push(`INSERT INTO brands (id, name) VALUES ('${brandIds[brand]}', '${brand.replace(/'/g, "''")}') ON CONFLICT (name) DO NOTHING;`);
    brandIdx++;
  }

  // Prepare stores insertion
  SQL_LINES.push(`\n-- Inserting stores and junctions`);

  for (const store of RAW_STORES) {
    const searchKeywords = await enrichWithLLM(store);
    const finalDescription = `${store.desc} [Keywords: ${searchKeywords}]`;
    const textToVectorize = `${store.name} - ${store.category} - Brands: ${store.brands.join(', ')} - ${store.desc} - ${searchKeywords}`;
    const embedding = await getEmbedding(textToVectorize);
    
    if (!embedding) {
      console.log(`⚠️ Falló el pipeline para ${store.name}, saltando...`);
      continue;
    }

    const storeId = `s0000000-0000-0000-0000-${i.toString().padStart(12, '0')}`;
    const safeName = store.name.replace(/'/g, "''");
    const safeDesc = finalDescription.replace(/'/g, "''");
    const embeddingString = `[${embedding.join(',')}]`;

    // 1. Insert Store
    SQL_LINES.push(`INSERT INTO stores (id, mall_id, name, floor, unit, description, embedding) VALUES ('${storeId}', '${MALL_ID}', '${safeName}', ${store.floor}, '${store.unit}', '${safeDesc}', '${embeddingString}');`);
    
    // 2. Insert Store -> Category mapping
    SQL_LINES.push(`INSERT INTO store_categories (store_id, category_id) VALUES ('${storeId}', '${categoryIds[store.category]}');`);

    // 3. Insert Store -> Brands mapping
    for (const brand of store.brands) {
      SQL_LINES.push(`INSERT INTO store_brands (store_id, brand_id) VALUES ('${storeId}', '${brandIds[brand]}');`);
    }
    
    i++;
    await delay(4500); 
  }

  const sqlFile = path.join(__dirname, '../supabase/migrations/20260515000000_pipeline_mock_data.sql');
  fs.writeFileSync(sqlFile, SQL_LINES.join('\n'), 'utf8');
  console.log(`✅ Pipeline terminado. Se generó el archivo: ${sqlFile}`);
}

main();
