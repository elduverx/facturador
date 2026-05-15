'use client';

import { useState, useEffect, useRef } from 'react';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
};

type Session = {
  id: string;
  title: string;
  updatedAt: string;
  _count?: {
    messages: number;
  };
};

export function AiChatInterface() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (currentSessionId) {
      fetchMessages(currentSessionId);
    } else {
      setMessages([]);
    }
  }, [currentSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/admin/ai/sessions');
      const data = await res.json();
      setSessions(data);
      if (data.length > 0 && !currentSessionId) {
        setCurrentSessionId(data[0].id);
      }
    } catch (err) {
      console.error('Error fetching sessions:', err);
    } finally {
      setSessionsLoading(false);
    }
  };

  const fetchMessages = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/ai/sessions/${id}`);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const createNewSession = async () => {
    try {
      const res = await fetch('/api/admin/ai/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Nueva conversación' }),
      });
      const data = await res.json();
      setSessions([data, ...sessions]);
      setCurrentSessionId(data.id);
    } catch (err) {
      console.error('Error creating session:', err);
    }
  };

  const deleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('¿Eliminar esta conversación?')) return;

    try {
      await fetch(`/api/admin/ai/sessions/${id}`, { method: 'DELETE' });
      setSessions(sessions.filter(s => s.id !== id));
      if (currentSessionId === id) {
        setCurrentSessionId(sessions.find(s => s.id !== id)?.id || null);
      }
    } catch (err) {
      console.error('Error deleting session:', err);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !currentSessionId || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      createdAt: new Date().toISOString(),
    };

    setMessages([...messages, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: currentSessionId, content: input }),
      });
      const data = await res.json();

      if (data.error) throw new Error(data.error);

      setMessages(prev => [...prev, data]);
      // Update session list to show latest update
      fetchSessions();
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Error al enviar mensaje');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[700px]">
      {/* Sidebar de Sesiones */}
      <div className="lg:col-span-1 pv-dark-panel rounded-xl border border-[#c8aa6a]/30 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-[#c8aa6a]/20 flex justify-between items-center">
          <h3 className="text-xs font-bold text-[#c8aa6a] uppercase tracking-widest">Conversaciones</h3>
          <button
            onClick={createNewSession}
            className="p-1.5 rounded-md hover:bg-[#c8aa6a]/20 text-[#ead9ad] transition-colors"
            title="Nueva conversación"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessionsLoading ? (
            <div className="p-4 text-center text-xs text-[#c8aa6a]/60">Cargando...</div>
          ) : sessions.length === 0 ? (
            <div className="p-4 text-center text-xs text-[#c8aa6a]/60">No hay conversaciones</div>
          ) : (
            sessions.map((s) => (
              <div
                key={s.id}
                onClick={() => setCurrentSessionId(s.id)}
                className={`group relative p-3 rounded-lg cursor-pointer transition-all ${
                  currentSessionId === s.id
                    ? 'bg-[#f8f1df] text-[var(--pv-navy)]'
                    : 'text-[#ead9ad] hover:bg-white/5'
                }`}
              >
                <div className="text-sm font-medium truncate pr-6">{s.title}</div>
                <div className={`text-[10px] mt-1 ${currentSessionId === s.id ? 'text-[var(--pv-navy)]/60' : 'text-[#c8aa6a]'}`}>
                  {new Date(s.updatedAt).toLocaleDateString()}
                </div>
                <button
                  onClick={(e) => deleteSession(s.id, e)}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity ${
                    currentSessionId === s.id ? 'text-[var(--pv-navy)] hover:bg-black/10' : 'text-red-400 hover:bg-red-500/10'
                  }`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Area de Chat */}
      <div className="lg:col-span-3 pv-dark-panel rounded-xl border border-[#c8aa6a]/30 flex flex-col overflow-hidden bg-[var(--pv-ink)]/50">
        {!currentSessionId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-[#c8aa6a]">
            <div className="pv-seal w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold mb-4 opacity-40">PV</div>
            <p className="text-sm">Selecciona o crea una conversación para empezar</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.length === 0 && (
                <div className="text-center py-10">
                  <div className="inline-block p-4 rounded-2xl bg-[#c8aa6a]/10 border border-[#c8aa6a]/20 text-[#ead9ad] max-w-md">
                    <p className="text-sm">Hola, soy tu asistente de PV Abogadas. Puedo ayudarte a revisar la agenda, verificar datos de clientes, gestionar expedientes y más.</p>
                    <p className="text-xs mt-2 text-[#c8aa6a]">¿En qué puedo ayudarte hoy?</p>
                  </div>
                </div>
              )}
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl p-4 ${
                    m.role === 'user'
                      ? 'bg-[#f8f1df] text-[var(--pv-navy)] rounded-tr-none'
                      : 'bg-white/5 border border-[#c8aa6a]/20 text-[#f8f1df] rounded-tl-none'
                  }`}>
                    <div className="text-xs font-bold uppercase tracking-wider mb-1 opacity-60">
                      {m.role === 'user' ? 'Tú' : 'PV Assistant'}
                    </div>
                    <div className="text-sm whitespace-pre-wrap leading-relaxed">
                      {m.content}
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-[#c8aa6a]/20 rounded-2xl rounded-tl-none p-4 text-[#f8f1df]">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-[#c8aa6a] rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-[#c8aa6a] rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 bg-[#c8aa6a] rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="p-4 bg-black/20 border-t border-[#c8aa6a]/20">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Pregunta sobre la agenda, clientes o pide ayuda..."
                  className="flex-1 bg-white/5 border border-[#c8aa6a]/30 rounded-lg px-4 py-2.5 text-sm text-[#f8f1df] focus:outline-none focus:border-[#f8f1df] transition-colors"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="bg-[#f8f1df] text-[var(--pv-navy)] px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="m22 2-7 20-4-9-9-4Z" />
                    <path d="M22 2 11 13" />
                  </svg>
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
