import MiniSearch from 'minisearch';
import { supabase } from './supabase';
import { Store } from '../components/StoreCard';

let LIVE_STORES: Store[] = [];

// Common Spanish stopwords to ignore during local search
const STOPWORDS = new Set([
  'a', 'al', 'con', 'de', 'del', 'el', 'en', 'es', 'la', 'las', 'le',
  'lo', 'los', 'me', 'mi', 'no', 'o', 'para', 'por', 'que', 'se',
  'si', 'su', 'un', 'una', 'uno', 'y', 'yo', 'tu', 'te', 'le',
  'quiero', 'busco', 'necesito', 'dame', 'hay', 'tienen', 'donde',
  'tiendas', 'tienda', 'venden', 'vende', 'vender', 'comprar', 'compro',
  'cual', 'cuales', 'como', 'puedo', 'encontrar', 'ver', 'hay',
  'tengan', 'tenga', 'tiene', 'tienen', 'tener', 'marca', 'marcas',
  'producto', 'productos', 'venta', 'vendo', 'conseguir', 'quiero'
]);

// 1. Initialize MiniSearch
const miniSearch = new MiniSearch({
  fields: ['name', 'description'],
  storeFields: ['id', 'name', 'floor', 'unit', 'emoji', 'description'],
  processTerm: (term) => {
    const lower = term.toLowerCase();
    return STOPWORDS.has(lower) ? null : lower; // null = ignore this term
  },
  searchOptions: {
    combineWith: 'AND', // REQUIRE all words to match (e.g., 'base' AND 'dior'). If missing one, escalate to AI.
    boost: { name: 3, description: 1 },
    fuzzy: 0.2,
    prefix: true,
    processTerm: (term) => {
      const lower = term.toLowerCase();
      return STOPWORDS.has(lower) ? null : lower;
    }
  }
});

export async function loadStoresFromSupabase() {
  console.log('[Sistema] Descargando inventario de tiendas desde Supabase...');
  console.time('Carga de Inventario');

  const [{ data, error }, { data: storeBrands }, { data: storeCategories }, { data: activeSales }] = await Promise.all([
    supabase.from('stores').select('id, name, floor, unit, emoji, color, description, category, brand, created_at'),
    supabase.from('store_brands').select('store_id, brands(name)'),
    supabase.from('store_categories').select('store_id, categories(name)'),
    supabase.from('store_sales').select('store_id, description').eq('active', true),
  ]);

  if (error) {
    console.error("[Sistema] Error cargando tiendas:", error);
    return;
  }
  if (data) {
    const brandsByStore = new Map<string, string[]>();
    for (const row of (storeBrands || []) as any[]) {
      const storeId = row.store_id;
      const brandName = row.brands?.name;
      if (!brandName) continue;
      if (!brandsByStore.has(storeId)) brandsByStore.set(storeId, []);
      brandsByStore.get(storeId)!.push(brandName);
    }

    const categoriesByStore = new Map<string, string[]>();
    for (const row of (storeCategories || []) as any[]) {
      const storeId = row.store_id;
      const catName = row.categories?.name;
      if (!catName) continue;
      if (!categoriesByStore.has(storeId)) categoriesByStore.set(storeId, []);
      categoriesByStore.get(storeId)!.push(catName);
    }

    const salesByStore = new Map<string, string[]>();
    for (const row of (activeSales || []) as any[]) {
      if (!salesByStore.has(row.store_id)) salesByStore.set(row.store_id, []);
      salesByStore.get(row.store_id)!.push(row.description);
    }

    LIVE_STORES = data.map(s => ({
      ...s,
      brands: brandsByStore.get(s.id) || [],
      categories: categoriesByStore.get(s.id) || [],
      baratillo: salesByStore.has(s.id),
      sales: salesByStore.get(s.id) || [],
    }));
    miniSearch.removeAll();
    miniSearch.addAll(LIVE_STORES);
    console.timeEnd('Carga de Inventario');
    console.log(`[Sistema] ✅ ${LIVE_STORES.length} tiendas cargadas. ${salesByStore.size} en baratillo.`);
  }
}

export interface SearchResult {
  store: Store;
  step: 1 | 2; // 1 = Exact Name, 2 = Fuzzy/FullText
}

export function doSearch(query: string): SearchResult[] {
  console.groupCollapsed(`[Motor de Búsqueda Local] Procesando: "${query}"`);
  
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) {
    console.log('Query vacío, abortando.');
    console.groupEnd();
    return [];
  }

  // STEP 1: Exact Name Match
  console.log('Paso 1: Buscando coincidencia exacta de nombre...');
  const exactNameMatches = LIVE_STORES.filter(store => 
    store.name.toLowerCase() === normalizedQuery
  );

  if (exactNameMatches.length > 0) {
    console.log(`✅ ¡Encontrado en Paso 1! Coincidencia exacta con ${exactNameMatches.length} tienda(s).`);
    console.groupEnd();
    return exactNameMatches.map(store => ({ store, step: 1 }));
  }

  // STEP 2: Full-Text / Fuzzy Match (MiniSearch)
  console.log('Paso 2: Buscando por aproximación (Fuzzy/Metadatos) en MiniSearch...');
  const results = miniSearch.search(normalizedQuery);
  
  if (results.length > 0) {
    console.log(`✅ ¡Encontrado en Paso 2! MiniSearch retornó ${results.length} coincidencias.`);
    console.table(results.map(r => ({ ID: r.id, Score: r.score.toFixed(2), Términos: r.terms.join(', ') })));
    
    // Map MiniSearch results back to Store objects
    const mappedResults = results.map(res => {
      const store = LIVE_STORES.find(s => s.id === res.id);
      return { store: store!, step: 2 as const };
    });
    console.groupEnd();
    return mappedResults;
  }

  console.log('❌ Búsqueda Local falló. Ninguna tienda coincidió con los criterios.');
  console.groupEnd();
  return [];
}

export function getStoreById(id: string): Store | undefined {
  return LIVE_STORES.find(s => s.id === id);
}

export function getAllStores(): Store[] {
  return [...LIVE_STORES].sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

export function getBaratilloStores(): Store[] {
  return LIVE_STORES.filter(s => s.baratillo).sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

export function getStoresByCategory(category: string): Store[] {
  return LIVE_STORES
    .filter(s => s.categories?.includes(category))
    .sort((a, b) => {
      if (a.baratillo && !b.baratillo) return -1;
      if (!a.baratillo && b.baratillo) return 1;
      return a.name.localeCompare(b.name, 'es');
    });
}

export function getStoresByBrand(brand: string): Store[] {
  return LIVE_STORES
    .filter(s => s.brands?.includes(brand))
    .sort((a, b) => {
      if (a.baratillo && !b.baratillo) return -1;
      if (!a.baratillo && b.baratillo) return 1;
      return a.name.localeCompare(b.name, 'es');
    });
}

export const FOOD_CATEGORIES = ['Restaurantes', 'Café', 'Postres'];

export function getDistinctCategories(): string[] {
  const cats = LIVE_STORES.flatMap(s => s.categories || []);
  return [...new Set(cats)].sort((a, b) => a.localeCompare(b, 'es'));
}

export function getComerStores(): { category: string; stores: Store[] }[] {
  return FOOD_CATEGORIES
    .map(cat => ({ category: cat, stores: getStoresByCategory(cat) }))
    .filter(g => g.stores.length > 0);
}

export function getDistinctBrands(): { name: string; emoji: string }[] {
  const seen = new Set<string>();
  const brands: { name: string; emoji: string }[] = [];
  for (const s of LIVE_STORES) {
    for (const brandName of (s.brands || [])) {
      if (!seen.has(brandName)) {
        seen.add(brandName);
        brands.push({ name: brandName, emoji: s.emoji || '🏪' });
      }
    }
  }
  return brands.sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

