'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  MessageSquare, 
  Plus, 
  Trash2, 
  Send, 
  User, 
  Cpu, 
  Clock, 
  History,
  ShieldCheck,
  MoreVertical
} from 'lucide-react';

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
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (currentSessionId) {
      fetchMessages(currentSessionId);
      setMobileView('chat');
    } else {
      setMessages([]);
      setMobileView('list');
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
      // Solo seleccionar la primera sesión si no es móvil y hay sesiones
      if (data.length > 0 && !currentSessionId && typeof window !== 'undefined' && window.innerWidth > 1024) {
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
        body: JSON.stringify({ title: 'Nueva consulta imperial' }),
      });
      const data = await res.json();
      setSessions([data, ...sessions]);
      setCurrentSessionId(data.id);
      setMobileView('chat');
    } catch (err) {
      console.error('Error creating session:', err);
    }
  };

  const deleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('¿Eliminar esta conversación de los anales?')) return;

    try {
      await fetch(`/api/admin/ai/sessions/${id}`, { method: 'DELETE' });
      const nextSessions = sessions.filter(s => s.id !== id);
      setSessions(nextSessions);
      if (currentSessionId === id) {
        setCurrentSessionId(null);
        setMobileView('list');
      }
    } catch (err) {
      console.error('Error deleting session:', err);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
      // Refrescar sesiones para actualizar títulos/fechas
      fetchSessions();
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-0 h-[600px] lg:h-[700px] bg-white rounded-2xl overflow-hidden shadow-2xl">
      {/* Sessions Sidebar */}
      <div className={`lg:col-span-1 bg-[var(--pv-navy)] flex flex-col border-r border-white/10 ${mobileView === 'chat' ? 'hidden lg:flex' : 'flex'}`}>
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <History size={16} className="text-[var(--pv-gold)]" />
            <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Consultas</h3>
          </div>
          <button
            onClick={createNewSession}
            className="p-2 rounded-xl bg-white/10 hover:bg-[var(--pv-gold)] text-white transition-all shadow-lg"
            title="Nueva Sesión"
          >
            <Plus size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar-dark">
          {sessionsLoading ? (
            <div className="p-10 text-center flex flex-col items-center gap-4">
               <div className="w-6 h-6 border-2 border-[var(--pv-gold)] border-t-transparent rounded-full animate-spin"></div>
               <p className="text-[10px] font-bold text-[var(--pv-gold)] uppercase tracking-widest animate-pulse">Abriendo Pergaminos...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-10 text-center opacity-40">
               <MessageSquare size={32} className="mx-auto text-white mb-4" />
               <p className="text-xs text-white font-medium">Sin historial</p>
            </div>
          ) : (
            sessions.map((s) => (
              <div
                key={s.id}
                onClick={() => setCurrentSessionId(s.id)}
                className={`group relative p-4 rounded-2xl cursor-pointer transition-all duration-300 border ${
                  currentSessionId === s.id
                    ? 'bg-[var(--pv-gold)] border-[var(--pv-gold)] shadow-xl translate-x-1'
                    : 'bg-white/5 border-transparent hover:bg-white/10'
                }`}
              >
                <div className={`text-xs font-bold truncate pr-6 ${currentSessionId === s.id ? 'text-white' : 'text-white/80'}`}>
                  {s.title}
                </div>
                <div className={`flex items-center gap-2 text-[9px] font-black uppercase tracking-tighter mt-2 ${currentSessionId === s.id ? 'text-white/60' : 'text-[var(--pv-gold)]'}`}>
                  <Clock size={10} />
                  {new Date(s.updatedAt).toLocaleDateString()}
                </div>
                <button
                  onClick={(e) => deleteSession(s.id, e)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all ${
                    currentSessionId === s.id ? 'text-white/40 hover:text-white hover:bg-white/20' : 'text-red-400 hover:bg-red-500/20'
                  }`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`lg:col-span-3 flex flex-col bg-[var(--pv-marble)] relative overflow-hidden ${mobileView === 'list' ? 'hidden lg:flex' : 'flex'}`}>
        {/* Decorative Seal */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none">
           <ShieldCheck size={400} className="text-[var(--pv-navy)]" />
        </div>

        {!currentSessionId ? (
          <div className="flex-1 flex flex-col items-center justify-center p-10 lg:p-20 text-center z-10">
            <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-full bg-white shadow-2xl flex items-center justify-center mb-8 border border-[var(--pv-gold)]/20 animate-bounce-slow">
               <Cpu size={32} className="text-[var(--pv-gold)] lg:size-40" />
            </div>
            <h3 className="text-xl lg:text-2xl font-roman uppercase font-bold text-[var(--pv-ink)] mb-4">Inicie una Consulta</h3>
            <p className="text-sm text-[var(--pv-navy)] opacity-60 max-w-sm">Active el asistente de inteligencia artificial para analizar expedientes, verificar jurisprudencia o gestionar su agenda.</p>
            <button onClick={createNewSession} className="btn-roman mt-8 px-10 py-3.5">
               Nueva Conversación
            </button>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="h-16 bg-white/80 backdrop-blur-md border-b border-[var(--pv-gold)]/10 px-4 lg:px-8 flex items-center justify-between z-10 shadow-sm">
               <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setMobileView('list')}
                    className="lg:hidden p-2 rounded-xl bg-[var(--pv-marble)] text-[var(--pv-gold)]"
                  >
                    <History size={18} />
                  </button>
                  <div className="w-8 h-8 rounded-lg bg-[var(--pv-gold)] flex items-center justify-center text-white shadow-md hidden sm:flex">
                     <Sparkles size={16} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[10px] lg:text-xs font-black uppercase text-[var(--pv-ink)] tracking-widest truncate max-w-[150px] sm:max-w-none">
                      {sessions.find(s => s.id === currentSessionId)?.title || 'Asistente IA'}
                    </h4>
                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-600 uppercase tracking-tighter">
                       <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                       IA online
                    </div>
                  </div>
               </div>
               <button className="p-2 rounded-lg hover:bg-[var(--pv-marble)] text-[var(--pv-navy)] opacity-40">
                  <MoreVertical size={20} />
               </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-6 lg:space-y-8 custom-scrollbar z-10">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full opacity-20">
                   <MessageSquare size={64} className="text-[var(--pv-gold)] mb-4" />
                   <p className="font-roman text-lg uppercase font-bold">Sin mensajes aún</p>
                </div>
              )}
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                >
                  <div
                    className={`max-w-[85%] lg:max-w-[70%] rounded-3xl p-4 lg:p-6 shadow-xl ${
                      m.role === 'user'
                        ? 'bg-[var(--pv-gold)] text-white rounded-tr-none'
                        : 'bg-white text-[var(--pv-navy)] rounded-tl-none border border-white/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3 border-b border-black/5 pb-2">
                       <div className={`p-1.5 rounded-lg ${m.role === 'user' ? 'bg-white/20' : 'bg-[var(--pv-gold)]/10 text-[var(--pv-gold)]'}`}>
                          {m.role === 'user' ? <User size={12} /> : <Cpu size={12} />}
                       </div>
                       <span className="text-[9px] font-black uppercase tracking-widest opacity-60">
                          {m.role === 'user' ? 'Usuario' : 'IA'}
                       </span>
                    </div>
                    <p className="text-sm lg:text-base leading-relaxed whitespace-pre-wrap">{m.content}</p>
                    <div className="mt-4 text-[9px] font-bold opacity-30 text-right uppercase tracking-tighter">
                       {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start animate-pulse">
                   <div className="bg-white rounded-3xl p-6 shadow-lg rounded-tl-none border border-white/50 flex items-center gap-3">
                      <div className="w-2 h-2 bg-[var(--pv-gold)] rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-[var(--pv-gold)] rounded-full animate-bounce [animation-delay:0.2s]"></div>
                      <div className="w-2 h-2 bg-[var(--pv-gold)] rounded-full animate-bounce [animation-delay:0.4s]"></div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--pv-gold)] ml-2">Consultando IA...</span>
                   </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 lg:p-8 bg-white/50 backdrop-blur-md border-t border-[var(--pv-gold)]/10 z-10">
              <form onSubmit={handleSend} className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-2xl border border-[var(--pv-gold)]/10">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Redacte su consulta aquí..."
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm lg:text-base p-3 min-h-[44px] max-h-[150px] resize-none overflow-y-auto custom-scrollbar"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="w-12 h-12 rounded-xl bg-[var(--pv-gold)] text-white flex items-center justify-center shadow-xl shadow-[var(--pv-gold)]/20 hover:scale-105 active:scale-95 transition-all disabled:grayscale disabled:opacity-50"
                >
                  <Send size={20} />
                </button>
              </form>
              <p className="mt-3 text-[9px] font-bold text-center text-[var(--pv-navy)] opacity-30 uppercase tracking-[0.2em]">
                 Enter para enviar • Shift+Enter para nueva línea
              </p>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--pv-gold);
          border-radius: 10px;
        }
        .custom-scrollbar-dark::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar-dark::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar-dark::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
