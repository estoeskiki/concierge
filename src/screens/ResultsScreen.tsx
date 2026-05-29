import { useMemo } from 'react';
import { useSearchParams, useNavigate, Navigate } from 'react-router-dom';
import { doSearch } from '../lib/search';
import StoreCard from '../components/StoreCard';

export default function ResultsScreen() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';

  const results = useMemo(() => {
    if (!query) return [];
    console.group(`[ResultsScreen] Procesando pantalla de resultados para: "${query}"`);
    const res = doSearch(query);
    return res;
  }, [query]);

  // Instantly skip this screen and go to the AI if there are 0 local matches
  if (query && results.length === 0) {
    console.warn(`[ResultsScreen] ⚠️ 0 resultados locales para "${query}". Disparando redirección inmediata al Chat (IA)...`);
    console.groupEnd();
    return <Navigate to={`/chat?q=${encodeURIComponent(query)}`} replace />;
  }

  // We are rendering local results
  if (query && results.length > 0) {
    console.log(`[ResultsScreen] Renderizando ${results.length} tarjetas de tiendas encontradas localmente.`);
    console.groupEnd();
  }

  return (
    <div className="screen-container animate-slide-up">
      <header className="header">
        <button 
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', fontSize: '1.25rem', fontWeight: 700, cursor: 'pointer', color: 'var(--text-secondary)' }}
        >
          ← Volver
        </button>
        <h1>KIKI</h1>
        <div style={{ width: '80px' }}></div> {/* Spacer for flex centering */}
      </header>

      <main className="content">
        <div style={{ marginBottom: '32px' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem', marginBottom: '8px' }}>
            Resultados para
          </p>
          <h2 style={{ fontSize: '3.5rem', color: 'var(--text-primary)' }}>
            "{query}"
          </h2>
        </div>

        {results.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
            {results.map((result, i) => (
              <StoreCard key={`${result.store.id}-${i}`} store={result.store} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
