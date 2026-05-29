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
      <header className="header store-detail-header">
        <button 
          onClick={() => navigate(-1)}
          className="store-back-btn"
        >
          ← Volver
        </button>
        <div className="store-header-spacer"></div>
      </header>

      <main className="content store-detail-main">
        
        {/* Map */}
        <div className="store-map-wrapper">
          <MallMap
            destinationNodeId={destNodeId}
            destinationFloor={store.floor}
            destinationLabel={store.name}
          />
        </div>

        {/* Store Info */}
        <div className="store-info-row">
          <div className="store-logo-box">
            {store.emoji}
          </div>
          <div className="store-info-text">
            <h2 className="font-headline store-title">
              {store.name}
            </h2>
            <div className="store-badges">
              <span className="store-badge-level">
                Nivel {store.floor}
              </span>
              <span className="store-badge-unit">
                Local {store.unit}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="store-desc">
          {store.description?.split(/\s*\[?\s*Keywords?:/i)[0]?.trim()}
        </p>

        {/* Active Baratillo Deals */}
        {store.sales && store.sales.length > 0 && (
          <div className="store-deals-box">
            <div className="store-deals-title-row">
              <span className="baratillo-badge" style={{ fontSize: '0.9rem', padding: '5px 14px' }}>BARATILLO</span>
              <h3>Ofertas activas</h3>
            </div>
            <ul className="store-deals-list">
              {store.sales.map((deal, i) => (
                <li key={i} className="store-deal-item">
                  <span className="store-deal-bullet">•</span>
                  <span className="store-deal-text">
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
            <h3 className="store-section-title">Categorías</h3>
            <div className="store-tags-container">
              {store.categories.map(cat => (
                <span key={cat} className="store-tag cat-tag">
                  {cat}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Brands */}
        {store.brands && store.brands.length > 0 && (
          <div>
            <h3 className="store-section-title">Marcas y Productos</h3>
            <div className="store-tags-container">
              {store.brands.map(brand => (
                <span key={brand} className="store-tag brand-tag">
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
