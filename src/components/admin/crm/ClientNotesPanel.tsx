'use client';

import { useEffect, useState } from 'react';
import { MessageSquare, PlusCircle, Check, ShieldAlert, Sparkles, Globe } from 'lucide-react';
import { formatDateShort } from '@/lib/constants';

interface ClientNotesPanelProps {
  clientEmail: string;
}

const NOTE_TEMPLATES = [
  'Presupuesto enviado, pendiente de confirmación.',
  'Pendiente de documentación.',
  'Documentación recibida, revisando.',
  'Hoja de encargo enviada.',
  'Cita de seguimiento programada.',
  'Caso en espera de respuesta del organismo.',
];

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
  IN_PROGRESS: 'bg-blue-100 text-blue-800 border-blue-200',
  WAITING: 'bg-orange-100 text-orange-800 border-orange-200',
  DONE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

export function ClientNotesPanel({ clientEmail }: ClientNotesPanelProps) {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [noteInput, setNoteInput] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/client-notes?email=${encodeURIComponent(clientEmail)}`);
      const data = await res.json();
      setNotes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNote = async () => {
    if (!noteInput.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/client-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: clientEmail,
          content: noteInput.trim(),
          status: 'PENDING',
          tags: [],
          isPublic: isPublic,
        }),
      });
      if (res.ok) {
        setNoteInput('');
        setIsPublic(false);
        await loadNotes();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (clientEmail) loadNotes();
  }, [clientEmail]);

  return (
    <div className="space-y-6">
      {/* Compose Area */}
      <div className="bg-[var(--pv-marble)]/50 rounded-2xl p-5 border border-[var(--pv-marble)] shadow-sm">
        <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--pv-ink)] mb-4 flex items-center gap-2">
          <MessageSquare size={16} className="text-[var(--pv-gold)]" />
          Nueva Nota o Notificación
        </h4>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {NOTE_TEMPLATES.map((t) => (
             <button 
                key={t} 
                onClick={() => setNoteInput(prev => prev ? `${prev}\n${t}` : t)}
                className="text-[9px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-lg bg-white border border-[var(--pv-gold)]/20 text-[var(--pv-navy)] hover:text-[var(--pv-gold)] hover:bg-[var(--pv-gold)]/10 transition-colors"
             >
               + {t.split(',')[0]}
             </button>
          ))}
        </div>

        <textarea
          className="neo-input !min-h-[100px] !text-sm"
          placeholder="Escribe la nota..."
          value={noteInput}
          onChange={(e) => setNoteInput(e.target.value)}
        />

        <div className="flex items-center justify-between mt-4">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input 
              type="checkbox" 
              className="peer sr-only"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
            <div className={`w-10 h-6 rounded-full transition-colors flex items-center px-1 ${isPublic ? 'bg-[var(--pv-gold)]' : 'bg-[var(--pv-navy)]/20'}`}>
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isPublic ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--pv-navy)] flex items-center gap-1.5">
              {isPublic ? (
                 <><Globe size={12} className="text-[var(--pv-gold)]" /> Visible en el portal del cliente</>
              ) : (
                 <><ShieldAlert size={12} className="opacity-50" /> Solo visible para el equipo interno</>
              )}
            </span>
          </label>

          <button 
            onClick={handleSaveNote}
            disabled={saving || !noteInput.trim()}
            className="btn-roman !py-2.5 !px-6 !text-[10px] disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar Nota'}
          </button>
        </div>
      </div>

      {/* Notes List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center text-xs text-[var(--pv-navy)]/50 font-bold uppercase tracking-widest animate-pulse">
            Cargando historial...
          </div>
        ) : notes.length === 0 ? (
          <div className="p-8 bg-white/50 rounded-2xl border-2 border-dashed border-[var(--pv-marble)] text-center">
            <MessageSquare size={24} className="mx-auto text-[var(--pv-navy)]/30 mb-2" />
            <div className="text-xs text-[var(--pv-navy)]/50 font-bold uppercase tracking-widest">
              No hay notas registradas
            </div>
          </div>
        ) : (
          notes.map((note) => (
             <div key={note.id} className="neo-card !p-5 bg-white group">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                     <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${STATUS_COLORS[note.status || 'PENDING']}`}>
                       {note.status === 'PENDING' ? 'Pendiente' : note.status}
                     </span>
                     {note.isPublic && (
                        <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-[var(--pv-gold)] bg-[var(--pv-gold)]/10 px-2 py-1 rounded-lg">
                           <Globe size={10} /> Publicada
                        </span>
                     )}
                     {note.tags?.includes('AUTO_CLAUDE') && (
                        <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-purple-600 bg-purple-50 px-2 py-1 rounded-lg">
                           <Sparkles size={10} /> IA Claude
                        </span>
                     )}
                  </div>
                  <div className="text-[10px] font-bold text-[var(--pv-navy)]/40 uppercase tracking-widest">
                    {formatDateShort(note.createdAt.split('T')[0])}
                  </div>
                </div>
                <p className="text-sm text-[var(--pv-ink)] whitespace-pre-wrap leading-relaxed font-medium">
                  {note.content}
                </p>
             </div>
          ))
        )}
      </div>
    </div>
  );
}
