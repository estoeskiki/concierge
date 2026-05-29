import { useNavigate, useLocation } from 'react-router-dom';

const TABS = [
  { path: '/',           label: 'Tiendas',    icon: '🏪' },
  { path: '/categories', label: 'Categorías', icon: '⊞' },
  { path: '/brands',     label: 'Marcas',     icon: '🏷️' },
  { path: '/baratillo',  label: 'Baratillo',  icon: '%', isSale: true },
  { path: '/banos',      label: 'Baños',      icon: '🚻' },
  { path: '/eventos',    label: 'Eventos',    icon: '📅' },
  { path: '/chat',       label: 'Kiki IA',    icon: '✨', isAI: true },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/' || pathname.startsWith('/stores');
    return pathname.startsWith(path);
  };

  return (
    <nav className="bottom-nav">
      {TABS.map(tab => (
        <button
          key={tab.path}
          onClick={() => navigate(tab.path)}
          className={`nav-item ${isActive(tab.path) ? 'active' : ''} ${tab.isAI ? 'ai-tab' : ''} ${(tab as any).isSale ? 'sale-tab' : ''}`}
        >
          <span className="nav-icon">{tab.icon}</span>
          <span className="nav-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
