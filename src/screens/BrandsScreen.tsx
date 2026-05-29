import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import { getDistinctBrands } from '../lib/search';

export default function BrandsScreen() {
  const navigate = useNavigate();
  const [brands, setBrands] = useState<{ name: string; emoji: string }[]>([]);
  const [activeIndex, setActiveIndex] = useState<string | null>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scrubberRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = () => {
      const list = getDistinctBrands();
      if (list.length > 0) { setBrands(list); }
      else { setTimeout(load, 300); }
    };
    load();
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, { name: string; emoji: string }[]>();
    for (const brand of brands) {
      const letter = brand.name[0].toUpperCase();
      if (!map.has(letter)) map.set(letter, []);
      map.get(letter)!.push(brand);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b, 'es'));
  }, [brands]);

  const letters = useMemo(() => grouped.map(([l]) => l), [grouped]);

  const scrollToLetter = useCallback((letter: string) => {
    setActiveIndex(letter);
    sectionRefs.current[letter]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => setActiveIndex(null), 600);
  }, []);

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
        <h1 className="glow-primary" style={{ fontSize: '1.8rem' }}>MARCAS</h1>
        <SearchBar />
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {/* Scrollable brands list */}
        <div className="content animate-fade" style={{ flex: 1, paddingRight: '48px' }}>
          {grouped.map(([letter, group]) => (
            <div key={letter} ref={el => { sectionRefs.current[letter] = el; }}>
              {/* Letter header */}
              <div style={{
                position: 'sticky', top: 0, zIndex: 10,
                backgroundColor: 'var(--bg-page)',
                padding: '8px 0 4px',
                marginBottom: '8px',
              }}>
                <span style={{
                  fontFamily: 'var(--font-headline)',
                  fontSize: '1.1rem',
                  fontWeight: 900,
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

              {/* Brand tiles */}
              <div className="compact-grid" style={{ marginBottom: '20px' }}>
                {group.map(brand => (
                  <div
                    key={brand.name}
                    className="compact-card"
                    onClick={() => navigate(`/brands/${encodeURIComponent(brand.name)}`)}
                  >
                    <span className="card-emoji">{brand.emoji}</span>
                    <span className="card-name">{brand.name}</span>
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
            gap: '2px',
            paddingTop: '8px', paddingBottom: '8px',
            userSelect: 'none',
            touchAction: 'none',
          }}
        >
          {letters.map(letter => (
            <button
              key={letter}
              onClick={() => scrollToLetter(letter)}
              style={{
                background: activeIndex === letter ? 'var(--primary)' : 'transparent',
                border: 'none',
                borderRadius: '6px',
                width: '28px', height: '28px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                fontFamily: 'var(--font-headline)',
                fontSize: '0.75rem',
                fontWeight: 900,
                color: activeIndex === letter ? '#000' : 'var(--text-secondary)',
                transition: 'all 0.15s',
                flexShrink: 0,
              }}
            >
              {letter}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
