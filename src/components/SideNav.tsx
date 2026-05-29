import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase, MALL_ID } from '../lib/supabase';

interface Mall {
  name: string;
  logo_url: string | null;
}

const TABS = [
  { path: '/',           label: 'Tiendas',    icon: '🏪' },
  { path: '/comer',      label: 'Comer',      icon: '🍽️' },
  { path: '/categories', label: 'Categorías', icon: '⊞' },
  { path: '/brands',     label: 'Marcas',     icon: '🏷️' },
  { path: '/baratillo',  label: 'Baratillo',  icon: '%', isSale: true },
  { path: '/banos',      label: 'Baños',      icon: '🚻' },
  { path: '/eventos',    label: 'Eventos',    icon: '📅' },
  { path: '/chat',       label: 'Kiki IA',    icon: '✨', isAI: true },
];

export default function SideNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [mall, setMall] = useState<Mall | null>(null);

  useEffect(() => {
    supabase
      .from('malls')
      .select('name, logo_url')
      .eq('id', MALL_ID)
      .single()
      .then(({ data }) => { if (data) setMall(data); });
  }, []);

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/' || pathname.startsWith('/stores');
    return pathname.startsWith(path);
  };

  return (
    <nav className="side-nav">
      <div className="side-nav-logo">
        {mall?.logo_url ? (
          <img
            src={mall.logo_url}
            alt={mall.name}
            style={{ width: '100%', height: '120px', objectFit: 'contain', objectPosition: 'center' }}
          />
        ) : (
          <span className="font-headline" style={{ fontSize: '1.3rem', color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
            {mall?.name ?? 'Cargando...'}
          </span>
        )}
      </div>

      <div className="side-nav-tabs">
        {TABS.map(tab => (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={`side-nav-item ${isActive(tab.path) ? 'active' : ''} ${tab.isAI ? 'ai-tab' : ''} ${(tab as any).isSale ? 'sale-tab' : ''}`}
          >
            <span className="side-nav-icon">{tab.icon}</span>
            <span className="side-nav-label">{tab.label}</span>
          </button>
        ))}
      </div>

      <div style={{
        padding: '20px 24px',
        borderTop: '2px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: '6px',
      }}>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
          powered by
        </span>
        <span className="glow-primary" style={{ fontSize: '0.85rem', fontFamily: 'var(--font-headline)', fontWeight: 900, letterSpacing: '-0.03em', textTransform: 'none' }}>kiki</span>
      </div>
    </nav>
  );
}
