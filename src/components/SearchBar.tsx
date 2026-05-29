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
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={placeholder}
          className="search-bar-input"
        />
        <button type="submit" className="ai-btn-inline">✨ Buscar con IA</button>
      </div>
    </form>
  );
}
