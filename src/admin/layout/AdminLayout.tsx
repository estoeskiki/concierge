import { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface NavItem {
  to: string;
  label: string;
  icon: string;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/admin',           label: 'Resumen',  icon: '▤' },
  { to: '/admin/stores',    label: 'Tiendas',  icon: '◫', adminOnly: true },
  { to: '/admin/events',    label: 'Eventos',  icon: '◷', adminOnly: true },
  { to: '/admin/bathrooms', label: 'Baños',    icon: '◈', adminOnly: true },
  { to: '/admin/store',     label: 'Mi Tienda', icon: '◩' },
];

function NavItemLink({ item, compact }: { item: NavItem; compact?: boolean }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === '/admin'}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: compact ? 0 : '10px',
        flexDirection: compact ? 'column' : 'row',
        padding: compact ? '8px 0' : '10px 16px',
        borderRadius: compact ? 0 : '10px',
        background: isActive ? 'var(--primary)' : 'transparent',
        color: isActive ? '#000' : 'var(--text-secondary)',
        textDecoration: 'none',
        fontFamily: 'var(--font-body)',
        fontWeight: 700,
        fontSize: compact ? '0.65rem' : '0.88rem',
        transition: 'all 0.15s',
        cursor: 'pointer',
        flex: compact ? 1 : undefined,
        justifyContent: compact ? 'center' : undefined,
        textAlign: compact ? 'center' : undefined,
      })}
    >
      <span style={{ fontSize: compact ? '1.2rem' : '1rem', lineHeight: 1 }}>{item.icon}</span>
      <span>{item.label}</span>
    </NavLink>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { role, session, signOut } = useAuth();
  const navigate = useNavigate();

  const visibleItems = NAV_ITEMS.filter(item => {
    if (item.adminOnly && role !== 'mall_admin') return false;
    if (item.to === '/admin/store' && role !== 'store_manager') return false;
    return true;
  });

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin');
  };

  return (
    <>
      <style>{`
        .admin-shell {
          display: flex;
          flex-direction: row;
          height: 100vh;
          overflow: hidden;
          background: var(--bg-page);
        }
        .admin-sidebar {
          width: 220px;
          min-width: 220px;
          height: 100vh;
          background: var(--bg-surface);
          border-right: 2px solid var(--border);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .admin-content {
          flex: 1;
          height: 100vh;
          overflow-y: auto;
          padding: 32px 36px;
        }
        .admin-bottom-nav {
          display: none;
          position: fixed;
          bottom: 0; left: 0; right: 0;
          height: 64px;
          background: var(--bg-surface);
          border-top: 2px solid var(--border);
          z-index: 50;
        }
        @media (max-width: 768px) {
          .admin-sidebar { display: none; }
          .admin-bottom-nav { display: flex; }
          .admin-content { padding: 20px 16px 84px; }
        }
        @media (max-width: 480px) {
          .admin-content { padding: 16px 12px 84px; }
        }
      `}</style>

      <div className="admin-shell">
        {/* Sidebar — desktop */}
        <aside className="admin-sidebar">
          {/* Brand */}
          <div style={{
            padding: '24px 20px 20px',
            borderBottom: '2px solid var(--border)',
          }}>
            <p style={{
              fontFamily: 'var(--font-headline)',
              fontSize: '1.6rem',
              fontWeight: 900,
              letterSpacing: '-0.05em',
              margin: 0,
              color: 'var(--text-primary)',
            }}>
              kiki
            </p>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.72rem',
              color: 'var(--text-secondary)',
              fontWeight: 600,
              margin: '2px 0 0',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}>
              {role === 'mall_admin' ? 'Administrador' : 'Portal de Tienda'}
            </p>
          </div>

          {/* Nav */}
          <nav style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
            {visibleItems.map(item => (
              <NavItemLink key={item.to} item={item} />
            ))}
          </nav>

          {/* Footer */}
          <div style={{
            padding: '16px 20px',
            borderTop: '2px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}>
            <p style={{
              margin: 0,
              fontFamily: 'var(--font-body)',
              fontSize: '0.78rem',
              color: 'var(--text-secondary)',
              fontWeight: 600,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {session?.user?.email}
            </p>
            <button
              onClick={handleSignOut}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: '2px solid var(--border)',
                background: 'transparent',
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s',
              }}
            >
              Cerrar sesión
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="admin-content">
          {children}
        </main>

        {/* Bottom nav — mobile */}
        <nav className="admin-bottom-nav">
          {visibleItems.map(item => (
            <NavItemLink key={item.to} item={item} compact />
          ))}
        </nav>
      </div>
    </>
  );
}
