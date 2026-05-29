import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getStoreById, getAllStores } from '../lib/search';
import MallMap from '../components/MallMap';
import { loadNavGraph, nearestCorridorNode } from '../lib/pathfinding';

// Corridor x positions matching the 5 visual slot columns
const CORRIDOR_XS = [200, 400, 600, 800, 1000];

export default function StoreDetailScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [destNodeId, setDestNodeId] = useState<string | null>(null);

  const store = id ? getStoreById(id) : null;

  useEffect(() => {
    if (!store) return;
    loadNavGraph().then(() => {
      // Each store maps to a corridor node based on its sorted position on its floor
      const floorStores = getAllStores().filter(s => s.floor === store.floor);
      const slotIdx = floorStores.findIndex(s => s.id === store.id);
      const targetX = CORRIDOR_XS[slotIdx % 5];
      const node = nearestCorridorNode(store.floor, targetX);
      setDestNodeId(node?.id ?? null);
    });
  }, [store?.id]);

  if (!store) {
    return (
      <div className="flex-center" style={{ height: '100vh', backgroundColor: 'var(--bg-page)' }}>
        <h2 style={{ color: 'var(--text-secondary)' }}>Tienda no encontrada o cargando...</h2>
      </div>
    );
  }

  return (
    <div className="screen-container animate-fade">
      <header className="header">
        <button 
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', fontSize: '1.25rem', fontWeight: 700, cursor: 'pointer', color: 'var(--text-secondary)' }}
        >
          ← Volver
        </button>
        <h1>KIKI</h1>
        <div style={{ width: '80px' }}></div>
      </header>

      <main className="content" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Map */}
        <MallMap
          destinationNodeId={destNodeId}
          destinationFloor={store.floor}
          destinationLabel={store.name}
        />

        {/* Store Info */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px' }}>
          <div style={{
            fontSize: '4rem',
            width: '100px',
            height: '100px',
            backgroundColor: 'var(--bg-surface-low)',
            borderRadius: '24px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            {store.emoji}
          </div>
          <div>
            <h2 className="font-headline" style={{ fontSize: '3.5rem', color: 'var(--text-primary)', marginBottom: '8px' }}>
              {store.name}
            </h2>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span style={{ backgroundColor: 'var(--primary)', color: '#000', padding: '6px 16px', borderRadius: '999px', fontWeight: 700 }}>
                Nivel {store.floor}
              </span>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: '1.1rem' }}>
                Local {store.unit}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          {store.description?.split(/\s*\[?\s*Keywords?:/i)[0]?.trim()}
        </p>

        {/* Active Baratillo Deals */}
        {store.sales && store.sales.length > 0 && (
          <div style={{
            borderRadius: '20px',
            border: '2px solid var(--secondary)',
            backgroundColor: 'rgba(255,107,152,0.06)',
            padding: '24px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <span className="baratillo-badge" style={{ fontSize: '0.9rem', padding: '5px 14px' }}>BARATILLO</span>
              <h3 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', margin: 0 }}>Ofertas activas</h3>
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {store.sales.map((deal, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <span style={{ color: 'var(--secondary)', fontWeight: 900, fontSize: '1.3rem', lineHeight: 1.2 }}>•</span>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '1.15rem', color: 'var(--text-primary)', fontWeight: 600, lineHeight: 1.4 }}>
                    {deal}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Categories */}
        {store.categories && store.categories.length > 0 && (
          <div>
            <h3 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '16px' }}>Categorías</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {store.categories.map(cat => (
                <span key={cat} style={{
                  backgroundColor: 'rgba(204,255,0,0.1)',
                  border: '1.5px solid var(--primary)',
                  padding: '8px 18px',
                  borderRadius: '999px',
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                }}>
                  {cat}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Brands */}
        {store.brands && store.brands.length > 0 && (
          <div>
            <h3 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '16px' }}>Marcas y Productos</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {store.brands.map(brand => (
                <span key={brand} style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  padding: '8px 16px',
                  borderRadius: '999px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                }}>
                  {brand}
                </span>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
