import { useEffect, useState } from 'react';
import { supabase, MALL_ID } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import FormField, { inputStyle } from '../components/FormField';
import SaveButton, { SaveState } from '../components/SaveButton';

interface Bathroom {
  id: string;
  label: string;
  floor: number;
  zone: string;
  distance_m: number;
  accessible: boolean;
  family: boolean;
  active: boolean;
}

const EMPTY_FORM: Omit<Bathroom, 'id' | 'active'> = {
  label: '',
  floor: 1,
  zone: '',
  distance_m: 0,
  accessible: true,
  family: false,
};

export default function BathroomsScreen() {
  const { mallId } = useAuth();
  const effectiveMallId = mallId || MALL_ID;

  const [bathrooms, setBathrooms] = useState<Bathroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState<Omit<Bathroom, 'id' | 'active'>>(EMPTY_FORM);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  async function load() {
    if (!effectiveMallId) return;
    const { data } = await supabase
      .from('bathrooms')
      .select('*')
      .eq('mall_id', effectiveMallId)
      .order('floor')
      .order('label');
    setBathrooms((data as Bathroom[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [effectiveMallId]);

  const startCreate = () => { setForm(EMPTY_FORM); setEditingId('new'); };
  const startEdit = (b: Bathroom) => {
    const { id, active: _active, ...rest } = b;
    setForm(rest);
    setEditingId(id);
  };
  const cancelEdit = () => { setEditingId(null); setSaveState('idle'); };

  const setField = <K extends keyof typeof EMPTY_FORM>(key: K, val: (typeof EMPTY_FORM)[K]) =>
    setForm(f => ({ ...f, [key]: val }));

  const handleSave = async () => {
    if (!effectiveMallId) return;
    setSaveState('saving');
    try {
      const payload = { ...form, mall_id: effectiveMallId };
      if (editingId === 'new') {
        const { error } = await supabase.from('bathrooms').insert(payload);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('bathrooms').update(form).eq('id', editingId!);
        if (error) throw error;
      }
      await load();
      setSaveState('saved');
      setTimeout(() => { setSaveState('idle'); setEditingId(null); }, 1500);
    } catch (err: any) {
      console.error(err);
      setSaveState('error');
      setTimeout(() => setSaveState('idle'), 3000);
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from('bathrooms').delete().eq('id', id);
    setDeleteConfirm(null);
    await load();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
        <p style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)', fontWeight: 700 }}>Cargando…</p>
      </div>
    );
  }

  const EditForm = ({ borderTop }: { borderTop?: boolean }) => (
    <div style={{
      border: '2px solid var(--primary)',
      borderTop: borderTop ? 'none' : '2px solid var(--primary)',
      borderRadius: borderTop ? '0 0 16px 16px' : '16px',
      padding: '24px',
      background: 'var(--bg-surface)',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
    }}>
      {!borderTop && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontFamily: 'var(--font-headline)', fontSize: '1rem', fontWeight: 900, letterSpacing: '-0.03em', margin: 0 }}>
            Nuevo Baño
          </p>
          <button onClick={cancelEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 700, color: 'var(--text-secondary)' }}>
            Cancelar ×
          </button>
        </div>
      )}

      <div className="admin-grid-2-wide">
        <FormField label="Nombre / Ubicación">
          <input style={inputStyle} value={form.label} onChange={e => setField('label', e.target.value)}
            onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
        </FormField>
        <FormField label="Piso">
          <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.floor} onChange={e => setField('floor', Number(e.target.value))}>
            {[1, 2, 3, 4].map(f => <option key={f} value={f}>Nivel {f}</option>)}
          </select>
        </FormField>
      </div>

      <div className="admin-grid-2">
        <FormField label="Zona / Sector">
          <input style={inputStyle} value={form.zone} onChange={e => setField('zone', e.target.value)}
            placeholder="Ej: Ala Norte"
            onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
        </FormField>
        <FormField label="Distancia (metros)">
          <input type="number" style={inputStyle} value={form.distance_m} min={0}
            onChange={e => setField('distance_m', Number(e.target.value))}
            onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
        </FormField>
      </div>

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        {([
          { key: 'accessible' as const, label: 'Accesible' },
          { key: 'family'     as const, label: 'Familiar' },
        ] as const).map(({ key, label }) => (
          <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input type="checkbox" checked={form[key]} onChange={e => setField(key, e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }} />
            <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.88rem' }}>{label}</span>
          </label>
        ))}
      </div>

      <div>
        <SaveButton state={saveState} onClick={handleSave} />
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.04em', margin: 0 }}>
            Baños
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)', margin: '4px 0 0', fontWeight: 600 }}>
            {bathrooms.length} baños registrados
          </p>
        </div>
        {editingId === null && (
          <button
            onClick={startCreate}
            style={{
              padding: '11px 22px',
              borderRadius: '12px',
              border: 'none',
              background: 'var(--primary)',
              fontFamily: 'var(--font-body)',
              fontWeight: 700,
              fontSize: '0.9rem',
              color: '#000',
              cursor: 'pointer',
            }}
          >
            + Agregar baño
          </button>
        )}
      </div>

      {/* New form */}
      {editingId === 'new' && <EditForm />}

      {/* List */}
      {bathrooms.length === 0 && editingId !== 'new' ? (
        <div style={{
          background: 'var(--bg-surface)',
          border: '2px solid var(--border)',
          borderRadius: '16px',
          padding: '40px',
          textAlign: 'center',
        }}>
          <p style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)', fontWeight: 600 }}>
            No hay baños registrados. Agrega uno con el botón de arriba.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {bathrooms.map(b => (
            <div key={b.id}>
              <div style={{
                background: 'var(--bg-surface)',
                border: `2px solid ${editingId === b.id ? 'var(--primary)' : 'var(--border)'}`,
                borderRadius: editingId === b.id ? '16px 16px 0 0' : '16px',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap',
              }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.92rem' }}>{b.label}</span>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Nivel {b.floor}
                    </span>
                    {b.accessible && (
                      <span style={{ padding: '2px 8px', borderRadius: '12px', background: '#dbeafe', color: '#1e40af', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.7rem' }}>
                        Accesible
                      </span>
                    )}
                    {b.family && (
                      <span style={{ padding: '2px 8px', borderRadius: '12px', background: '#dcfce7', color: '#166534', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.7rem' }}>
                        Familiar
                      </span>
                    )}
                  </div>
                  {b.zone && (
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {b.zone} · {b.distance_m}m
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => editingId === b.id ? cancelEdit() : startEdit(b)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '8px',
                      border: '2px solid var(--border)',
                      background: 'transparent',
                      fontFamily: 'var(--font-body)',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                    }}
                  >
                    {editingId === b.id ? 'Cancelar' : 'Editar'}
                  </button>
                  {deleteConfirm === b.id ? (
                    <>
                      <button onClick={() => handleDelete(b.id)} style={{ padding: '5px 10px', borderRadius: '8px', border: 'none', background: '#ef4444', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.75rem', color: '#fff', cursor: 'pointer' }}>
                        Confirmar
                      </button>
                      <button onClick={() => setDeleteConfirm(null)} style={{ padding: '5px 8px', borderRadius: '8px', border: '2px solid var(--border)', background: 'transparent', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}>
                        ×
                      </button>
                    </>
                  ) : (
                    <button onClick={() => setDeleteConfirm(b.id)} style={{ padding: '5px 8px', borderRadius: '8px', border: '2px solid var(--border)', background: 'transparent', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.75rem', color: '#ef4444', cursor: 'pointer' }}>
                      Eliminar
                    </button>
                  )}
                </div>
              </div>

              {editingId === b.id && <EditForm borderTop />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
