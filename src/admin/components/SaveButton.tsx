export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

interface SaveButtonProps {
  state: SaveState;
  onClick: () => void;
  label?: string;
}

const CONFIG: Record<SaveState, { label: string; bg: string; color: string }> = {
  idle:   { label: 'Guardar cambios',   bg: 'var(--primary)',  color: '#000' },
  saving: { label: 'Guardando…',        bg: 'var(--border)',   color: 'var(--text-secondary)' },
  saved:  { label: '✓ Guardado',        bg: 'var(--primary)',  color: '#000' },
  error:  { label: 'Error al guardar',  bg: '#ef4444',         color: '#fff' },
};

export default function SaveButton({ state, onClick, label }: SaveButtonProps) {
  const cfg = CONFIG[state];
  return (
    <button
      onClick={onClick}
      disabled={state === 'saving'}
      style={{
        padding: '12px 28px',
        borderRadius: '12px',
        border: 'none',
        background: cfg.bg,
        color: cfg.color,
        fontFamily: 'var(--font-body)',
        fontWeight: 700,
        fontSize: '0.95rem',
        cursor: state === 'saving' ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s',
        whiteSpace: 'nowrap',
      }}
    >
      {label && state === 'idle' ? label : cfg.label}
    </button>
  );
}
