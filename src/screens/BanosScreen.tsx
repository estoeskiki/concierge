import { useState, useEffect } from 'react';
import { supabase, MALL_ID } from '../lib/supabase';
import MallMap from '../components/MallMap';
import SearchBar from '../components/SearchBar';

interface Bathroom {
  id: string;
  label: string;
  floor: number;
  zone: string;
  distance_m: number;
  accessible: boolean;
  family: boolean;
  node_id: string | null;
}

export default function BanosScreen() {
  const [bathrooms, setBathrooms] = useState<Bathroom[]>([]);
  const [selected, setSelected] = useState<Bathroom | null>(null);

  useEffect(() => {
    supabase
      .from('bathrooms')
      .select('id, label, floor, zone, distance_m, accessible, family, node_id')
      .eq('mall_id', MALL_ID)
      .eq('active', true)
      .order('distance_m', { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) {
          setBathrooms(data);
          setSelected(data[0]);
        }
      });
  }, []);

  if (!selected) {
    return (
      <div className="screen-container animate-fade">
        <div className="header">
          <h1 className="glow-primary" style={{ fontSize: '1.8rem' }}>BAÑOS</h1>
          <SearchBar />
        </div>
        <div className="flex-center content"><p style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>Cargando...</p></div>
      </div>
    );
  }

  return (
    <div className="screen-container animate-fade">
      <div className="header">
        <h1 className="glow-primary" style={{ fontSize: '1.8rem' }}>BAÑOS</h1>
        <SearchBar />
      </div>

      <div className="content" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Map */}
        <MallMap
          destinationNodeId={selected.node_id}
          destinationLabel={selected.label}
          destinationFloor={selected.floor}
        />

        {/* Selected info bar */}
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          border: '2px solid var(--tertiary)',
          borderRadius: '16px',
          padding: '16px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 4px 16px rgba(0,240,255,0.12)',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
              {selected.id === bathrooms[0]?.id && (
                <Chip color="var(--tertiary)" textColor="#000">Más cercano</Chip>
              )}
              {selected.family && <Chip color="#8b5cf6" textColor="#fff">Familiar</Chip>}
              {selected.accessible && (
                <Chip color="var(--bg-surface-low)" textColor="var(--text-secondary)" border>♿ Accesible</Chip>
              )}
            </div>
            <p className="font-headline" style={{ fontSize: '1.4rem', color: 'var(--text-primary)', margin: 0 }}>{selected.label}</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0, fontWeight: 600 }}>
              {selected.zone} · Nivel {selected.floor}
            </p>
          </div>
          <p style={{ fontFamily: 'var(--font-headline)', fontSize: '2rem', color: 'var(--tertiary)', margin: 0, fontWeight: 900 }}>
            {selected.distance_m}m
          </p>
        </div>

        {/* All bathrooms list */}
        <div>
          <p style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
            Todos los baños
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {bathrooms.map((b, i) => (
              <button
                key={b.id}
                onClick={() => setSelected(b)}
                style={{
                  backgroundColor: selected.id === b.id ? 'rgba(0,240,255,0.06)' : 'var(--bg-surface)',
                  border: `2px solid ${selected.id === b.id ? 'var(--tertiary)' : 'var(--border)'}`,
                  borderRadius: '16px',
                  padding: '14px 20px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '44px', height: '44px',
                    backgroundColor: selected.id === b.id ? 'rgba(0,240,255,0.12)' : 'var(--bg-surface-low)',
                    borderRadius: '12px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.4rem', flexShrink: 0,
                  }}>
                    {b.family ? '👨‍👩‍👧' : '🚻'}
                  </div>
                  <div>
                    <p style={{ fontFamily: 'var(--font-headline)', fontSize: '1.1rem', color: 'var(--text-primary)', margin: 0, fontWeight: 900 }}>
                      {b.label}
                    </p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0, fontWeight: 600 }}>
                      {b.zone} · Nivel {b.floor}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {i === 0 && <Chip color="var(--tertiary)" textColor="#000">más cercano</Chip>}
                  <span style={{ fontFamily: 'var(--font-headline)', fontWeight: 900, fontSize: '1.1rem', color: selected.id === b.id ? 'var(--tertiary)' : 'var(--text-secondary)' }}>
                    {b.distance_m}m
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

function Chip({ children, color, textColor, border }: { children: React.ReactNode; color: string; textColor: string; border?: boolean }) {
  return (
    <span style={{
      backgroundColor: color, color: textColor,
      fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.7rem',
      textTransform: 'uppercase', letterSpacing: '0.08em',
      padding: '3px 10px', borderRadius: '999px',
      border: border ? '1px solid var(--border)' : 'none',
    }}>
      {children}
    </span>
  );
}
