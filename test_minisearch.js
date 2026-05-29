import MiniSearch from 'minisearch';

const STOPWORDS = new Set(['a', 'al', 'con', 'de', 'del', 'el', 'en', 'es', 'la', 'las', 'le', 'lo', 'los', 'me', 'mi', 'no', 'o', 'para', 'por', 'que', 'se', 'si', 'su', 'un', 'una', 'uno', 'y', 'yo', 'tu', 'te', 'le', 'quiero', 'busco', 'necesito', 'dame', 'hay', 'tienen', 'donde']);

const miniSearch = new MiniSearch({
  fields: ['name', 'description'],
  storeFields: ['id', 'name', 'description'],
  processTerm: (term) => {
    const lower = term.toLowerCase();
    return STOPWORDS.has(lower) ? null : lower;
  },
  searchOptions: {
    boost: { name: 3, description: 1 },
    fuzzy: 0.2,
    prefix: true,
    processTerm: (term) => {
      const lower = term.toLowerCase();
      return STOPWORDS.has(lower) ? null : lower;
    }
  }
});

const LIVE_STORES = [
  { id: '1', name: 'Sephora', description: 'Amplia gama de productos de belleza, maquillaje y cuidado de la piel. maquillaje perfume cremas skincare labial perfumes' },
  { id: '2', name: 'Zara', description: 'Tienda de ropa de moda, zapatos y accesorios para mujer, hombre y niños. ropa moda vestidos pantalones blusas' },
  { id: '3', name: 'Nike Store', description: 'Zapatillas deportivas, ropa y accesorios para atletas y deportistas. Running, fútbol, baloncesto, training, gym, tenis, correr, sneakers, Nike Air, Jordan' },
  { id: '4', name: 'Starbucks', description: 'Café de especialidad, bebidas frías y calientes, espresso, cappuccino, latte, americano, frappuccino, té, postres, bocadillos y desayuno. Starbucks coffee shop bebidas' }
];

miniSearch.addAll(LIVE_STORES);

const results = miniSearch.search('base de dior');
console.log(JSON.stringify(results, null, 2));
