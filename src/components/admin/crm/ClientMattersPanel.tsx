'use client';

import { useEffect, useState } from 'react';
import { FolderKanban, PlusCircle, ArrowRight, ArrowLeft, Activity, CalendarClock, CreditCard, Euro } from 'lucide-react';
import { formatDateShort } from '@/lib/constants';

interface ClientInfo {
  name: string;
  email: string;
  phone: string;
  nie: string | null;
}

interface ClientMattersPanelProps {
  client: ClientInfo;
}

const statusLabels: Record<string, string> = {
  INITIAL: 'Fase inicial',
  IN_PROGRESS: 'En trámite',
  WAITING_ADMIN: 'Esperando administración',
  RESOLVED: 'Resuelto',
  ARCHIVED: 'Archivado',
};

const priorityLabels: Record<string, string> = {
  LOW: 'Baja',
  NORMAL: 'Normal',
  HIGH: 'Alta',
  CRITICAL: 'Crítica',
};

export function ClientMattersPanel({ client }: ClientMattersPanelProps) {
  const [matters, setMatters] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMatterId, setSelectedMatterId] = useState<string | null>(null);
  
  // Selected Matter State
  const [matterDetail, setMatterDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  
  // Timeline Note State
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // New Matter State
  const [isCreating, setIsCreating] = useState(false);
  const [newMatterDraft, setNewMatterDraft] = useState({ title: '', procedureType: 'Extranjería' });
  const [savingNew, setSavingNew] = useState(false);

  // New Deadline State
  const [isCreatingDeadline, setIsCreatingDeadline] = useState(false);
  const [deadlineDraft, setDeadlineDraft] = useState({ title: '', dueAt: '' });
  const [savingDeadline, setSavingDeadline] = useState(false);

  // New Billing State
  const [isCreatingBilling, setIsCreatingBilling] = useState(false);
  const [billingDraft, setBillingDraft] = useState({ concept: '', baseAmount: '' });
  const [savingBilling, setSavingBilling] = useState(false);

  const loadMatters = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/matters?clientEmail=${encodeURIComponent(client.email)}`);
      const data = await res.json();
      setMatters(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadMatterDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/matters/${id}`);
      const data = await res.json();
      if (res.ok) setMatterDetail(data);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    if (client.email) loadMatters();
  }, [client.email]);

  useEffect(() => {
    if (selectedMatterId) {
      loadMatterDetail(selectedMatterId);
    } else {
      setMatterDetail(null);
    }
  }, [selectedMatterId]);

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedMatterId) return;
    try {
      const res = await fetch(`/api/admin/matters/${selectedMatterId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus,
          timelineTitle: `Estado actualizado a: ${statusLabels[newStatus] || newStatus}`
        })
      });
      if (res.ok) {
        loadMatterDetail(selectedMatterId);
        loadMatters();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTimelineNote = async () => {
    if (!selectedMatterId || !noteTitle.trim()) return;
    setSavingNote(true);
    try {
      const res = await fetch(`/api/admin/matters/${selectedMatterId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timelineTitle: noteTitle,
          timelineContent: noteContent
        })
      });
      if (res.ok) {
        setNoteTitle('');
        setNoteContent('');
        loadMatterDetail(selectedMatterId);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingNote(false);
    }
  };

  const handleCreateMatter = async () => {
    if (!newMatterDraft.title.trim()) return;
    setSavingNew(true);
    try {
      const res = await fetch('/api/admin/matters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: client.name,
          clientEmail: client.email,
          clientPhone: client.phone,
          clientNie: client.nie,
          title: newMatterDraft.title,
          procedureType: newMatterDraft.procedureType,
          status: 'INITIAL',
          priority: 'NORMAL'
        })
      });
      if (res.ok) {
        setIsCreating(false);
        setNewMatterDraft({ title: '', procedureType: 'Extranjería' });
        loadMatters();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingNew(false);
    }
  };

  const handleCreateDeadline = async () => {
    if (!deadlineDraft.title.trim() || !deadlineDraft.dueAt || !selectedMatterId) return;
    setSavingDeadline(true);
    try {
      const res = await fetch('/api/admin/deadlines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matterId: selectedMatterId,
          title: deadlineDraft.title,
          dueAt: deadlineDraft.dueAt
        })
      });
      if (res.ok) {
        setIsCreatingDeadline(false);
        setDeadlineDraft({ title: '', dueAt: '' });
        loadMatterDetail(selectedMatterId);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingDeadline(false);
    }
  };

  const handleCreateBilling = async () => {
    if (!billingDraft.concept.trim() || !billingDraft.baseAmount || !selectedMatterId) return;
    setSavingBilling(true);
    try {
      const res = await fetch('/api/admin/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matterId: selectedMatterId,
          concept: billingDraft.concept,
          baseAmount: Number(billingDraft.baseAmount)
        })
      });
      if (res.ok) {
        setIsCreatingBilling(false);
        setBillingDraft({ concept: '', baseAmount: '' });
        loadMatterDetail(selectedMatterId);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingBilling(false);
    }
  };

  if (selectedMatterId) {
    return (
      <div className="space-y-4 animate-fade-in">
        <button 
          onClick={() => setSelectedMatterId(null)}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--pv-navy)]/60 hover:text-[var(--pv-gold)] transition-colors mb-2"
        >
          <ArrowLeft size={14} /> Volver a lista de expedientes
        </button>

        {detailLoading ? (
          <div className="p-12 text-center text-xs text-[var(--pv-navy)]/50 font-bold uppercase tracking-widest animate-pulse">
            Cargando expediente...
          </div>
        ) : matterDetail ? (
          <div className="space-y-6">
             {/* Header */}
             <div className="neo-card !p-6 bg-white border-t-4 border-t-[var(--pv-gold)] shadow-md">
                <div className="flex justify-between items-start mb-4">
                   <div>
                     <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--pv-gold)] mb-1">
                       {matterDetail.reference} • {matterDetail.procedureType}
                     </div>
                     <h2 className="font-roman text-2xl font-bold uppercase tracking-tight text-[var(--pv-ink)]">
                       {matterDetail.title}
                     </h2>
                   </div>
                   <select 
                     value={matterDetail.status}
                     onChange={(e) => handleUpdateStatus(e.target.value)}
                     className="neo-input !py-1.5 !px-3 !text-xs !bg-[var(--pv-marble)] cursor-pointer"
                   >
                     {Object.entries(statusLabels).map(([key, label]) => (
                       <option key={key} value={key}>{label}</option>
                     ))}
                   </select>
                </div>
                {matterDetail.summary && (
                  <p className="text-sm text-[var(--pv-navy)]/80 mt-4 leading-relaxed bg-[var(--pv-marble)]/30 p-4 rounded-xl border border-[var(--pv-marble)]">
                    {matterDetail.summary}
                  </p>
                )}
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Timeline */}
                <div className="neo-card !p-6 bg-white">
                   <h3 className="font-roman text-sm font-bold uppercase tracking-widest text-[var(--pv-ink)] flex items-center gap-2 mb-6">
                     <Activity size={16} className="text-[var(--pv-gold)]" />
                     Línea de Tiempo
                   </h3>
                   
                   <div className="space-y-4 mb-6">
                      <input 
                        type="text" 
                        placeholder="Título del avance..." 
                        value={noteTitle}
                        onChange={(e) => setNoteTitle(e.target.value)}
                        className="neo-input !py-2 !text-xs w-full"
                      />
                      <textarea 
                        placeholder="Detalles (opcional)..." 
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        className="neo-input !text-xs w-full min-h-[60px]"
                      />
                      <button 
                        onClick={handleAddTimelineNote}
                        disabled={savingNote || !noteTitle.trim()}
                        className="btn-roman w-full !py-2 !text-[10px] disabled:opacity-50"
                      >
                        Registrar Avance
                      </button>
                   </div>

                   <div className="space-y-4 border-l-2 border-[var(--pv-marble)] ml-2 pl-4">
                     {matterDetail.timeline?.map((item: any) => (
                       <div key={item.id} className="relative">
                         <div className="absolute -left-[23px] top-1 w-3 h-3 rounded-full bg-[var(--pv-gold)] shadow-[0_0_0_4px_white]"></div>
                         <div className="text-[10px] font-bold text-[var(--pv-navy)]/50 uppercase tracking-widest">
                           {formatDateShort(item.createdAt.split('T')[0])}
                         </div>
                         <h4 className="font-bold text-[var(--pv-ink)] text-sm mt-0.5">{item.title}</h4>
                         {item.content && (
                           <p className="text-xs text-[var(--pv-navy)]/70 mt-1">{item.content}</p>
                         )}
                       </div>
                     ))}
                   </div>
                </div>

                {/* Info & Deadlines */}
                <div className="space-y-6">
                   <div className="neo-card !p-5 bg-white">
                     <div className="flex justify-between items-center mb-4">
                       <h3 className="font-roman text-xs font-bold uppercase tracking-widest text-[var(--pv-ink)] flex items-center gap-2">
                         <CalendarClock size={14} className="text-[var(--pv-gold)]" />
                         Vencimientos
                       </h3>
                       {!isCreatingDeadline && (
                         <button 
                           onClick={() => setIsCreatingDeadline(true)}
                           className="text-[10px] font-bold uppercase text-[var(--pv-gold)] hover:text-amber-600 flex items-center gap-1"
                         >
                           <PlusCircle size={12} /> Añadir
                         </button>
                       )}
                     </div>

                     {isCreatingDeadline && (
                       <div className="bg-[var(--pv-marble)]/30 p-3 rounded-xl border border-[var(--pv-marble)] mb-4 space-y-3">
                         <input 
                           type="text" 
                           placeholder="Ej. Trámite audiencia..." 
                           value={deadlineDraft.title}
                           onChange={(e) => setDeadlineDraft(prev => ({ ...prev, title: e.target.value }))}
                           className="neo-input !py-1.5 !text-[10px] w-full"
                         />
                         <input 
                           type="date" 
                           value={deadlineDraft.dueAt}
                           onChange={(e) => setDeadlineDraft(prev => ({ ...prev, dueAt: e.target.value }))}
                           className="neo-input !py-1.5 !text-[10px] w-full"
                         />
                         <div className="flex gap-2">
                           <button 
                             onClick={handleCreateDeadline}
                             disabled={savingDeadline || !deadlineDraft.title.trim() || !deadlineDraft.dueAt}
                             className="btn-roman flex-1 !py-1.5 !text-[9px] disabled:opacity-50"
                           >
                             Guardar
                           </button>
                           <button 
                             onClick={() => setIsCreatingDeadline(false)}
                             className="btn-roman flex-1 !py-1.5 !text-[9px] !bg-white !text-[var(--pv-navy)] hover:!bg-stone-100 !border-transparent shadow-sm"
                           >
                             Cancelar
                           </button>
                         </div>
                       </div>
                     )}
                     {matterDetail.deadlines?.length === 0 ? (
                       <p className="text-xs text-[var(--pv-navy)]/50 italic">No hay vencimientos registrados.</p>
                     ) : (
                       <div className="space-y-3">
                         {matterDetail.deadlines?.map((dl: any) => (
                           <div key={dl.id} className="flex justify-between items-center p-3 rounded-xl bg-[var(--pv-marble)]/50 border border-[var(--pv-marble)]">
                             <div>
                               <h4 className="text-xs font-bold text-[var(--pv-ink)]">{dl.title}</h4>
                               <div className="text-[10px] font-bold text-[var(--pv-navy)]/60 uppercase tracking-widest">
                                 {formatDateShort(dl.dueAt.split('T')[0])}
                               </div>
                             </div>
                             <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 bg-white rounded shadow-sm border border-[var(--pv-marble)]">
                               {dl.status}
                             </span>
                           </div>
                         ))}
                       </div>
                     )}
                   </div>

                   <div className="neo-card !p-5 bg-white">
                     <div className="flex justify-between items-center mb-4">
                       <h3 className="font-roman text-xs font-bold uppercase tracking-widest text-[var(--pv-ink)] flex items-center gap-2">
                         <Euro size={14} className="text-[var(--pv-gold)]" />
                         Facturación
                       </h3>
                       {!isCreatingBilling && (
                         <button 
                           onClick={() => setIsCreatingBilling(true)}
                           className="text-[10px] font-bold uppercase text-[var(--pv-gold)] hover:text-amber-600 flex items-center gap-1"
                         >
                           <PlusCircle size={12} /> Añadir
                         </button>
                       )}
                     </div>

                     {isCreatingBilling && (
                       <div className="bg-[var(--pv-marble)]/30 p-3 rounded-xl border border-[var(--pv-marble)] mb-4 space-y-3">
                         <input 
                           type="text" 
                           placeholder="Concepto (ej. Provisión de fondos)..." 
                           value={billingDraft.concept}
                           onChange={(e) => setBillingDraft(prev => ({ ...prev, concept: e.target.value }))}
                           className="neo-input !py-1.5 !text-[10px] w-full"
                         />
                         <div className="relative">
                           <input 
                             type="number" 
                             placeholder="Importe base (sin IVA)..." 
                             value={billingDraft.baseAmount}
                             onChange={(e) => setBillingDraft(prev => ({ ...prev, baseAmount: e.target.value }))}
                             className="neo-input !py-1.5 !text-[10px] w-full pr-8"
                           />
                           <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[var(--pv-navy)]/40">€</span>
                         </div>
                         <div className="flex gap-2">
                           <button 
                             onClick={handleCreateBilling}
                             disabled={savingBilling || !billingDraft.concept.trim() || !billingDraft.baseAmount}
                             className="btn-roman flex-1 !py-1.5 !text-[9px] disabled:opacity-50"
                           >
                             Generar
                           </button>
                           <button 
                             onClick={() => setIsCreatingBilling(false)}
                             className="btn-roman flex-1 !py-1.5 !text-[9px] !bg-white !text-[var(--pv-navy)] hover:!bg-stone-100 !border-transparent shadow-sm"
                           >
                             Cancelar
                           </button>
                         </div>
                       </div>
                     )}
                     {matterDetail.billingDocuments?.length === 0 ? (
                       <p className="text-xs text-[var(--pv-navy)]/50 italic">No hay facturas vinculadas.</p>
                     ) : (
                       <div className="space-y-3">
                         {matterDetail.billingDocuments?.map((doc: any) => (
                           <div key={doc.id} className="flex justify-between items-center p-3 rounded-xl bg-[var(--pv-marble)]/50 border border-[var(--pv-marble)]">
                             <div>
                               <h4 className="text-xs font-bold text-[var(--pv-ink)]">{doc.concept}</h4>
                               <div className="text-[10px] font-bold text-[var(--pv-navy)]/60 uppercase tracking-widest">
                                 {doc.status}
                               </div>
                             </div>
                             <span className="text-xs font-black text-[var(--pv-gold)]">
                               {doc.totalAmount} €
                             </span>
                           </div>
                         ))}
                       </div>
                     )}
                   </div>
                </div>
             </div>
          </div>
        ) : (
          <div className="text-center text-red-500 text-xs py-10">Error cargando el expediente.</div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-[var(--pv-marble)] shadow-sm">
        <h3 className="font-roman text-sm font-bold uppercase tracking-widest text-[var(--pv-ink)] flex items-center gap-2">
          <FolderKanban size={16} className="text-[var(--pv-gold)]" />
          Expedientes Activos
        </h3>
        {!isCreating && (
          <button 
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--pv-gold)] hover:text-amber-600 transition-colors"
          >
            <PlusCircle size={16} />
            Nuevo
          </button>
        )}
      </div>

      {isCreating && (
        <div className="neo-card !p-5 bg-white border-t-4 border-t-[var(--pv-gold)] animate-fade-in">
          <h4 className="font-roman text-sm font-bold uppercase tracking-widest text-[var(--pv-ink)] mb-4">
            Aperturar Nuevo Expediente
          </h4>
          <div className="space-y-4">
             <div>
               <label className="block text-[10px] font-bold text-[var(--pv-navy)] uppercase tracking-widest mb-1.5">
                 Título del caso
               </label>
               <input 
                 type="text"
                 className="neo-input w-full !py-2 !text-xs"
                 placeholder="Ej. Nacionalidad por residencia..."
                 value={newMatterDraft.title}
                 onChange={(e) => setNewMatterDraft(prev => ({ ...prev, title: e.target.value }))}
               />
             </div>
             <div>
               <label className="block text-[10px] font-bold text-[var(--pv-navy)] uppercase tracking-widest mb-1.5">
                 Tipo de Trámite
               </label>
               <select 
                 className="neo-input w-full !py-2 !text-xs"
                 value={newMatterDraft.procedureType}
                 onChange={(e) => setNewMatterDraft(prev => ({ ...prev, procedureType: e.target.value }))}
               >
                 <option value="Extranjería">Extranjería</option>
                 <option value="Laboral">Laboral</option>
                 <option value="Familia">Familia</option>
                 <option value="Civil">Civil</option>
                 <option value="Penal">Penal</option>
               </select>
             </div>
             <div className="flex gap-3 pt-2">
                <button 
                  onClick={handleCreateMatter}
                  disabled={savingNew || !newMatterDraft.title.trim()}
                  className="btn-roman flex-1 !py-2 !text-[10px] disabled:opacity-50"
                >
                  {savingNew ? 'Guardando...' : 'Crear Expediente'}
                </button>
                <button 
                  onClick={() => setIsCreating(false)}
                  className="btn-roman flex-1 !py-2 !text-[10px] !bg-[var(--pv-marble)] !text-[var(--pv-navy)] hover:!bg-stone-200 !border-transparent"
                >
                  Cancelar
                </button>
             </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-xs text-[var(--pv-navy)]/50 font-bold uppercase tracking-widest animate-pulse">
          Cargando expedientes...
        </div>
      ) : matters.length === 0 ? (
        <div className="p-8 bg-white/50 rounded-2xl border-2 border-dashed border-[var(--pv-marble)] text-center">
          <FolderKanban size={24} className="mx-auto text-[var(--pv-navy)]/30 mb-2" />
          <div className="text-xs text-[var(--pv-navy)]/50 font-bold uppercase tracking-widest">
            Este cliente no tiene expedientes
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {matters.map((matter) => (
            <div 
              key={matter.id} 
              onClick={() => setSelectedMatterId(matter.id)}
              className="neo-card !p-5 bg-white group cursor-pointer hover:border-[var(--pv-gold)]/50 hover:shadow-lg transition-all"
            >
              <div className="flex justify-between items-start gap-4">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--pv-gold)] mb-1">
                    {matter.reference} • {matter.procedureType}
                  </div>
                  <h4 className="font-roman text-base font-bold text-[var(--pv-ink)] mb-2 group-hover:text-[var(--pv-gold)] transition-colors">
                    {matter.title}
                  </h4>
                  <div className="text-xs text-[var(--pv-navy)]/60 font-medium">
                    Creado el {formatDateShort(matter.createdAt.split('T')[0])}
                  </div>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-2">
                  <span className="px-3 py-1 bg-[var(--pv-marble)] rounded-lg text-[10px] font-bold text-[var(--pv-navy)] uppercase tracking-widest border border-[var(--pv-marble)] group-hover:border-[var(--pv-gold)]/20 transition-colors">
                    {statusLabels[matter.status] || matter.status}
                  </span>
                  <ArrowRight size={16} className="text-[var(--pv-gold)] opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0 mt-2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
