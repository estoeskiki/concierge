import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface SearchBarProps {
  placeholder?: string;
  initialValue?: string;
}

export default function SearchBar({ placeholder, initialValue = '' }: SearchBarProps) {
  const [query, setQuery] = useState(initialValue);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) navigate(`/chat?q=${encodeURIComponent(query.trim())}`);
  };

  const currentPlaceholder = placeholder || (isMobile ? 'Buscar con IA...' : 'Buscar tiendas, marcas...');

  return (
    <form onSubmit={handleSearch} className="search-bar-form">
      <div className="search-bar-inner">
        <span style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', paddingLeft: '4px' }}>
          {isMobile ? '✨' : '🔍'}
        </span>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={currentPlaceholder}
          className="search-bar-input"
        />
        <button type="submit" className="ai-btn-inline">
          <span className="ai-btn-icon" style={{ fontSize: '1.2em' }}>
            {isMobile ? '🔍' : '✨'}
          </span>
          <span className="ai-btn-text">Buscar con IA</span>
        </button>
      </div>
    </form>
  );
}
