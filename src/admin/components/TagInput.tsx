import { useState, KeyboardEvent } from 'react';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export default function TagInput({ tags, onChange, placeholder = 'Agregar…' }: TagInputProps) {
  const [input, setInput] = useState('');

  const add = () => {
    const val = input.trim();
    if (val && !tags.includes(val)) {
      onChange([...tags, val]);
    }
    setInput('');
  };

  const remove = (tag: string) => onChange(tags.filter(t => t !== tag));

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      add();
    } else if (e.key === 'Backspace' && !input && tags.length) {
      remove(tags[tags.length - 1]);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '6px',
      padding: '8px 12px',
      border: '2px solid var(--border)',
      borderRadius: '10px',
      background: 'var(--bg-surface-low)',
      cursor: 'text',
      minHeight: '44px',
      alignItems: 'center',
    }}>
      {tags.map(tag => (
        <span key={tag} style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '3px 10px',
          borderRadius: '20px',
          background: 'var(--border)',
          fontFamily: 'var(--font-body)',
          fontSize: '0.82rem',
          fontWeight: 600,
          color: 'var(--text-primary)',
        }}>
          {tag}
          <button
            onClick={() => remove(tag)}
            style={{
              background: 'none',
              border: 'none',
              padding: '0 0 0 2px',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              fontSize: '0.9rem',
              lineHeight: 1,
              fontWeight: 700,
            }}
          >
            ×
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKey}
        onBlur={add}
        placeholder={tags.length === 0 ? placeholder : ''}
        style={{
          flex: 1,
          minWidth: '120px',
          border: 'none',
          background: 'transparent',
          outline: 'none',
          fontFamily: 'var(--font-body)',
          fontSize: '0.95rem',
          color: 'var(--text-primary)',
          padding: '2px 0',
        }}
      />
    </div>
  );
}
