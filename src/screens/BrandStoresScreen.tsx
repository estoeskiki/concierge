import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getStoresByBrand } from '../lib/search';

export default function BrandStoresScreen() {
  const { brand } = useParams<{ brand: string }>();
  const navigate = useNavigate();
  const decodedBrand = decodeURIComponent(brand || '');

  const stores = useMemo(() => getStoresByBrand(decodedBrand), [decodedBrand]);

  return (
    <div className="screen-container animate-slide-up">
      <header className="header">
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', fontSize: '1.25rem', fontWeight: 700, cursor: 'pointer', color: 'var(--text-secondary)' }}
        >
          ← Volver
        </button>
        <h1 className="glow-primary" style={{ fontSize: '1.8rem' }}>{decodedBrand.toUpperCase()}</h1>
        <div style={{ width: '80px' }} />
      </header>

      <main className="content">
        <div style={{ marginBottom: '32px' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem' }}>
            {stores.length} {stores.length === 1 ? 'tienda vende' : 'tiendas venden'} esta marca
          </p>
        </div>

        {stores.length > 0 ? (
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
        ) : (
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem' }}>
            No se encontraron tiendas para esta marca.
          </p>
        )}
      </main>
    </div>
  );
}
