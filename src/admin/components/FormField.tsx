import React from 'react';

interface FormFieldProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
}

export default function FormField({ label, hint, children }: FormFieldProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
      <label style={{
        fontFamily: 'var(--font-body)',
        fontWeight: 700,
        fontSize: '0.72rem',
        color: 'var(--text-secondary)',
        textTransform: 'uppercase',
        letterSpacing: '0.09em',
      }}>
        {label}
      </label>
      {children}
      {hint && (
        <p style={{
          margin: 0,
          fontSize: '0.75rem',
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-body)',
        }}>
          {hint}
        </p>
      )}
    </div>
  );
}

export const inputStyle: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: '10px',
  border: '2px solid var(--border)',
  background: 'var(--bg-surface-low)',
  fontFamily: 'var(--font-body)',
  fontSize: '0.95rem',
  color: 'var(--text-primary)',
  outline: 'none',
  width: '100%',
  transition: 'border-color 0.15s',
};
