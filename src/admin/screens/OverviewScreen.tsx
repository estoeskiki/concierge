import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface Stats {
  stores: number;
  events: number;
  baratillo: number;
  brands: number;
}

function StatCard({ value, label, sub }: { value: number | string; label: string; sub?: string }) {
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '2px solid var(--border)',
      borderRadius: '16px',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
    }}>
      <p style={{
        fontFamily: 'var(--font-headline)',
        fontSize: '2.4rem',
        fontWeight: 900,
        letterSpacing: '-0.04em',
        margin: 0,
        color: 'var(--text-primary)',
      }}>
        {value}
      </p>
      <p style={{
        fontFamily: 'var(--font-body)',
        fontWeight: 700,
        fontSize: '0.85rem',
        color: 'var(--text-primary)',
        margin: 0,
      }}>
        {label}
      </p>
      {sub && (
        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
          {sub}
        </p>
      )}
    </div>
  );
}

export default function OverviewScreen() {
  const { role, mallId, storeId } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({ stores: 0, events: 0, baratillo: 0, brands: 0 });
  const [storeName, setStoreName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAdmin() {
      if (!mallId) return;
      const [s, e, b, br] = await Promise.all([
        supabase.from('stores').select('*', { count: 'exact', head: true }).eq('mall_id', mallId),
        supabase.from('events').select('*', { count: 'exact', head: true }).eq('mall_id', mallId).eq('active', true),
        supabase.from('store_sales').select('store_id', { count: 'exact', head: true }).eq('active', true),
        supabase.from('brands').select('*', { count: 'exact', head: true }),
      ]);
      setStats({
        stores: s.count ?? 0,
        events: e.count ?? 0,
        baratillo: b.count ?? 0,
        brands: br.count ?? 0,
      });
      setLoading(false);
    }

    async function loadManager() {
      if (!storeId) return;
      const { data } = await supabase.from('stores').select('name').eq('id', storeId).single();
      setStoreName(data?.name ?? '');
      const { count } = await supabase
        .from('store_sales')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', storeId)
        .eq('active', true);
      setStats(s => ({ ...s, baratillo: count ?? 0 }));
      setLoading(false);
    }

    if (role === 'mall_admin') loadAdmin();
    else if (role === 'store_manager') loadManager();
  }, [role, mallId, storeId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
        <p style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)', fontWeight: 700 }}>Cargando…</p>
      </div>
    );
  }

  if (role === 'store_manager') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '640px' }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-headline)',
            fontSize: '2rem',
            fontWeight: 900,
            letterSpacing: '-0.04em',
            margin: 0,
          }}>
            {storeName || 'Mi Tienda'}
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)', margin: '4px 0 0', fontWeight: 600 }}>
            Gestiona la información de tu tienda
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          <StatCard value={stats.baratillo} label="Ofertas activas" sub="Baratillo" />
        </div>

        <button
          onClick={() => navigate('/admin/store')}
          style={{
            alignSelf: 'flex-start',
            padding: '14px 28px',
            borderRadius: '12px',
            border: 'none',
            background: 'var(--primary)',
            fontFamily: 'var(--font-body)',
            fontWeight: 700,
            fontSize: '0.95rem',
            color: '#000',
            cursor: 'pointer',
          }}
        >
          Editar información de la tienda →
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div>
        <h1 style={{
          fontFamily: 'var(--font-headline)',
          fontSize: '2rem',
          fontWeight: 900,
          letterSpacing: '-0.04em',
          margin: 0,
        }}>
          Resumen
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)', margin: '4px 0 0', fontWeight: 600 }}>
          Vista general del mall
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: '16px',
      }}>
        <StatCard value={stats.stores}    label="Tiendas"          sub="En el mall" />
        <StatCard value={stats.events}    label="Eventos activos"  sub="En cartelera" />
        <StatCard value={stats.baratillo} label="Ofertas activas"  sub="Baratillo" />
        <StatCard value={stats.brands}    label="Marcas"           sub="Registradas" />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '12px',
      }}>
        {[
          { label: 'Ver tiendas', to: '/admin/stores' },
          { label: 'Ver eventos', to: '/admin/events' },
          { label: 'Ver baños', to: '/admin/bathrooms' },
        ].map(({ label, to }) => (
          <button
            key={to}
            onClick={() => navigate(to)}
            style={{
              padding: '14px 20px',
              borderRadius: '12px',
              border: '2px solid var(--border)',
              background: 'var(--bg-surface)',
              fontFamily: 'var(--font-body)',
              fontWeight: 700,
              fontSize: '0.88rem',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--primary)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            {label} →
          </button>
        ))}
      </div>
    </div>
  );
}
