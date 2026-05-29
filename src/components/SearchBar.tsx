import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface SearchBarProps {
  placeholder?: string;
  initialValue?: string;
}

export default function SearchBar({ placeholder = 'Buscar tiendas, marcas...', initialValue = '' }: SearchBarProps) {
  const [query, setQuery] = useState(initialValue);
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) navigate(`/chat?q=${encodeURIComponent(query.trim())}`);
  };

return (
    <form onSubmit={handleSearch} className="search-bar-form">
      <div className="search-bar-inner">
        <span style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', paddingLeft: '4px' }}>🔍</span>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={placeholder}
          className="search-bar-input"
        />
        <button type="submit" className="ai-btn-inline">
          <span className="ai-btn-icon" style={{ fontSize: '1.2em' }}>✨</span>
          <span className="ai-btn-text">Buscar con IA</span>
        </button>
      </div>
    </form>
  );
}
