import { useState } from 'react';
import SearchBar from '../components/SearchBar';

type EventType = 'moda' | 'musica' | 'belleza' | 'comida' | 'familia';

interface MallEvent {
  id: string;
  title: string;
  dates: string;
  time: string;
  location: string;
  description: string;
  type: EventType;
  isToday?: boolean;
}

const TYPE_CONFIG: Record<EventType, { color: string; bg: string; label: string }> = {
  moda:    { color: '#000', bg: 'var(--primary)',   label: 'Moda'    },
  musica:  { color: '#000', bg: 'var(--tertiary)',  label: 'Música'  },
  belleza: { color: '#fff', bg: 'var(--secondary)', label: 'Belleza' },
  comida:  { color: '#fff', bg: '#f97316',          label: 'Comida'  },
  familia: { color: '#fff', bg: '#8b5cf6',          label: 'Familia' },
};

const FILTER_TABS: { key: EventType | 'all'; label: string }[] = [
  { key: 'all',     label: 'Todos'   },
  { key: 'moda',    label: 'Moda'    },
  { key: 'musica',  label: 'Música'  },
  { key: 'belleza', label: 'Belleza' },
  { key: 'comida',  label: 'Comida'  },
  { key: 'familia', label: 'Familia' },
];

const TODAY_EVENTS: MallEvent[] = [
  {
    id: 't1',
    title: 'Fashion Friday – Descuentos en Moda',
    dates: 'Hoy, 16 mayo',
    time: '10:00 AM – 9:00 PM',
    location: 'Nivel 1 – Plazoleta Central',
    description: 'Presentaciones en vivo de las últimas tendencias con más de 15 tiendas participantes. Descuentos exclusivos hasta 40% off.',
    type: 'moda',
    isToday: true,
  },
  {
    id: 't2',
    title: 'Festival Gastronómico',
    dates: 'Hoy, 16 mayo',
    time: '12:00 PM – 8:00 PM',
    location: 'Nivel 2 – Zona de Comer',
    description: 'Degustaciones gratuitas, chef invitado y música en vivo. Más de 10 restaurantes con menús especiales del día.',
    type: 'comida',
    isToday: true,
  },
];

const UPCOMING_EVENTS: MallEvent[] = [
  {
    id: 'u1',
    title: 'Noche de Jazz en Altaplaza',
    dates: '17 mayo',
    time: '7:00 PM – 10:00 PM',
    location: 'Nivel 1 – Atrio Principal',
    description: 'Una noche especial con el cuarteto de jazz Panamá Blue. Entrada libre para todos los visitantes del mall.',
    type: 'musica',
  },
  {
    id: 'u2',
    title: 'Expo Belleza & Bienestar',
    dates: '18–19 mayo',
    time: '11:00 AM – 7:00 PM',
    location: 'Nivel 3 – Salón Élite',
    description: 'Muestras de productos, asesoría de imagen gratuita y sorteos. Participa con la compra de cualquier producto de belleza.',
    type: 'belleza',
  },
  {
    id: 'u3',
    title: 'Día de la Familia – Actividades Infantiles',
    dates: '24–25 mayo',
    time: '10:00 AM – 6:00 PM',
    location: 'Nivel 1 – Zona Kids',
    description: 'Pintacaritas, globoflexia, área de juegos inflables y show de payasos. Una experiencia que toda la familia disfrutará.',
    type: 'familia',
  },
  {
    id: 'u4',
    title: 'Semana de la Moda Sostenible',
    dates: '26–31 mayo',
    time: 'Todo el día',
    location: 'Todo el mall',
    description: 'Tiendas participantes con colecciones eco-friendly, talleres de reciclaje de ropa y puntos de canje de prendas usadas.',
    type: 'moda',
  },
  {
    id: 'u5',
    title: 'Concierto Acústico – Artistas Locales',
    dates: '30 mayo',
    time: '6:00 PM – 9:00 PM',
    location: 'Nivel 2 – Plazoleta Sur',
    description: 'Tres artistas panameños en un set íntimo y acústico. Entrada libre. Sillas disponibles por orden de llegada.',
    type: 'musica',
  },
];

export default function EventosScreen() {
  const [filter, setFilter] = useState<EventType | 'all'>('all');

  const matches = (e: MallEvent) => filter === 'all' || e.type === filter;
  const todayVisible   = TODAY_EVENTS.filter(matches);
  const upcomingVisible = UPCOMING_EVENTS.filter(matches);

  return (
    <div className="screen-container animate-fade">
      <div className="header">
        <h1 className="glow-primary" style={{ fontSize: '1.8rem' }}>EVENTOS</h1>
        <SearchBar />
      </div>

      <div className="content" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Filter chips */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {FILTER_TABS.map(t => {
            const cfg = t.key !== 'all' ? TYPE_CONFIG[t.key] : null;
            const active = filter === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setFilter(t.key)}
                style={{
                  padding: '8px 20px', borderRadius: '999px', cursor: 'pointer',
                  border: `2px solid ${active ? (cfg?.bg ?? 'var(--primary)') : 'var(--border)'}`,
                  background: active ? (cfg?.bg ?? 'var(--primary)') : 'var(--bg-surface)',
                  fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.85rem',
                  color: active ? (cfg?.color ?? '#000') : 'var(--text-secondary)',
                  transition: 'all 0.15s',
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {todayVisible.length > 0 && (
          <div>
            <SectionLabel>Hoy</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {todayVisible.map(e => <EventCard key={e.id} event={e} />)}
            </div>
          </div>
        )}

        {upcomingVisible.length > 0 && (
          <div>
            <SectionLabel>Próximamente</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {upcomingVisible.map(e => <EventCard key={e.id} event={e} />)}
            </div>
          </div>
        )}

        {todayVisible.length === 0 && upcomingVisible.length === 0 && (
          <div className="flex-center" style={{ paddingTop: '80px' }}>
            <p style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>No hay eventos en esta categoría.</p>
          </div>
        )}

      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
      {children}
    </p>
  );
}

function EventCard({ event }: { event: MallEvent }) {
  const cfg = TYPE_CONFIG[event.type];
  return (
    <div style={{
      backgroundColor: 'var(--bg-surface)',
      border: '2px solid var(--border)',
      borderRadius: '20px',
      overflow: 'hidden',
      display: 'flex',
    }}>
      <div style={{ width: '6px', backgroundColor: cfg.bg, flexShrink: 0 }} />
      <div style={{ flex: 1, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              backgroundColor: cfg.bg, color: cfg.color,
              fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.7rem',
              textTransform: 'uppercase', letterSpacing: '0.1em',
              padding: '3px 10px', borderRadius: '999px',
            }}>{cfg.label}</span>
            {event.isToday && (
              <span style={{
                backgroundColor: 'rgba(204,255,0,0.15)', color: 'var(--text-primary)',
                border: '1.5px solid var(--primary)',
                fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.7rem',
                textTransform: 'uppercase', letterSpacing: '0.1em',
                padding: '3px 10px', borderRadius: '999px',
              }}>HOY</span>
            )}
          </div>
          <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            {event.dates}
          </span>
        </div>
        <p className="font-headline" style={{ fontSize: '1.35rem', color: 'var(--text-primary)', margin: 0 }}>{event.title}</p>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0, lineHeight: 1.5, fontWeight: 500 }}>{event.description}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '4px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>📍 {event.location}</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>🕐 {event.time}</span>
        </div>
      </div>
    </div>
  );
}
