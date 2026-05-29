import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StoreCard, { Store } from '../components/StoreCard';
import { getBaratilloStores } from '../lib/search';

const CATEGORIES = [
  { name: 'Moda', emoji: '👗' },
  { name: 'Belleza', emoji: '💄' },
  { name: 'Deportes', emoji: '⚽' },
  { name: 'Electrónica', emoji: '📱' },
  { name: 'Comida', emoji: '🍔' },
  { name: 'Juguetes', emoji: '🧸' },
  { name: 'Hogar', emoji: '🛋️' },
  { name: 'Regalos', emoji: '🎁' }
];

export default function HomeScreen() {
  const [query, setQuery] = useState('');
  const [baratilloStores, setBaratilloStores] = useState<Store[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const load = () => {
      const list = getBaratilloStores();
      if (list.length > 0) { setBaratilloStores(list); }
      else { setTimeout(load, 300); }
    };
    load();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      console.log(`[HomeScreen] Usuario ingresó texto en la barra de búsqueda: "${query.trim()}"`);
      navigate(`/results?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleCategoryClick = (catName: string) => {
    console.log(`[HomeScreen] Usuario seleccionó categoría rápida: "${catName}"`);
    navigate(`/results?q=${encodeURIComponent(catName)}`);
  };

  return (
    <div className="screen-container animate-fade">
      <header className="header">
        <h1>KIKI</h1>
        <div className="clock">12:45 PM</div>
      </header>
      
      <main className="content" style={{ display: 'flex', flexDirection: 'column', padding: '40px 32px' }}>
        <h2 style={{ fontSize: '3rem', marginBottom: '8px', color: 'var(--text-primary)' }}>
          ¿Qué estás buscando?
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem', marginBottom: '32px' }}>
          Encuentra tiendas, marcas o productos.
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearch} style={{ position: 'relative', marginBottom: '48px' }}>
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ej. Zapatos, Sephora, Maquillaje..."
            style={{
              width: '100%',
              padding: '24px 32px',
              fontSize: '1.5rem',
              borderRadius: '999px',
              border: '2px solid var(--border)',
              backgroundColor: 'var(--bg-surface-low)',
              color: 'var(--text-primary)',
              outline: 'none',
              fontFamily: 'var(--font-body)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
            }}
          />
          <button 
            type="submit" 
            className="btn-primary glow-primary"
            style={{ position: 'absolute', right: '12px', top: '12px', bottom: '12px', padding: '0 32px' }}
          >
            Buscar
          </button>
        </form>

        {/* Baratillo Section */}
        {baratilloStores.length > 0 && (
          <div style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="baratillo-badge" style={{ fontSize: '1rem', padding: '6px 18px' }}>BARATILLO</span>
                <span style={{ fontFamily: 'var(--font-headline)', fontSize: '1.4rem', color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
                  OFERTAS DE HOY
                </span>
              </div>
              <button
                onClick={() => navigate('/baratillo')}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '1rem',
                  color: 'var(--secondary)', textDecoration: 'underline', textUnderlineOffset: '3px'
                }}
              >
                Ver todas →
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              {baratilloStores.slice(0, 6).map(store => (
                <StoreCard key={store.id} store={store} showBadge />
              ))}
            </div>
          </div>
        )}

        {/* Categories Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {CATEGORIES.map(cat => (
            <button 
              key={cat.name}
              onClick={() => handleCategoryClick(cat.name)}
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '2px solid var(--border)',
                borderRadius: '24px',
                padding: '24px 16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <span style={{ fontSize: '3rem' }}>{cat.emoji}</span>
              <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                {cat.name}
              </span>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
