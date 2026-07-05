import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import FormField, { inputStyle } from '../components/FormField';
import TagInput from '../components/TagInput';
import SaveButton, { SaveState } from '../components/SaveButton';

interface Category { id: string; name: string; }
interface SaleDraft { id?: string; description: string; active: boolean; }

interface StoreEditScreenProps {
  storeId?: string;
}


async function getOrCreateBrand(name: string): Promise<string | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const { data: existing } = await supabase
    .from('brands')
    .select('id')
    .eq('name', trimmed)
    .maybeSingle();
  if (existing) return existing.id;
  const { data: created } = await supabase
    .from('brands')
    .insert({ name: trimmed })
    .select('id')
    .single();
  return created?.id ?? null;
}

export default function StoreEditScreen({ storeId: propStoreId }: StoreEditScreenProps) {
  const { id: paramId } = useParams<{ id: string }>();
  const { storeId: authStoreId, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const id = propStoreId ?? paramId ?? authStoreId ?? '';
  const [isNewUnsaved, setIsNewUnsaved] = useState(() => Boolean((location.state as any)?.isNew));

  // Store basics
  const [name, setName]   = useState('');
  const [emoji, setEmoji] = useState('');
  const [unit, setUnit]   = useState('');
  const [floor, setFloor] = useState('1');
  const [desc, setDesc]   = useState('');

  // Relations
  const [allCategories, setAllCategories]     = useState<Category[]>([]);
  const [selectedCatIds, setSelectedCatIds]   = useState<string[]>([]);
  const [brands, setBrands]                   = useState<string[]>([]);
  const [sales, setSales]                     = useState<SaleDraft[]>([]);

  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [loading, setLoading]     = useState(true);
  const [notFound, setNotFound]   = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting]   = useState(false);

  useEffect(() => {
    if (!id) { setNotFound(true); setLoading(false); return; }

    async function load() {
      const [
        { data: store, error: storeErr },
        { data: catRows },
        { data: storeCatRows },
        { data: brandRows },
        { data: salesRows },
      ] = await Promise.all([
        supabase.from('stores').select('name, emoji, unit, floor, description').eq('id', id).single(),
        supabase.from('categories').select('id, name').order('name'),
        supabase.from('store_categories').select('category_id').eq('store_id', id),
        supabase.from('store_brands').select('brands(name)').eq('store_id', id),
        supabase.from('store_sales').select('id, description, active').eq('store_id', id).order('created_at'),
      ]);

      if (storeErr || !store) { setNotFound(true); setLoading(false); return; }

      setName(store.name ?? '');
      setEmoji(store.emoji ?? '');
      setUnit(store.unit ?? '');
      setFloor(String(store.floor ?? 1));
      setDesc(store.description ?? '');
      setAllCategories((catRows as Category[]) ?? []);
      setSelectedCatIds((storeCatRows ?? []).map((r: any) => r.category_id));
      setBrands((brandRows ?? []).map((r: any) => r.brands?.name).filter(Boolean));
      setSales((salesRows ?? []).map((r: any) => ({ id: r.id, description: r.description, active: r.active })));
      setLoading(false);
    }

    load();
  }, [id]);

  const toggleCategory = (catId: string) => {
    setSelectedCatIds(prev =>
      prev.includes(catId) ? prev.filter(c => c !== catId) : [...prev, catId]
    );
  };

  const addSale = () => setSales(s => [...s, { description: '', active: true }]);
  const updateSale = (i: number, desc: string) =>
    setSales(s => s.map((x, idx) => idx === i ? { ...x, description: desc } : x));
  const toggleSale = (i: number) =>
    setSales(s => s.map((x, idx) => idx === i ? { ...x, active: !x.active } : x));
  const removeSale = (i: number) => setSales(s => s.filter((_, idx) => idx !== i));

  const handleDelete = async () => {
    if (!id || deleting) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from('stores').delete().eq('id', id);
      if (error) throw error;
      navigate('/admin/stores');
    } catch (err: any) {
      console.error('[StoreEdit] delete error:', err);
      setDeleting(false);
      setDeleteConfirm(false);
    }
  };

  const handleCancel = async () => {
    if (role === 'mall_admin') {
      if (isNewUnsaved && id) {
        await supabase.from('stores').delete().eq('id', id);
      }
      navigate('/admin/stores');
    } else {
      navigate('/admin');
    }
  };

  const handleSave = async () => {
    if (!id) return;
    setSaveState('saving');
    try {
      // 1. Store basics
      const { error: storeErr } = await supabase
        .from('stores')
        .update({ name: name.trim(), emoji: emoji.trim(), unit: unit.trim(), floor: Number(floor), description: desc.trim() })
        .eq('id', id);
      if (storeErr) throw storeErr;

      // 2. Categories: delete + re-insert
      await supabase.from('store_categories').delete().eq('store_id', id);
      if (selectedCatIds.length > 0) {
        const { error: catErr } = await supabase.from('store_categories').insert(
          selectedCatIds.map(cid => ({ store_id: id, category_id: cid }))
        );
        if (catErr) throw catErr;
      }

      // 3. Brands: get-or-create + delete + re-insert
      const brandIds = (await Promise.all(brands.map(getOrCreateBrand))).filter(Boolean) as string[];
      await supabase.from('store_brands').delete().eq('store_id', id);
      if (brandIds.length > 0) {
        const { error: brandErr } = await supabase.from('store_brands').insert(
          brandIds.map(bid => ({ store_id: id, brand_id: bid }))
        );
        if (brandErr) throw brandErr;
      }

      // 4. Sales: delete + re-insert non-empty ones
      await supabase.from('store_sales').delete().eq('store_id', id);
      const validSales = sales.filter(s => s.description.trim());
      if (validSales.length > 0) {
        const { error: salesErr } = await supabase.from('store_sales').insert(
          validSales.map(s => ({ store_id: id, description: s.description.trim(), active: s.active }))
        );
        if (salesErr) throw salesErr;
      }

      // 5. Background embedding update — fire and forget
      supabase.functions.invoke('embed-store', { body: { store_id: id } })
        .catch(err => console.warn('[embed-store]', err));

      setIsNewUnsaved(false);
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2500);
    } catch (err: any) {
      console.error('[StoreEdit] save error:', err);
      setSaveState('error');
      setTimeout(() => setSaveState('idle'), 3000);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
        <p style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)', fontWeight: 700 }}>Cargando…</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-start' }}>
        <p style={{ fontFamily: 'var(--font-body)', color: '#ef4444', fontWeight: 700 }}>Tienda no encontrada.</p>
        {role === 'mall_admin' && (
          <button onClick={() => navigate('/admin/stores')} style={{ cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 700, padding: '10px 20px', borderRadius: '10px', border: '2px solid var(--border)', background: 'transparent' }}>
            ← Volver a tiendas
          </button>
        )}
      </div>
    );
  }

  const sectionStyle: React.CSSProperties = {
    background: 'var(--bg-surface)',
    border: '2px solid var(--border)',
    borderRadius: '16px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontFamily: 'var(--font-headline)',
    fontSize: '1rem',
    fontWeight: 900,
    letterSpacing: '-0.03em',
    margin: 0,
    paddingBottom: '12px',
    borderBottom: '1px solid var(--border)',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '720px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          {role === 'mall_admin' && (
            <button
              onClick={() => navigate('/admin/stores')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-secondary)', padding: '0 0 8px', display: 'block' }}
            >
              ← Tiendas
            </button>
          )}
          <h1 style={{
            fontFamily: 'var(--font-headline)',
            fontSize: '2rem',
            fontWeight: 900,
            letterSpacing: '-0.04em',
            margin: 0,
          }}>
            {name || 'Editar Tienda'}
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {role === 'mall_admin' && (
            deleteConfirm ? (
              <>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  style={{ padding: '11px 18px', borderRadius: '12px', border: 'none', background: '#ef4444', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.85rem', color: '#fff', cursor: deleting ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}
                >
                  {deleting ? 'Eliminando…' : 'Confirmar eliminación'}
                </button>
                <button
                  onClick={() => setDeleteConfirm(false)}
                  disabled={deleting}
                  style={{ padding: '11px 14px', borderRadius: '12px', border: '2px solid var(--border)', background: 'transparent', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', cursor: 'pointer' }}
                >
                  ×
                </button>
              </>
            ) : (
              <button
                onClick={() => setDeleteConfirm(true)}
                style={{ padding: '11px 18px', borderRadius: '12px', border: '2px solid var(--border)', background: 'transparent', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.85rem', color: '#ef4444', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                Eliminar tienda
              </button>
            )
          )}
          <button
            onClick={handleCancel}
            style={{ padding: '11px 18px', borderRadius: '12px', border: '2px solid var(--border)', background: 'transparent', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            Cancelar
          </button>
          <SaveButton state={saveState} onClick={handleSave} />
        </div>
      </div>

      {/* Info básica */}
      <div style={sectionStyle}>
        <p style={sectionTitleStyle}>Información básica</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: '16px' }}>
          <FormField label="Nombre de la tienda">
            <input
              style={inputStyle}
              value={name}
              onChange={e => setName(e.target.value)}
              onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
          </FormField>
          <FormField label="Emoji">
            <input
              style={{ ...inputStyle, textAlign: 'center', fontSize: '1.4rem' }}
              value={emoji}
              maxLength={2}
              onChange={e => setEmoji(e.target.value)}
              onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
          </FormField>
        </div>
        <div className="admin-grid-2">
          <FormField label="Local / Unidad">
            <input
              style={inputStyle}
              value={unit}
              onChange={e => setUnit(e.target.value)}
              onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
          </FormField>
          <FormField label="Piso">
            <select
              style={{ ...inputStyle, cursor: 'pointer' }}
              value={floor}
              onChange={e => setFloor(e.target.value)}
            >
              {[1, 2, 3, 4].map(f => (
                <option key={f} value={f}>Nivel {f}</option>
              ))}
            </select>
          </FormField>
        </div>
        <FormField label="Descripción" hint="Describe la tienda, sus productos y servicios. No incluyas palabras clave manuales.">
          <textarea
            style={{
              ...inputStyle,
              minHeight: '120px',
              resize: 'vertical',
              lineHeight: 1.6,
            }}
            value={desc}
            onChange={e => setDesc(e.target.value)}
            onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border)')}
          />
        </FormField>
      </div>

      {/* Categorías */}
      <div style={sectionStyle}>
        <p style={sectionTitleStyle}>Categorías</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {allCategories.map(cat => {
            const selected = selectedCatIds.includes(cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => toggleCategory(cat.id)}
                style={{
                  padding: '7px 16px',
                  borderRadius: '20px',
                  border: `2px solid ${selected ? 'var(--primary)' : 'var(--border)'}`,
                  background: selected ? 'var(--primary)' : 'transparent',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  color: selected ? '#000' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {cat.name}
              </button>
            );
          })}
          {allCategories.length === 0 && (
            <p style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              No hay categorías disponibles.
            </p>
          )}
        </div>
      </div>

      {/* Marcas */}
      <div style={sectionStyle}>
        <p style={sectionTitleStyle}>Marcas y productos</p>
        <FormField label="Marcas" hint="Escribe una marca y presiona Enter o coma para agregarla.">
          <TagInput tags={brands} onChange={setBrands} placeholder="Ej: Nike, Adidas, Zara…" />
        </FormField>
      </div>

      {/* Baratillo */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ ...sectionTitleStyle, border: 'none', paddingBottom: 0 }}>Ofertas Baratillo</p>
          <button
            onClick={addSale}
            style={{
              padding: '7px 16px',
              borderRadius: '8px',
              border: '2px solid var(--primary)',
              background: 'transparent',
              fontFamily: 'var(--font-body)',
              fontWeight: 700,
              fontSize: '0.82rem',
              color: 'var(--text-primary)',
              cursor: 'pointer',
            }}
          >
            + Agregar oferta
          </button>
        </div>
        {sales.length === 0 ? (
          <p style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Sin ofertas activas. Agrega una para mostrar el badge de Baratillo.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {sales.map((sale, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '2px solid var(--border)',
                background: sale.active ? 'var(--bg-surface)' : 'var(--bg-surface-low)',
                opacity: sale.active ? 1 : 0.6,
              }}>
                <input
                  style={{
                    flex: 1,
                    border: 'none',
                    background: 'transparent',
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.9rem',
                    color: 'var(--text-primary)',
                    outline: 'none',
                  }}
                  placeholder="Ej: 30% descuento en toda la tienda"
                  value={sale.description}
                  onChange={e => updateSale(i, e.target.value)}
                />
                <button
                  onClick={() => toggleSale(i)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: `2px solid ${sale.active ? 'var(--primary)' : 'var(--border)'}`,
                    background: sale.active ? 'var(--primary)' : 'transparent',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 700,
                    fontSize: '0.72rem',
                    color: sale.active ? '#000' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {sale.active ? 'Activa' : 'Inactiva'}
                </button>
                <button
                  onClick={() => removeSale(i)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    border: 'none',
                    background: 'none',
                    color: '#ef4444',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: 700,
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save at bottom too */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', paddingBottom: '16px' }}>
        <button
          onClick={handleCancel}
          style={{ padding: '11px 18px', borderRadius: '12px', border: '2px solid var(--border)', background: 'transparent', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          Cancelar
        </button>
        <SaveButton state={saveState} onClick={handleSave} />
      </div>
    </div>
  );
}
