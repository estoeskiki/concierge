import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store } from '../components/StoreCard';
import { getBaratilloStores } from '../lib/search';

export default function BaratilloScreen() {
  const navigate = useNavigate();
  const [stores, setStores] = useState<Store[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = () => {
      const list = getBaratilloStores();
      if (list.length > 0) {
        setStores(list);
        setLoaded(true);
      } else {
        setTimeout(load, 300);
      }
    };
    load();
    // If no stores after 2s, mark as loaded anyway (empty state)
    const fallback = setTimeout(() => setLoaded(true), 2000);
    return () => clearTimeout(fallback);
  }, []);

  return (
    <div className="screen-container animate-fade">
      <header className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="baratillo-badge" style={{ fontSize: '1rem', padding: '6px 18px' }}>BARATILLO</span>
          <h1 className="glow-secondary" style={{ fontSize: '1.8rem' }}>OFERTAS</h1>
        </div>
      </header>

      <main className="content">
        {!loaded && stores.length === 0 && (
          <div className="flex-center" style={{ paddingTop: '80px' }}>
            <p style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>Cargando ofertas...</p>
          </div>
        )}

        {loaded && stores.length === 0 && (
          <div className="flex-center" style={{ paddingTop: '80px', gap: '16px' }}>
            <p style={{ fontSize: '3rem' }}>🏷️</p>
            <p style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: '1.2rem' }}>
              No hay tiendas en baratillo en este momento.
            </p>
          </div>
        )}

        {stores.length > 0 && (
          <>
            <p style={{ color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '20px', fontSize: '1.1rem' }}>
              {stores.length} {stores.length === 1 ? 'tienda con ofertas activas' : 'tiendas con ofertas activas'}
            </p>
            <div className="compact-grid">
              {stores.map(store => (
                <div
                  key={store.id}
                  className="compact-card"
                  onClick={() => navigate(`/store/${store.id}`)}
                  style={{
                    borderColor: 'var(--secondary)',
                    boxShadow: '0 4px 16px rgba(255,107,152,0.2)',
                  }}
                >
                  <span className="card-emoji">{store.emoji}</span>
                  <span className="card-name">{store.name}</span>
                  <span className="baratillo-badge" style={{ fontSize: '0.65rem', padding: '3px 8px' }}>
                    BARATILLO
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
