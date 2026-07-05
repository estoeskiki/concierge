import { useEffect, useState } from 'react';
import { supabase, MALL_ID } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import FormField, { inputStyle } from '../components/FormField';
import SaveButton, { SaveState } from '../components/SaveButton';

type EventType = 'moda' | 'musica' | 'belleza' | 'comida' | 'familia';

interface Event {
  id: string;
  title: string;
  type: EventType;
  dates: string;
  start_date: string;
  end_date: string;
  time: string;
  location: string;
  description: string;
  active: boolean;
}

const TYPE_LABELS: Record<EventType, string> = {
  moda:    'Moda',
  musica:  'Música',
  belleza: 'Belleza',
  comida:  'Comida',
  familia: 'Familia',
};

const TYPE_COLORS: Record<EventType, { bg: string; color: string }> = {
  moda:    { bg: '#fce7f3', color: '#be185d' },
  musica:  { bg: '#ede9fe', color: '#7c3aed' },
  belleza: { bg: '#fef3c7', color: '#92400e' },
  comida:  { bg: '#dcfce7', color: '#166534' },
  familia: { bg: '#dbeafe', color: '#1e40af' },
};

const EMPTY_FORM: Omit<Event, 'id'> = {
  title: '',
  type: 'moda',
  dates: '',
  start_date: '',
  end_date: '',
  time: '',
  location: '',
  description: '',
  active: true,
};

function TypeBadge({ type }: { type: EventType }) {
  const c = TYPE_COLORS[type];
  return (
    <span style={{
      padding: '3px 10px',
      borderRadius: '20px',
      background: c.bg,
      color: c.color,
      fontFamily: 'var(--font-body)',
      fontWeight: 700,
      fontSize: '0.75rem',
    }}>
      {TYPE_LABELS[type]}
    </span>
  );
}

export default function EventsScreen() {
  const { mallId } = useAuth();
  const effectiveMallId = mallId || MALL_ID;

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState<Omit<Event, 'id'>>(EMPTY_FORM);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  async function load() {
    if (!effectiveMallId) return;
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('mall_id', effectiveMallId)
      .order('start_date', { ascending: false });
    setEvents((data as Event[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [effectiveMallId]);

  const startCreate = () => {
    setForm(EMPTY_FORM);
    setEditingId('new');
  };

  const startEdit = (ev: Event) => {
    const { id, ...rest } = ev;
    setForm(rest);
    setEditingId(id);
  };

  const cancelEdit = () => { setEditingId(null); setSaveState('idle'); };

  const setField = <K extends keyof typeof EMPTY_FORM>(key: K, val: (typeof EMPTY_FORM)[K]) =>
    setForm(f => ({ ...f, [key]: val }));

  const autoFillDates = () => {
    if (!form.start_date && !form.end_date) return form.dates;
    if (form.start_date === form.end_date) return new Date(form.start_date + 'T12:00:00').toLocaleDateString('es-PR', { day: 'numeric', month: 'long', year: 'numeric' });
    const start = new Date(form.start_date + 'T12:00:00');
    const end   = new Date(form.end_date   + 'T12:00:00');
    return `${start.getDate()} – ${end.toLocaleDateString('es-PR', { day: 'numeric', month: 'long', year: 'numeric' })}`;
  };

  const handleSave = async () => {
    if (!effectiveMallId) return;
    setSaveState('saving');
    try {
      const payload = {
        ...form,
        dates: form.dates || autoFillDates(),
        mall_id: effectiveMallId,
      };

      if (editingId === 'new') {
        const { error } = await supabase.from('events').insert(payload);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('events').update(payload).eq('id', editingId!);
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
    await supabase.from('events').delete().eq('id', id);
    setDeleteConfirm(null);
    await load();
  };

  const handleToggleActive = async (ev: Event) => {
    await supabase.from('events').update({ active: !ev.active }).eq('id', ev.id);
    setEvents(prev => prev.map(e => e.id === ev.id ? { ...e, active: !e.active } : e));
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
        <p style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)', fontWeight: 700 }}>Cargando…</p>
      </div>
    );
  }

  const formSection = (
    <div style={{
      background: 'var(--bg-surface)',
      border: '2px solid var(--primary)',
      borderRadius: '16px',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontFamily: 'var(--font-headline)', fontSize: '1rem', fontWeight: 900, letterSpacing: '-0.03em', margin: 0 }}>
          {editingId === 'new' ? 'Nuevo Evento' : 'Editar Evento'}
        </p>
        <button onClick={cancelEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          Cancelar ×
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', alignItems: 'end' }}>
        <FormField label="Título">
          <input style={inputStyle} value={form.title} onChange={e => setField('title', e.target.value)}
            onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
        </FormField>
        <FormField label="Tipo">
          <select
            style={{ ...inputStyle, cursor: 'pointer' }}
            value={form.type}
            onChange={e => setField('type', e.target.value as EventType)}
          >
            {(Object.keys(TYPE_LABELS) as EventType[]).map(t => (
              <option key={t} value={t}>{TYPE_LABELS[t]}</option>
            ))}
          </select>
        </FormField>
      </div>

      <div className="admin-grid-2">
        <FormField label="Fecha inicio">
          <input type="date" style={inputStyle} value={form.start_date} onChange={e => setField('start_date', e.target.value)}
            onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
        </FormField>
        <FormField label="Fecha fin">
          <input type="date" style={inputStyle} value={form.end_date} onChange={e => setField('end_date', e.target.value)}
            onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
        </FormField>
      </div>

      <div className="admin-grid-2">
        <FormField label="Hora" hint="Ej: 7:00 PM">
          <input style={inputStyle} value={form.time} onChange={e => setField('time', e.target.value)}
            onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
        </FormField>
        <FormField label="Lugar">
          <input style={inputStyle} value={form.location} onChange={e => setField('location', e.target.value)}
            onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
        </FormField>
      </div>

      <FormField label="Descripción">
        <textarea
          style={{ ...inputStyle, minHeight: '80px', resize: 'vertical', lineHeight: 1.6 }}
          value={form.description}
          onChange={e => setField('description', e.target.value)}
          onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
          onBlur={e => (e.target.style.borderColor = 'var(--border)')}
        />
      </FormField>

      <FormField label="Texto de fechas" hint="Se auto-genera si se deja vacío. Ej: 15 – 20 de junio de 2026">
        <input style={inputStyle} value={form.dates} placeholder={autoFillDates()}
          onChange={e => setField('dates', e.target.value)}
          onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
          onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
      </FormField>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={form.active}
            onChange={e => setField('active', e.target.checked)}
            style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
          />
          <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.88rem' }}>Evento activo (visible en kiosko)</span>
        </label>
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
            Eventos
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)', margin: '4px 0 0', fontWeight: 600 }}>
            {events.length} eventos • {events.filter(e => e.active).length} activos
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
            + Crear evento
          </button>
        )}
      </div>

      {/* Form (new) */}
      {editingId === 'new' && formSection}

      {/* Events list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {events.length === 0 && editingId !== 'new' && (
          <div style={{
            background: 'var(--bg-surface)',
            border: '2px solid var(--border)',
            borderRadius: '16px',
            padding: '40px',
            textAlign: 'center',
          }}>
            <p style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)', fontWeight: 600 }}>
              No hay eventos. Crea uno con el botón de arriba.
            </p>
          </div>
        )}

        {events.map(ev => (
          <div key={ev.id} style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            <div style={{
              background: 'var(--bg-surface)',
              border: `2px solid ${editingId === ev.id ? 'var(--primary)' : 'var(--border)'}`,
              borderRadius: editingId === ev.id ? '16px 16px 0 0' : '16px',
              padding: '18px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap',
              opacity: ev.active ? 1 : 0.65,
            }}>
              <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.95rem' }}>{ev.title}</span>
                  <TypeBadge type={ev.type} />
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '20px',
                    background: ev.active ? '#dcfce7' : 'var(--bg-surface-low)',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 700,
                    fontSize: '0.7rem',
                    color: ev.active ? '#166534' : 'var(--text-secondary)',
                  }}>
                    {ev.active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {ev.dates} · {ev.time} · {ev.location}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => handleToggleActive(ev)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '8px',
                    border: `2px solid ${ev.active ? '#ef4444' : 'var(--primary)'}`,
                    background: ev.active ? 'transparent' : 'var(--primary)',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    color: ev.active ? '#ef4444' : '#000',
                    cursor: 'pointer',
                  }}
                >
                  {ev.active ? 'Desactivar' : 'Activar'}
                </button>
                <button
                  onClick={() => editingId === ev.id ? cancelEdit() : startEdit(ev)}
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
                  {editingId === ev.id ? 'Cancelar' : 'Editar'}
                </button>
                {deleteConfirm === ev.id ? (
                  <>
                    <button onClick={() => handleDelete(ev.id)} style={{ padding: '5px 10px', borderRadius: '8px', border: 'none', background: '#ef4444', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.75rem', color: '#fff', cursor: 'pointer' }}>
                      Confirmar
                    </button>
                    <button onClick={() => setDeleteConfirm(null)} style={{ padding: '5px 8px', borderRadius: '8px', border: '2px solid var(--border)', background: 'transparent', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}>
                      ×
                    </button>
                  </>
                ) : (
                  <button onClick={() => setDeleteConfirm(ev.id)} style={{ padding: '5px 8px', borderRadius: '8px', border: '2px solid var(--border)', background: 'transparent', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.75rem', color: '#ef4444', cursor: 'pointer' }}>
                    Eliminar
                  </button>
                )}
              </div>
            </div>

            {/* Inline edit form */}
            {editingId === ev.id && (
              <div style={{
                border: '2px solid var(--primary)',
                borderTop: 'none',
                borderRadius: '0 0 16px 16px',
                padding: '24px',
                background: 'var(--bg-surface)',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', alignItems: 'end' }}>
                  <FormField label="Título">
                    <input style={inputStyle} value={form.title} onChange={e => setField('title', e.target.value)}
                      onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
                      onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
                  </FormField>
                  <FormField label="Tipo">
                    <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.type} onChange={e => setField('type', e.target.value as EventType)}>
                      {(Object.keys(TYPE_LABELS) as EventType[]).map(t => (
                        <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                      ))}
                    </select>
                  </FormField>
                </div>
                <div className="admin-grid-2">
                  <FormField label="Fecha inicio">
                    <input type="date" style={inputStyle} value={form.start_date} onChange={e => setField('start_date', e.target.value)}
                      onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
                      onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
                  </FormField>
                  <FormField label="Fecha fin">
                    <input type="date" style={inputStyle} value={form.end_date} onChange={e => setField('end_date', e.target.value)}
                      onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
                      onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
                  </FormField>
                </div>
                <div className="admin-grid-2">
                  <FormField label="Hora">
                    <input style={inputStyle} value={form.time} onChange={e => setField('time', e.target.value)}
                      onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
                      onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
                  </FormField>
                  <FormField label="Lugar">
                    <input style={inputStyle} value={form.location} onChange={e => setField('location', e.target.value)}
                      onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
                      onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
                  </FormField>
                </div>
                <FormField label="Descripción">
                  <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical', lineHeight: 1.6 }}
                    value={form.description} onChange={e => setField('description', e.target.value)}
                    onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
                </FormField>
                <FormField label="Texto de fechas" hint="Se auto-genera si se deja vacío.">
                  <input style={inputStyle} value={form.dates} placeholder={autoFillDates()}
                    onChange={e => setField('dates', e.target.value)}
                    onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
                </FormField>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.active} onChange={e => setField('active', e.target.checked)}
                      style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }} />
                    <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.88rem' }}>Activo</span>
                  </label>
                  <SaveButton state={saveState} onClick={handleSave} />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
