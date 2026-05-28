'use client';

import { useEffect, useMemo, useState } from 'react';
import { 
  AlertTriangle, 
  CalendarClock, 
  CreditCard, 
  FileText, 
  FolderKanban, 
  Plus, 
  Wand2, 
  Search, 
  ChevronRight, 
  Briefcase,
  AlertCircle,
  Clock,
  Euro,
  User,
  Activity
} from 'lucide-react';

type Matter = {
  id: string;
  reference: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientNie: string | null;
  title: string;
  procedureType: string;
  status: string;
  priority: string;
  responsible: string | null;
  summary: string | null;
  riskNotes: string | null;
  nextActionAt: string | null;
  deadlines: Deadline[];
  billingDocuments: BillingDocument[];
  _count?: { documents: number; timeline: number; deadlines: number };
};

type Deadline = {
  id: string;
  title: string;
  dueAt: string;
  status: string;
  kind: string;
  daysLeft?: number;
};

type BillingDocument = {
  id: string;
  type: string;
  status: string;
  concept: string;
  totalAmount: number;
  paidAmount: number;
};

type Template = {
  id: string;
  name: string;
  procedureType: string | null;
  description: string | null;
};

const statusLabels: Record<string, string> = {
  INITIAL: 'Fase inicial',
  IN_PROGRESS: 'En tramite',
  WAITING_ADMIN: 'Esperando administracion',
  RESOLVED: 'Resuelto',
  ARCHIVED: 'Archivado',
};

const priorityLabels: Record<string, string> = {
  LOW: 'Baja',
  NORMAL: 'Normal',
  HIGH: 'Alta',
  CRITICAL: 'Critica',
};

const money = (value: number) => value.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
const dateValue = (value: string | null) => (value ? value.split('T')[0] : '');

export default function ExpedientesPage() {
  const [matters, setMatters] = useState<Matter[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [draft, setDraft] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientNie: '',
    title: '',
    procedureType: 'Arraigo social',
    responsible: '',
    priority: 'NORMAL',
    summary: '',
  });
  const [deadlineDraft, setDeadlineDraft] = useState({ title: '', dueAt: '', kind: 'BUSINESS_DAYS', alertDays: '3' });
  const [billingDraft, setBillingDraft] = useState({
    type: 'INVOICE',
    concept: '',
    baseAmount: '',
    vatPercent: '21',
    irpfPercent: '0',
    expenseAmount: '0',
    dueAt: '',
  });
  const [templateId, setTemplateId] = useState('');
  const [generatedDocument, setGeneratedDocument] = useState('');

  const selectedMatter = useMemo(() => matters.find((matter) => matter.id === selectedId) || null, [matters, selectedId]);

  const loadMatters = async () => {
    const res = await fetch(`/api/admin/matters${search ? `?search=${encodeURIComponent(search)}` : ''}`);
    const data = await res.json();
    const next = Array.isArray(data) ? data : [];
    setMatters(next);
    if (!selectedId && next.length > 0) setSelectedId(next[0].id);
  };

  useEffect(() => {
    Promise.all([
      loadMatters(),
      fetch('/api/admin/document-templates').then((res) => res.json()).then((data) => {
        const next = Array.isArray(data) ? data : [];
        setTemplates(next);
        if (next[0]) setTemplateId(next[0].id);
      }),
    ]).finally(() => setLoading(false));
  }, []);

  const submitMatter = async () => {
    setMessage('');
    const res = await fetch('/api/admin/matters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data?.error || 'No se pudo crear el expediente.');
      return;
    }
    setDraft({ clientName: '', clientEmail: '', clientPhone: '', clientNie: '', title: '', procedureType: 'Arraigo social', responsible: '', priority: 'NORMAL', summary: '' });
    setSelectedId(data.id);
    await loadMatters();
    setMessage('Expediente creado.');
  };

  const updateMatter = async (updates: Record<string, unknown>) => {
    if (!selectedMatter) return;
    await fetch(`/api/admin/matters/${selectedMatter.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    await loadMatters();
  };

  const submitDeadline = async () => {
    if (!selectedMatter) return;
    const res = await fetch('/api/admin/deadlines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...deadlineDraft, matterId: selectedMatter.id, alertDays: Number(deadlineDraft.alertDays) }),
    });
    if (res.ok) {
      setDeadlineDraft({ title: '', dueAt: '', kind: 'BUSINESS_DAYS', alertDays: '3' });
      await loadMatters();
    }
  };

  const submitBilling = async () => {
    if (!selectedMatter) return;
    const res = await fetch('/api/admin/billing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...billingDraft,
        matterId: selectedMatter.id,
        baseAmount: Number(billingDraft.baseAmount || 0),
        vatPercent: Number(billingDraft.vatPercent || 0),
        irpfPercent: Number(billingDraft.irpfPercent || 0),
        expenseAmount: Number(billingDraft.expenseAmount || 0),
      }),
    });
    if (res.ok) {
      setBillingDraft({ type: 'INVOICE', concept: '', baseAmount: '', vatPercent: '21', irpfPercent: '0', expenseAmount: '0', dueAt: '' });
      await loadMatters();
    }
  };

  const generateDocument = async () => {
    if (!selectedMatter || !templateId) return;
    const res = await fetch('/api/admin/documents/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matterId: selectedMatter.id, templateId }),
    });
    const data = await res.json();
    if (res.ok) setGeneratedDocument(data.document || '');
  };

  const urgentDeadlines = matters.flatMap((matter) =>
    (matter.deadlines || [])
      .filter((deadline) => deadline.status === 'OPEN')
      .map((deadline) => ({ ...deadline, matter }))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-[var(--pv-gold)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with Stats */}
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold font-roman uppercase text-[var(--pv-ink)] tracking-tight">Gestión de Expedientes</h1>
          <p className="text-sm text-[var(--pv-navy)] opacity-60">Control total sobre plazos, finanzas y documentación procesal.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="neo-card !p-4 border-b-4 border-b-[var(--pv-gold)]">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[var(--pv-gold)]/10 text-[var(--pv-gold)] rounded-lg">
                <Briefcase size={18} />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-[var(--pv-gold)] tracking-widest">Activos</p>
                <p className="text-xl font-bold text-[var(--pv-ink)]">{matters.length}</p>
              </div>
            </div>
          </div>
          <div className="neo-card !p-4 border-b-4 border-b-amber-500">
             <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 text-amber-600 rounded-lg">
                <Clock size={18} />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-amber-600 tracking-widest">Alertas</p>
                <p className="text-xl font-bold text-[var(--pv-ink)]">{urgentDeadlines.length}</p>
              </div>
            </div>
          </div>
          <div className="hidden sm:block neo-card !p-4 border-b-4 border-b-emerald-500">
             <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg">
                <Euro size={18} />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-emerald-600 tracking-widest">Pipeline</p>
                <p className="text-xl font-bold text-[var(--pv-ink)]">
                  {Math.round(matters.reduce((sum, matter) => sum + (matter.billingDocuments || []).reduce((inner, doc) => inner + doc.totalAmount, 0), 0) / 1000)}k
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-8">
        <div className="space-y-6">
          {/* Create New Matter */}
          <div className="neo-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-[var(--pv-gold)] text-white rounded-xl shadow-md">
                <Plus size={18} />
              </div>
              <h2 className="font-bold font-roman uppercase text-[var(--pv-ink)]">Nuevo Expediente</h2>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[var(--pv-gold)] uppercase tracking-widest ml-4">Cliente</label>
                <input className="neo-input" placeholder="Nombre completo" value={draft.clientName} onChange={(e) => setDraft({ ...draft, clientName: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[var(--pv-gold)] uppercase tracking-widest ml-4">Email</label>
                <input className="neo-input" placeholder="correo@ejemplo.com" value={draft.clientEmail} onChange={(e) => setDraft({ ...draft, clientEmail: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[var(--pv-gold)] uppercase tracking-widest ml-4">Teléfono</label>
                  <input className="neo-input" value={draft.clientPhone} onChange={(e) => setDraft({ ...draft, clientPhone: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[var(--pv-gold)] uppercase tracking-widest ml-4">Identificación</label>
                  <input className="neo-input" placeholder="NIE/Pas" value={draft.clientNie} onChange={(e) => setDraft({ ...draft, clientNie: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[var(--pv-gold)] uppercase tracking-widest ml-4">Título del Caso</label>
                <input className="neo-input" placeholder="Ej: Renovación Arraigo Marcus" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[var(--pv-gold)] uppercase tracking-widest ml-4">Trámite</label>
                  <select className="neo-input bg-white" value={draft.procedureType} onChange={(e) => setDraft({ ...draft, procedureType: e.target.value })}>
                    <option>Arraigo social</option>
                    <option>Arraigo laboral</option>
                    <option>Nacionalidad</option>
                    <option>Recurso extranjeria</option>
                    <option>Reagrupacion familiar</option>
                    <option>Asilo</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[var(--pv-gold)] uppercase tracking-widest ml-4">Prioridad</label>
                  <select className="neo-input bg-white" value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value })}>
                    {Object.entries(priorityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>
              </div>
              <button className="btn-roman w-full py-4 mt-4" onClick={submitMatter}>
                <Plus size={18} /> Abrir Expediente
              </button>
              {message && <p className="text-xs font-bold text-[var(--pv-gold)] text-center animate-pulse">{message}</p>}
            </div>
          </div>

          {/* Search and List */}
          <div className="neo-card !p-4">
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--pv-gold)]" size={18} />
              <input 
                className="neo-input pl-12" 
                placeholder="Buscar por referencia o nombre..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && loadMatters()} 
              />
            </div>
            
            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-2 custom-scrollbar">
              {matters.map((matter) => (
                <button
                  key={matter.id}
                  className={`w-full text-left rounded-xl border p-4 transition-all duration-300 ${
                    selectedId === matter.id 
                      ? 'bg-[var(--pv-gold)] text-white shadow-lg border-[var(--pv-gold)]' 
                      : 'bg-white/50 border-white/20 hover:bg-white hover:shadow-md'
                  }`}
                  onClick={() => setSelectedId(matter.id)}
                >
                  <div className={`text-[9px] font-bold uppercase tracking-[0.2em] ${selectedId === matter.id ? 'text-white/80' : 'text-[var(--pv-gold)]'}`}>
                    {matter.reference}
                  </div>
                  <div className={`font-bold text-sm mt-1 truncate ${selectedId === matter.id ? 'text-white' : 'text-[var(--pv-ink)]'}`}>
                    {matter.title}
                  </div>
                  <div className={`flex items-center justify-between mt-3 text-[10px] font-medium ${selectedId === matter.id ? 'text-white/70' : 'text-[var(--pv-navy)] opacity-50'}`}>
                    <span>{matter.clientName}</span>
                    <span className={`px-2 py-0.5 rounded uppercase ${selectedId === matter.id ? 'bg-white/20' : 'bg-[var(--pv-gold)]/10 text-[var(--pv-gold)]'}`}>
                      {matter.procedureType}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {!selectedMatter ? (
          <div className="neo-card flex flex-col items-center justify-center py-32 text-center">
             <div className="w-20 h-20 bg-[var(--pv-marble)] rounded-full flex items-center justify-center mb-6 shadow-inner">
                <FolderKanban size={40} className="text-[var(--pv-gold)] opacity-30" />
              </div>
              <h3 className="text-xl font-roman uppercase text-[var(--pv-navy)] mb-2">Seleccione un Expediente</h3>
              <p className="text-sm text-[var(--pv-navy)] opacity-40 max-w-xs">Elija un caso de la lista lateral para gestionar plazos, documentación y facturación asociada.</p>
          </div>
        ) : (
          <div className="space-y-8 animate-fade-in">
            {/* Matter Overview */}
            <div className="neo-card !p-4 lg:!p-6 border-l-8 border-l-[var(--pv-gold)]">
              <div className="flex flex-wrap items-start justify-between gap-6 mb-8">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--pv-gold)] mb-1">
                    EXPEDIENTE {selectedMatter.reference}
                  </div>
                  <h2 className="text-3xl font-bold text-[var(--pv-ink)] font-roman uppercase tracking-tight">{selectedMatter.title}</h2>
                  <div className="flex items-center gap-4 mt-3 text-sm text-[var(--pv-navy)] opacity-70">
                    <span className="flex items-center gap-1.5 font-bold"><User size={14} className="text-[var(--pv-gold)]" /> {selectedMatter.clientName}</span>
                    <span className="opacity-30">|</span>
                    <span className="font-medium">{selectedMatter.clientEmail}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <div className="space-y-1">
                     <label className="text-[9px] font-bold text-[var(--pv-gold)] uppercase tracking-widest block ml-2">Estado Procesal</label>
                     <select className="neo-input !py-2 !text-xs bg-white w-48" value={selectedMatter.status} onChange={(e) => updateMatter({ status: e.target.value, timelineTitle: 'Cambio de estado', timelineContent: statusLabels[e.target.value] })}>
                        {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                     </select>
                  </div>
                  <div className="space-y-1">
                     <label className="text-[9px] font-bold text-[var(--pv-gold)] uppercase tracking-widest block ml-2">Prioridad</label>
                     <select className="neo-input !py-2 !text-xs bg-white w-32" value={selectedMatter.priority} onChange={(e) => updateMatter({ priority: e.target.value })}>
                        {Object.entries(priorityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                     </select>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="p-5 rounded-2xl bg-[var(--pv-marble)] shadow-inner flex items-center gap-4">
                  <div className="p-3 bg-white rounded-xl shadow-sm text-[var(--pv-gold)]">
                     <Activity size={20} />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-[var(--pv-gold)] tracking-widest">Estado</div>
                    <div className="font-bold text-[var(--pv-ink)]">{statusLabels[selectedMatter.status] || selectedMatter.status}</div>
                  </div>
                </div>
                <div className="p-5 rounded-2xl bg-[var(--pv-marble)] shadow-inner flex items-center gap-4">
                  <div className="p-3 bg-white rounded-xl shadow-sm text-[var(--pv-navy)]">
                     <User size={20} />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-[var(--pv-gold)] tracking-widest">Responsable</div>
                    <div className="font-bold text-[var(--pv-ink)]">{selectedMatter.responsible || 'Por asignar'}</div>
                  </div>
                </div>
                <div className="p-5 rounded-2xl bg-[var(--pv-marble)] shadow-inner flex items-center gap-4">
                   <div className="p-3 bg-white rounded-xl shadow-sm text-amber-600">
                     <CalendarClock size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] uppercase font-bold text-[var(--pv-gold)] tracking-widest">Próxima Acción</div>
                    <input className="bg-transparent border-none outline-none font-bold text-[var(--pv-ink)] w-full cursor-pointer" type="date" value={dateValue(selectedMatter.nextActionAt)} onChange={(e) => updateMatter({ nextActionAt: e.target.value })} />
                  </div>
                </div>
              </div>

              <div className="mt-8 space-y-2">
                 <label className="text-[10px] font-bold text-[var(--pv-gold)] uppercase tracking-widest block ml-4">Resumen Ejecutivo y Notas de Estrategia</label>
                 <textarea 
                  className="neo-input !bg-white min-h-[120px] text-sm leading-relaxed" 
                  value={selectedMatter.summary || ''} 
                  onChange={(e) => updateMatter({ summary: e.target.value })} 
                  placeholder="Defina aquí la línea estratégica del caso y los puntos clave de la defensa..." 
                 />
              </div>
            </div>

            <div className="grid grid-cols-1 2xl:grid-cols-3 gap-8">
              {/* Deadlines Section */}
              <section className="neo-card !p-4 lg:!p-5">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-amber-500 text-white rounded-xl shadow-lg">
                    <CalendarClock size={20} />
                  </div>
                  <h3 className="font-bold font-roman uppercase text-[var(--pv-ink)]">Plazos Legales</h3>
                </div>
                
                <div className="space-y-3 mb-6 p-4 rounded-2xl bg-[var(--pv-marble)] shadow-inner">
                  <input className="neo-input !bg-white !py-2.5 !text-xs" placeholder="Concepto del plazo" value={deadlineDraft.title} onChange={(e) => setDeadlineDraft({ ...deadlineDraft, title: e.target.value })} />
                  <div className="grid grid-cols-2 gap-2">
                    <input className="neo-input !bg-white !py-2.5 !text-xs" type="date" value={deadlineDraft.dueAt} onChange={(e) => setDeadlineDraft({ ...deadlineDraft, dueAt: e.target.value })} />
                    <select className="neo-input !bg-white !py-2.5 !text-xs" value={deadlineDraft.kind} onChange={(e) => setDeadlineDraft({ ...deadlineDraft, kind: e.target.value })}>
                      <option value="BUSINESS_DAYS">Días Hábiles</option>
                      <option value="CALENDAR_DAYS">Naturales</option>
                    </select>
                  </div>
                  <button className="w-full py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest border border-amber-500 text-amber-600 hover:bg-amber-500 hover:text-white transition-all shadow-sm" onClick={submitDeadline}>
                    Registrar Vencimiento
                  </button>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {selectedMatter.deadlines?.length ? selectedMatter.deadlines.map((deadline) => {
                    const isOverdue = new Date(deadline.dueAt) < new Date();
                    return (
                      <div key={deadline.id} className={`p-4 rounded-2xl border transition-all duration-300 ${isOverdue ? 'bg-red-50 border-red-200 shadow-red-100' : 'bg-white border-white/50 shadow-sm'} hover:shadow-md`}>
                        <div className="flex items-center justify-between gap-3">
                          <span className={`text-sm font-bold ${isOverdue ? 'text-red-700' : 'text-[var(--pv-ink)]'}`}>{deadline.title}</span>
                          <AlertTriangle size={16} className={isOverdue ? 'text-red-600 animate-pulse' : 'text-amber-500'} />
                        </div>
                        <div className="flex items-center justify-between mt-3">
                           <span className="text-[10px] font-bold text-[var(--pv-navy)] opacity-40 uppercase">{dateValue(deadline.dueAt)}</span>
                           <span className={`text-[9px] font-bold px-2 py-1 rounded uppercase ${isOverdue ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                             {deadline.kind === 'BUSINESS_DAYS' ? 'Hábiles' : 'Naturales'}
                           </span>
                        </div>
                      </div>
                    );
                  }) : <p className="text-xs text-[var(--pv-navy)] opacity-40 text-center py-10">Sin plazos registrados.</p>}
                </div>
              </section>

              {/* Billing Section */}
              <section className="neo-card !p-4 lg:!p-5">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-lg">
                    <CreditCard size={20} />
                  </div>
                  <h3 className="font-bold font-roman uppercase text-[var(--pv-ink)]">Finanzas</h3>
                </div>

                <div className="space-y-3 mb-6 p-4 rounded-2xl bg-[var(--pv-marble)] shadow-inner">
                  <select className="neo-input !bg-white !py-2.5 !text-xs" value={billingDraft.type} onChange={(e) => setBillingDraft({ ...billingDraft, type: e.target.value })}>
                    <option value="INVOICE">Factura</option>
                    <option value="PROVISION">Provisión de Fondos</option>
                    <option value="EXPENSE">Suplido</option>
                    <option value="ENGAGEMENT_LETTER">Hoja de Encargo</option>
                    <option value="QUOTE">Presupuesto</option>
                  </select>
                  <input className="neo-input !bg-white !py-2.5 !text-xs" placeholder="Concepto" value={billingDraft.concept} onChange={(e) => setBillingDraft({ ...billingDraft, concept: e.target.value })} />
                  <div className="grid grid-cols-2 gap-2">
                    <input className="neo-input !bg-white !py-2.5 !text-xs" placeholder="Base €" value={billingDraft.baseAmount} onChange={(e) => setBillingDraft({ ...billingDraft, baseAmount: e.target.value })} />
                    <input className="neo-input !bg-white !py-2.5 !text-xs" placeholder="Gastos €" value={billingDraft.expenseAmount} onChange={(e) => setBillingDraft({ ...billingDraft, expenseAmount: e.target.value })} />
                  </div>
                  <button className="w-full py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest border border-emerald-500 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all shadow-sm" onClick={submitBilling}>
                    Generar Registro
                  </button>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {selectedMatter.billingDocuments?.length ? selectedMatter.billingDocuments.map((doc) => (
                    <div key={doc.id} className="p-4 rounded-2xl bg-white border border-white/50 shadow-sm hover:shadow-md transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-bold text-[var(--pv-ink)]">{doc.concept}</span>
                        <span className="text-xs font-black text-emerald-600">{money(doc.totalAmount)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                         <span className="text-[9px] font-bold text-[var(--pv-gold)] uppercase tracking-widest">{doc.type}</span>
                         <span className={`text-[9px] font-bold px-2 py-1 rounded uppercase ${doc.status === 'PAID' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                           {doc.status}
                         </span>
                      </div>
                    </div>
                  )) : <p className="text-xs text-[var(--pv-navy)] opacity-40 text-center py-10">Sin registros financieros.</p>}
                </div>
              </section>

              {/* Document Generation */}
              <section className="neo-card !p-4 lg:!p-5 border-2 border-[var(--pv-gold)]/20">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-[var(--pv-gold)] text-white rounded-xl shadow-lg">
                    <Wand2 size={20} />
                  </div>
                  <h3 className="font-bold font-roman uppercase text-[var(--pv-ink)]">Generador de Escritos</h3>
                </div>
                
                <div className="p-4 rounded-2xl bg-[var(--pv-marble)] shadow-inner mb-6 space-y-4">
                  <div>
                    <label className="text-[9px] font-bold text-[var(--pv-gold)] uppercase tracking-widest block mb-2 ml-2">Plantilla</label>
                    <select className="neo-input !bg-white !py-2.5 !text-xs" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
                      {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <button className="btn-roman w-full py-4 text-xs font-black uppercase tracking-[0.2em]" onClick={generateDocument}>
                    <FileText size={18} /> Redactar Documento
                  </button>
                </div>

                {generatedDocument && (
                  <div className="animate-fade-in">
                    <label className="text-[9px] font-bold text-[var(--pv-gold)] uppercase tracking-widest block mb-2 ml-2">Borrador Generado</label>
                    <textarea 
                      className="neo-input !bg-white !text-[10px] min-h-[300px] font-mono leading-relaxed p-6" 
                      value={generatedDocument} 
                      onChange={(e) => setGeneratedDocument(e.target.value)} 
                    />
                    <div className="mt-4 flex gap-2">
                       <button className="flex-1 py-3 rounded-xl font-bold text-xs bg-[var(--pv-ink)] text-white hover:bg-[var(--pv-navy)] transition-all shadow-lg">Descargar Word</button>
                       <button className="flex-1 py-3 rounded-xl font-bold text-xs border border-[var(--pv-gold)] text-[var(--pv-gold)] hover:bg-[var(--pv-gold)] hover:text-white transition-all">Firmar Digitalmente</button>
                    </div>
                  </div>
                )}
              </section>
            </div>

            {/* Risk & Traceability */}
            <div className="neo-card !p-4 lg:!p-6 bg-gradient-to-br from-white to-[var(--pv-marble)] border-none shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-red-600 text-white rounded-xl shadow-lg">
                  <AlertCircle size={22} />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-roman uppercase text-[var(--pv-ink)]">Riesgos y Trazabilidad Procesal</h3>
                  <p className="text-xs text-[var(--pv-navy)] opacity-40">Identificación de puntos críticos, advertencias de caducidad y pruebas clave.</p>
                </div>
              </div>
              <textarea 
                className="neo-input !bg-white min-h-[120px] text-sm border-2 border-red-100 focus:border-red-300" 
                value={selectedMatter.riskNotes || ''} 
                onChange={(e) => updateMatter({ riskNotes: e.target.value })} 
                placeholder="Indique aquí cualquier riesgo de inadmisión, falta de pruebas o plazos de prescripción inminentes..." 
              />
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.6s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--pv-gold);
          border-radius: 10px;
          opacity: 0.3;
        }
      `}</style>
    </div>
  );
}
