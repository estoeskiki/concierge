import { useNavigate } from 'react-router-dom';

export interface Store {
  id: string;
  name: string;
  floor: number;
  unit: string;
  emoji: string;
  description: string;
  category?: string;
  brand?: string;
  categories?: string[];
  brands?: string[];
  tags?: string[];
  baratillo?: boolean;
  sales?: string[];
}

export default function StoreCard({ store, showBadge = false }: { store: Store; showBadge?: boolean }) {
  const navigate = useNavigate();
  const hasBadge = showBadge && store.baratillo;

  return (
    <div
      onClick={() => navigate(`/store/${store.id}`)}
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: `2px solid ${hasBadge ? 'var(--secondary)' : 'var(--border)'}`,
        borderRadius: '24px',
        padding: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: hasBadge ? '0 4px 16px rgba(255,107,152,0.15)' : '0 4px 12px rgba(0,0,0,0.02)'
      }}
      className="store-card"
    >
      <div style={{
        fontSize: '3rem',
        width: '80px',
        height: '80px',
        backgroundColor: 'var(--bg-surface-low)',
        borderRadius: '20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0
      }}>
        {store.emoji}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {hasBadge && (
          <span className="baratillo-badge" style={{ marginBottom: '6px', display: 'inline-block' }}>
            BARATILLO
          </span>
        )}
        <h3 className="font-headline" style={{ fontSize: '1.75rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
          {store.name}
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', margin: 0, fontWeight: 600 }}>
          {store.categories?.join(' • ') || 'Tienda'}
        </p>
      </div>

    </div>
  );
}
