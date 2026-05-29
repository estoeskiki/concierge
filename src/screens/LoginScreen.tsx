import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function LoginScreen() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) setError(err.message);
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'var(--bg-page)', padding: '24px',
    }}>
      <div style={{
        width: '100%', maxWidth: '420px',
        backgroundColor: 'var(--bg-surface)',
        border: '2px solid var(--border)',
        borderRadius: '24px',
        padding: '48px 40px',
        display: 'flex', flexDirection: 'column', gap: '28px',
      }}>
        {/* Logo / Brand */}
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-headline)', fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.05em', margin: 0 }}>
            kiki
          </p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600, margin: '6px 0 0' }}>
            Portal de administración
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              style={{
                padding: '12px 16px',
                borderRadius: '12px',
                border: '2px solid var(--border)',
                background: 'var(--bg-surface-low)',
                fontFamily: 'var(--font-body)',
                fontSize: '1rem',
                color: 'var(--text-primary)',
                outline: 'none',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              style={{
                padding: '12px 16px',
                borderRadius: '12px',
                border: '2px solid var(--border)',
                background: 'var(--bg-surface-low)',
                fontFamily: 'var(--font-body)',
                fontSize: '1rem',
                color: 'var(--text-primary)',
                outline: 'none',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          {error && (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: '#ef4444', fontWeight: 600, margin: 0 }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '4px',
              padding: '14px',
              borderRadius: '12px',
              border: 'none',
              background: loading ? 'var(--border)' : 'var(--primary)',
              fontFamily: 'var(--font-body)',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              color: '#000',
              transition: 'all 0.15s',
            }}
          >
            {loading ? 'Iniciando sesión…' : 'Iniciar sesión'}
          </button>
        </form>

        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center', margin: 0 }}>
          powered by <strong>kiki</strong>
        </p>
      </div>
    </div>
  );
}
