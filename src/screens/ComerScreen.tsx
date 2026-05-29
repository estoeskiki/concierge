import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store } from '../components/StoreCard';
import { getComerStores } from '../lib/search';
import SearchBar from '../components/SearchBar';

const CATEGORY_EMOJIS: Record<string, string> = {
  'Restaurantes': '🍔',
  'Café':         '☕',
  'Postres':      '🍰',
};

export default function ComerScreen() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<{ category: string; stores: Store[] }[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = () => {
      const data = getComerStores();
      if (data.length > 0) { setGroups(data); setLoaded(true); }
      else { setTimeout(load, 300); }
    };
    load();
    const fallback = setTimeout(() => setLoaded(true), 2000);
    return () => clearTimeout(fallback);
  }, []);

  return (
    <div className="screen-container animate-fade">
      <div className="header">
        <h1 className="glow-primary" style={{ fontSize: '1.8rem' }}>COMER</h1>
        <SearchBar placeholder="Buscar restaurantes, cafés..." />
      </div>

      <div className="content" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

        {!loaded && groups.length === 0 && (
          <div className="flex-center" style={{ paddingTop: '80px' }}>
            <p style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>Cargando...</p>
          </div>
        )}

        {loaded && groups.length === 0 && (
          <div className="flex-center" style={{ paddingTop: '80px', gap: '16px' }}>
            <p style={{ fontSize: '3rem' }}>🍽️</p>
            <p style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: '1.2rem' }}>
              No hay restaurantes disponibles.
            </p>
          </div>
        )}

        {groups.map(({ category, stores }) => (
          <div key={category}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <span style={{ fontSize: '1.6rem' }}>{CATEGORY_EMOJIS[category]}</span>
              <h2 className="font-headline" style={{ fontSize: '1.4rem', color: 'var(--text-primary)' }}>
                {category}
              </h2>
              <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.9rem' }}>
                {stores.length} {stores.length === 1 ? 'lugar' : 'lugares'}
              </span>
            </div>
            <div className="compact-grid">
              {stores.map(store => (
                <div
                  key={store.id}
                  className="compact-card"
                  onClick={() => navigate(`/store/${store.id}`)}
                  style={store.baratillo ? {
                    borderColor: 'var(--secondary)',
                    boxShadow: '0 4px 16px rgba(255,107,152,0.2)',
                  } : undefined}
                >
                  <span className="card-emoji">{store.emoji}</span>
                  <span className="card-name">{store.name}</span>
                  {store.baratillo && (
                    <span className="baratillo-badge" style={{ fontSize: '0.65rem', padding: '3px 8px' }}>
                      BARATILLO
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

      </div>
    </div>
  );
}
