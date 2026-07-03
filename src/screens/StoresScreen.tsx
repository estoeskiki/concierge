import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import { getAllStores, getStoresByCategory, getBaratilloStores } from '../lib/search';
import { Store } from '../components/StoreCard';

export default function StoresScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category') || '';
  const [stores, setStores] = useState<Store[]>([]);
  const [baratilloCount, setBaratilloCount] = useState(0);
  const [activeIndex, setActiveIndex] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const load = () => {
      const list = category ? getStoresByCategory(category) : getAllStores();
      if (list.length > 0) {
        setStores(list);
        setBaratilloCount(getBaratilloStores().length);
      }
      else { setTimeout(load, 300); }
    };
    load();
  }, [category]);

  const grouped = useMemo(() => {
    const map = new Map<string, Store[]>();
    for (const store of stores) {
      const letter = store.name[0].toUpperCase();
      if (!map.has(letter)) map.set(letter, []);
      map.get(letter)!.push(store);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b, 'es'));
  }, [stores]);

  const letters = useMemo(() => grouped.map(([l]) => l), [grouped]);

  const scrollToLetter = useCallback((letter: string) => {
    setActiveIndex(letter);
    sectionRefs.current[letter]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => setActiveIndex(null), 600);
  }, []);

  // Drag-through scrubber: detect which letter the touch is over
  const scrubberRef = useRef<HTMLDivElement>(null);
  const handleScrubMove = useCallback((clientY: number) => {
    const el = scrubberRef.current;
    if (!el) return;
    const { top, height } = el.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientY - top) / height));
    const idx = Math.floor(ratio * letters.length);
    const letter = letters[Math.min(idx, letters.length - 1)];
    if (letter) scrollToLetter(letter);
  }, [letters, scrollToLetter]);

  return (
    <div className="screen-container">
      <div className="header">
        {category && (
          <button className="back-btn" onClick={() => navigate(-1)}>←</button>
        )}
        <h1 className="glow-primary" style={{ fontSize: '1.8rem' }}>
          {category || 'TIENDAS'}
        </h1>
        <SearchBar />
      </div>

      {/* Baratillo teaser — only on main stores page */}
      {!category && baratilloCount > 0 && (
        <button
          onClick={() => navigate('/baratillo')}
          className="baratillo-teaser"
        >
          <div className="baratillo-teaser-left">
            <span className="baratillo-badge">BARATILLO</span>
            <div className="baratillo-teaser-text">
              <span className="baratillo-teaser-title">
                OFERTAS DE HOY
              </span>
              <span className="baratillo-teaser-subtitle">
                {baratilloCount} {baratilloCount === 1 ? 'tienda con descuentos' : 'tiendas con descuentos'}
              </span>
            </div>
          </div>
          <span className="baratillo-teaser-arrow">VER →</span>
        </button>
      )}

      {category ? (
        /* ── Category view: plain grid, no alpha sections ── */
        <div className="content animate-fade">
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
      ) : (
        /* ── All stores: alphabetical sections + scrubber ── */
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative', minHeight: 0, minWidth: 0 }}>
          <div ref={contentRef} className="content animate-fade" style={{ flex: 1, paddingRight: '48px' }}>
            {grouped.map(([letter, group]) => (
              <div key={letter} ref={el => { sectionRefs.current[letter] = el; }}>
                <div style={{
                  position: 'sticky', top: 0, zIndex: 10,
                  backgroundColor: 'var(--bg-page)',
                  padding: '8px 0 4px',
                  marginBottom: '8px',
                }}>
                  <span style={{
                    fontFamily: 'var(--font-headline)',
                    fontSize: '1.1rem', fontWeight: 900,
                    color: 'var(--primary)',
                    backgroundColor: 'var(--bg-surface)',
                    border: '2px solid var(--border)',
                    borderRadius: '8px',
                    padding: '2px 12px',
                    letterSpacing: '-0.02em',
                  }}>
                    {letter}
                  </span>
                </div>
                <div className="compact-grid" style={{ marginBottom: '20px' }}>
                  {group.map(store => (
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

          {/* Alphabetical index scrubber */}
          <div
            ref={scrubberRef}
            onTouchMove={e => { e.preventDefault(); handleScrubMove(e.touches[0].clientY); }}
            onTouchStart={e => handleScrubMove(e.touches[0].clientY)}
            style={{
              position: 'absolute', right: 0, top: 0, bottom: 0,
              width: '40px',
              display: 'flex', flexDirection: 'column',
              justifyContent: 'center', alignItems: 'center',
              gap: '2px', paddingTop: '8px', paddingBottom: '8px',
              userSelect: 'none', touchAction: 'none',
            }}
          >
            {letters.map(letter => (
              <button
                key={letter}
                onClick={() => scrollToLetter(letter)}
                style={{
                  background: activeIndex === letter ? 'var(--primary)' : 'transparent',
                  border: 'none', borderRadius: '6px',
                  width: '28px', height: '28px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-headline)',
                  fontSize: '0.75rem', fontWeight: 900,
                  color: activeIndex === letter ? '#000' : 'var(--text-secondary)',
                  transition: 'all 0.15s', flexShrink: 0,
                }}
              >
                {letter}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
