import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import StoreCard, { Store } from '../components/StoreCard';
import { supabase } from '../lib/supabase';
import { doSearch } from '../lib/search';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  stores?: Store[];
}

export default function ChatScreen() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialQuery = searchParams.get('q') || '';

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const hasFiredRef = useRef(false);

  // Handle Initial Query Escalation (Strict Mode safe)
  useEffect(() => {
    if (initialQuery && !hasFiredRef.current) {
      hasFiredRef.current = true;
      handleSend(initialQuery);
    }
  }, [initialQuery]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    // Add user message
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    console.group(`🔍 Búsqueda de Usuario: "${text}"`);
    console.time('Tiempo Total de Búsqueda');

    // 1. Try blazing fast local search first!
    console.log('[Tier 1] Ejecutando búsqueda local (MiniSearch)...');
    const localResults = doSearch(text);

    if (localResults.length > 0) {
      // We found a local match! Skip the AI and reply instantly.
      console.log(`[Tier 1] ✅ ¡Éxito! Se encontraron ${localResults.length} resultados locales exactos.`);
      const recommendedStores = localResults.map(res => res.store);

      // Simulate a tiny delay so it feels natural
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: `¡Claro! He encontrado estas opciones relacionadas con "${text}":`,
            stores: recommendedStores
          }
        ]);
        setIsTyping(false);
        console.timeEnd('Tiempo Total de Búsqueda');
        console.groupEnd();
      }, 300);
      return;
    }

    // 2. If no local match, call our live Supabase Edge Function (Semantic Search + LLM)
    console.log('[Tier 1] ❌ Sin resultados locales. Escalando a Búsqueda Semántica IA (Tier 2)...');
    try {
      // In a real app, mallId comes from the kiosk's auth/config context. Using a dummy UUID for the prototype.
      const dummyMallId = '11111111-1111-1111-1111-111111111111';

      console.time('Latencia Supabase Edge Function');
      console.log('[Tier 2] Llamando a Supabase Edge Function (Vector Search + Gemini)...');
      const { data, error } = await supabase.functions.invoke('chat', {
        body: { query: text, mallId: dummyMallId }
      });
      console.timeEnd('Latencia Supabase Edge Function');

      if (error) {
        throw new Error(error.message || "Error calling edge function");
      }

      // Fetch real stores from Supabase based on the IDs the AI returned
      let recommendedStores: Store[] = [];
      if (data.storeIds && data.storeIds.length > 0) {
        console.log(`[Tier 2] ✅ IA recomendó ${data.storeIds.length} tiendas. Obteniendo perfiles de base de datos...`);
        const { data: storesData } = await supabase
          .from('stores')
          .select('*')
          .in('id', data.storeIds);

        if (storesData) {
          recommendedStores = storesData;
        }
      } else {
        console.log('[Tier 2] ℹ️ La IA respondió pero no recomendó tiendas específicas.');
      }

      setMessages(prev => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'assistant', content: data.message, stores: recommendedStores }
      ]);

    } catch (err: any) {
      console.error('[Error de Chat] ->', err);
      setMessages(prev => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'assistant', content: `Error técnico: ${err.message || 'Desconocido'}` }
      ]);
    } finally {
      setIsTyping(false);
      console.timeEnd('Tiempo Total de Búsqueda');
      console.groupEnd();
    }
  };

  return (
    <div className="screen-container animate-fade">
      <header className="header" style={{ borderBottom: '2px solid var(--primary)' }}>
        <button
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', fontSize: '1.25rem', fontWeight: 700, cursor: 'pointer', color: 'var(--text-secondary)' }}
        >
          ← Volver
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '2rem' }}>✨</div>
          <h1 style={{ fontSize: '2rem' }}>Asistente Kiki</h1>
        </div>
        <div style={{ width: '80px' }}></div>
      </header>

      <main className="content" style={{ display: 'flex', flexDirection: 'column', padding: '0', backgroundColor: 'var(--bg-surface)' }}>

        {/* Chat History */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Welcome Message */}
          <div style={{ alignSelf: 'flex-start', maxWidth: '85%' }}>
            <div style={{ backgroundColor: 'var(--bg-surface-low)', padding: '16px 24px', borderRadius: '24px 24px 24px 4px', border: '1px solid var(--border)', fontSize: '1.25rem', lineHeight: '1.5' }}>
              Hola, soy la inteligencia artificial de Kiki. ¿En qué te puedo ayudar hoy?
            </div>
          </div>

          {messages.map(msg => (
            <div key={msg.id} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%', display: 'flex', flexDirection: 'column', gap: '12px' }}>

              <div style={{
                backgroundColor: msg.role === 'user' ? 'var(--primary)' : 'var(--bg-surface-low)',
                color: msg.role === 'user' ? '#000' : 'var(--text-primary)',
                padding: '16px 24px',
                borderRadius: msg.role === 'user' ? '24px 24px 4px 24px' : '24px 24px 24px 4px',
                border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none',
                fontSize: '1.25rem',
                lineHeight: '1.5',
                fontWeight: msg.role === 'user' ? 600 : 400
              }}>
                {msg.content}
              </div>

              {/* Render Recommended Stores */}
              {msg.stores && msg.stores.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                  {msg.stores.map(store => (
                    <StoreCard key={store.id} store={store} />
                  ))}
                </div>
              )}

            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div style={{ alignSelf: 'flex-start', backgroundColor: 'var(--bg-surface-low)', padding: '16px 24px', borderRadius: '24px 24px 24px 4px', border: '1px solid var(--border)' }}>
              <span className="typing-dots" style={{ fontSize: '1.5rem', color: 'var(--text-secondary)' }}>•••</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={{ padding: '24px', borderTop: '1px solid var(--border)', backgroundColor: 'var(--bg-page)' }}>
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
            style={{ display: 'flex', gap: '12px' }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pregúntame algo..."
              style={{
                flex: 1,
                padding: '20px 24px',
                fontSize: '1.25rem',
                borderRadius: '999px',
                border: '2px solid var(--border)',
                backgroundColor: 'var(--bg-surface)',
                outline: 'none',
                fontFamily: 'var(--font-body)'
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="btn-primary glow-primary"
              style={{ padding: '0 32px', opacity: (!input.trim() || isTyping) ? 0.5 : 1 }}
            >
              Enviar
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
