import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface StoreRow {
  id: string;
  name: string;
  emoji: string | null;
  floor: number;
  unit: string;
  description: string | null;
}

function stripKeywords(desc: string | null): string {
  if (!desc) return '';
  return desc.split(/\s*\[?\s*Keywords?:/i)[0].trim();
}

const colLabelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: '0.72rem',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'var(--text-secondary)',
};

export default function StoresScreen() {
  const { mallId } = useAuth();
  const navigate = useNavigate();
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!mallId) return;
    supabase
      .from('stores')
      .select('id, name, emoji, floor, unit, description')
      .eq('mall_id', mallId)
      .order('name')
      .then(({ data }) => {
        setStores((data as StoreRow[]) ?? []);
        setLoading(false);
      });
  }, [mallId]);

  const handleCreate = async () => {
    if (!mallId || creating) return;
    setCreating(true);
    try {
      const { data, error } = await supabase
        .from('stores')
        .insert({ mall_id: mallId, name: 'Nueva tienda', unit: '', floor: 1 })
        .select('id')
        .single();
      if (error) throw error;
      navigate(`/admin/stores/${data.id}`, { state: { isNew: true } });
    } catch (err: any) {
      console.error('[StoresScreen] create error:', err);
      setCreating(false);
    }
  };

  const filtered = stores.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.unit.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
        <p style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)', fontWeight: 700 }}>Cargando…</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-headline)',
            fontSize: '2rem',
            fontWeight: 900,
            letterSpacing: '-0.04em',
            margin: 0,
          }}>
            Tiendas
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)', margin: '4px 0 0', fontWeight: 600 }}>
            {stores.length} tiendas en el mall
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Buscar tienda…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              padding: '10px 16px',
              borderRadius: '10px',
              border: '2px solid var(--border)',
              background: 'var(--bg-surface)',
              fontFamily: 'var(--font-body)',
              fontSize: '0.9rem',
              color: 'var(--text-primary)',
              outline: 'none',
              width: '220px',
            }}
          />
          <button
            onClick={handleCreate}
            disabled={creating}
            style={{
              padding: '11px 22px',
              borderRadius: '12px',
              border: 'none',
              background: 'var(--primary)',
              fontFamily: 'var(--font-body)',
              fontWeight: 700,
              fontSize: '0.9rem',
              color: '#000',
              cursor: creating ? 'not-allowed' : 'pointer',
              opacity: creating ? 0.7 : 1,
              whiteSpace: 'nowrap',
            }}
          >
            {creating ? 'Creando…' : '+ Crear tienda'}
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '2px solid var(--border)',
        borderRadius: '16px',
        overflow: 'hidden',
      }}>
        {/* Table header — hidden on mobile, rows become cards instead */}
        <div className="stores-table-header">
          <span style={colLabelStyle}>Tienda</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={colLabelStyle}>Piso</span>
            <span style={colLabelStyle}>Local</span>
          </div>
          <span style={colLabelStyle}>Descripción</span>
          <span style={colLabelStyle}></span>
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <p style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
            No se encontraron tiendas
          </p>
        ) : (
          filtered.map((store, i) => (
            <div
              key={store.id}
              className="stores-row"
              style={{
                borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                cursor: 'pointer',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-surface-low)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              onClick={() => navigate(`/admin/stores/${store.id}`)}
            >
              <span className="stores-row-name" style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                fontSize: '0.9rem',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                minWidth: 0,
              }}>
                {store.emoji && <span style={{ fontSize: '1.1rem' }}>{store.emoji}</span>}
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{store.name}</span>
              </span>
              <div className="stores-row-meta">
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.88rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Nivel {store.floor}
                </span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.88rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  {store.unit}
                </span>
              </div>
              <span className="stores-row-desc" style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.82rem',
                color: 'var(--text-secondary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {stripKeywords(store.description).slice(0, 80)}{stripKeywords(store.description).length > 80 ? '…' : ''}
              </span>
              <button
                className="stores-row-edit"
                onClick={e => { e.stopPropagation(); navigate(`/admin/stores/${store.id}`); }}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: '2px solid var(--border)',
                  background: 'transparent',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Editar
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
