import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import { getDistinctCategories } from '../lib/search';

const CATEGORY_EMOJIS: Record<string, string> = {
  'Moda':         '👗',
  'Deportes':     '⚽',
  'Tecnología':   '📱',
  'Belleza':      '💄',
  'Restaurantes': '🍔',
  'Salud':        '💊',
  'Café':         '☕',
  'Postres':      '🍰',
};

export default function CategoriesScreen() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    // Pull from cached LIVE_STORES; retry briefly if not loaded yet
    const load = () => {
      const cats = getDistinctCategories();
      if (cats.length > 0) { setCategories(cats); }
      else { setTimeout(load, 300); }
    };
    load();
  }, []);

  return (
    <div className="screen-container">
      {/* Header */}
      <div className="header">
        <h1 className="glow-primary">KIKI</h1>
        <SearchBar placeholder="Buscar o preguntar a Kiki IA..." />
      </div>

      <div className="content animate-fade">
        <h2 className="font-headline" style={{ marginBottom: 20, fontSize: '1.3rem', color: 'var(--text-secondary)' }}>
          Categorías
        </h2>
        <div className="compact-grid">
          {categories.map(cat => (
            <div
              key={cat}
              className="compact-card"
              onClick={() => navigate(`/stores?category=${encodeURIComponent(cat)}`)}
            >
              <span className="card-emoji">{CATEGORY_EMOJIS[cat] || '🏪'}</span>
              <span className="card-name">{cat}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
