'use client';

import { useEffect, useState } from 'react';
import { STATUS_COLORS, STATUS_LABELS, formatDateShort } from '@/lib/constants';
import { CONSULTATION_DEPOSIT_AMOUNT, formatEuro } from '@/lib/payments';
import { isValidEmail, isValidPhone, normalizeEmail, normalizePhone } from '@/lib/validation';
import { ClientDocumentUploader, PublicDocument } from './ClientDocumentUploader';
import { 
  ShieldCheck, 
  Search, 
  CreditCard, 
  FileText, 
  Clock, 
  ChevronRight, 
  ChevronLeft,
  ArrowLeft,
  AlertCircle, 
  CheckCircle2, 
  Activity,
  History,
  Briefcase,
  CalendarPlus,
  Mail
} from 'lucide-react';

type PublicNote = {
  id: string;
  content: string;
  status: string;
  createdAt: string;
};

type PublicAppointment = {
  id: string;
  clientName?: string;
  clientNie?: string | null;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  paymentStatus: string;
  serviceName: string;
  price: number;
};

type PublicMatter = {
  id: string;
  reference: string;
  clientName: string;
  clientNie: string | null;
  title: string;
  procedureType: string;
  status: string;
  priority: string;
  openedAt: string;
  nextActionAt: string | null;
  summary: string | null;
  timeline: { id: string; title: string; content: string | null; createdAt: string }[];
  deadlines: { id: string; title: string; dueAt: string; kind: string }[];
  billingDocuments: {
    id: string;
    type: string;
    status: string;
    number: string | null;
    concept: string;
    totalAmount: number;
    paidAmount: number;
    dueAt: string | null;
  }[];
};

import { AppointmentDetail } from './AppointmentDetail';
import { MatterDetail } from './MatterDetail';

interface AppointmentLookupProps {
  compact?: boolean;
  glass?: boolean;
  appointmentId?: string;
  paymentSuccess?: boolean;
}

const statusLabels: Record<string, string> = {
  INITIAL: 'Fase inicial',
  IN_PROGRESS: 'En tramite',
  WAITING_ADMIN: 'Pendiente de respuesta',
  RESOLVED: 'Resuelto',
  ARCHIVED: 'Finalizado',
};

const noteStatusLabels: Record<string, string> = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En revision',
  WAITING: 'En espera',
  DONE: 'Completado',
};

export function AppointmentLookup({ compact = false, glass = false, appointmentId, paymentSuccess }: AppointmentLookupProps) {
  const [matterIdParam, setMatterIdParam] = useState<string | null>(null);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('matterId')) {
        setMatterIdParam(params.get('matterId'));
      }
    }
  }, []);

  const [email, setEmail] = useState('');
  const [nie, setNie] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<PublicAppointment[]>([]);
  const [notes, setNotes] = useState<PublicNote[]>([]);
  const [documents, setDocuments] = useState<PublicDocument[]>([]);
  const [matters, setMatters] = useState<PublicMatter[]>([]);
  const [paymentLinks, setPaymentLinks] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 4;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const [lastQuery, setLastQuery] = useState<{ email: string; nie: string } | null>(null);
  const [portalNotice, setPortalNotice] = useState('');
  const [sessionLoading, setSessionLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'menu' | 'case' | 'documents' | 'payments' | 'appointments'>('menu');

  const fetchAppointments = async (query: { email: string; nie: string }, nextPage: number) => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/appointments/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...query, page: nextPage, pageSize }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'No se pudo consultar sus registros');
      }
      const appointments = Array.isArray(data?.appointments) ? data.appointments : [];
      setResults(appointments);
      setNotes(Array.isArray(data?.notes) ? data.notes : []);
      setDocuments(Array.isArray(data?.documents) ? data.documents : []);
      setMatters(Array.isArray(data?.matters) ? data.matters : []);
      setPaymentLinks(Array.isArray(data?.paymentLinks) ? data.paymentLinks : []);
      setTotal(typeof data?.total === 'number' ? data.total : appointments.length);
      setPage(nextPage);
      setSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al consultar el portal');
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setResults([]);
    setNotes([]);
    setDocuments([]);
    setMatters([]);
    setPaymentLinks([]);
    setSearched(false);
    setTotal(0);

    const normalizedEmail = normalizeEmail(email);
    const normalizedNie = nie.trim().toUpperCase().replace(/\s+/g, '');

    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      setError('Email no válido');
      setSearched(true);
      return;
    }

    if (!normalizedNie || normalizedNie.length < 5) {
      setError('Documento de identidad no válido');
      setSearched(true);
      return;
    }

    const query = { email: normalizedEmail, nie: normalizedNie };
    setLastQuery(query);
    await fetchAppointments(query, 1);
  };

  const handlePay = async (appointmentId: string) => {
    window.location.href = `/api/payments/redsys?appointmentId=${appointmentId}`;
  };

  const handlePayLink = async (paymentLinkId: string) => {
    window.location.href = `/api/payments/redsys?paymentLinkId=${paymentLinkId}`;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');
    const appointmentIdParam = params.get('appointmentId');
    const documentIdParam = params.get('documentId');
    if (payment === 'success') {
      setPortalNotice('Pago recibido. Estamos actualizando el estado.');
      setTimeout(() => setPortalNotice(''), 3000);
    }
    if (payment === 'error') {
      setPortalNotice('El pago no se completo. Puedes intentarlo de nuevo desde la seccion de citas.');
      setTimeout(() => setPortalNotice(''), 3000);
    }

    let active = true;
    fetch('/api/portal/session')
      .then((res) => res.json())
      .then(async (data) => {
        if (!active) return;
        if (data?.authenticated && data.email) {
          if (payment === 'success') {
            await fetch('/api/payments/redsys/return-confirm', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                appointmentId: appointmentIdParam,
                documentId: documentIdParam,
                paymentLinkId: params.get('paymentLinkId'),
              }),
            }).catch(() => undefined);
          }

          if (!data.nie) return;

          const query = { email: normalizeEmail(data.email), nie: data.nie };
          setEmail(query.email);
          setNie(query.nie);
          setLastQuery(query);
          await fetchAppointments(query, 1);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setSessionLoading(false);
      });

    let initialTab: 'menu' | 'case' | 'documents' | 'payments' | 'appointments' = 'menu';
    if (window.location.hash) {
      const hash = window.location.hash.replace('#', '');
      if (['menu', 'case', 'documents', 'payments', 'appointments'].includes(hash)) {
        initialTab = hash as any;
      }
    } else if (documentIdParam) {
      initialTab = 'documents';
      window.history.replaceState(null, '', window.location.pathname + window.location.search + '#documents');
    } else if (payment && appointmentIdParam && !documentIdParam) {
      // Abre en pagos si hay un pago exitoso o erroneo de cita, para que pueda ver el pago o reintentarlo
      initialTab = 'payments';
      window.history.replaceState(null, '', window.location.pathname + window.location.search + '#payments');
    }
    setActiveTab(initialTab);

    const handlePopState = () => {
      if (window.location.hash) {
        const hash = window.location.hash.replace('#', '');
        if (['menu', 'case', 'documents', 'payments', 'appointments'].includes(hash)) {
          setActiveTab(hash as any);
        }
      } else {
        setActiveTab('menu');
      }
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      active = false;
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const changeTab = (tab: 'menu' | 'case' | 'documents' | 'payments' | 'appointments') => {
    setActiveTab(tab);
    if (tab === 'menu') {
      window.history.pushState(null, '', window.location.pathname + window.location.search);
    } else {
      window.history.pushState(null, '', `#${tab}`);
    }
  };

  const pendingPayments = results.filter((appt) => appt.paymentStatus !== 'PAID' && appt.status !== 'CANCELLED').length;
  const activeAppointments = results.filter((appt) => appt.status !== 'CANCELLED').length;
  const pendingMatterPayments = matters.reduce(
    (total, matter) => total + matter.billingDocuments.filter((doc: any) => doc.status !== 'PAID').length,
    0
  );
  const totalPending = pendingPayments + pendingMatterPayments + paymentLinks.length;
  const pendingBillingDocuments = matters.flatMap((matter) =>
    matter.billingDocuments
      .filter((document) => document.status !== 'PAID')
      .map((document) => ({ ...document, matterTitle: matter.title }))
  );
  const latestMatter = matters[0] || null;
  const knownClientName = latestMatter?.clientName || results[0]?.clientName || '';
  const knownClientNie = latestMatter?.clientNie || results[0]?.clientNie || '';
  const basePath = lastQuery
    ? `/reservar?portalBooking=1&email=${encodeURIComponent(lastQuery.email)}&name=${encodeURIComponent(knownClientName)}&nie=${encodeURIComponent(lastQuery.nie || knownClientNie || '')}`
    : '/reservar';
  const newAppointmentUrl = lastQuery ? `${basePath}&type=new` : '/reservar';
  const existingMatterAppointmentUrl = lastQuery ? `${basePath}&type=existing` : '/reservar';

  if (appointmentId) {
    return (
      <div className="max-w-2xl mx-auto w-full relative">
        <button onClick={() => window.location.href = '/portal'} className="absolute -top-12 left-0 flex items-center gap-2 text-[10px] font-bold text-white/50 hover:text-white uppercase tracking-widest transition-colors">
          <ArrowLeft size={14} /> Volver
        </button>
        <AppointmentDetail appointmentId={appointmentId} paymentSuccess={paymentSuccess} />
      </div>
    );
  }

  if (matterIdParam) {
    return (
      <div className="max-w-2xl mx-auto w-full relative">
        <button onClick={() => window.location.href = '/portal#case'} className="absolute -top-12 left-0 flex items-center gap-2 text-[10px] font-bold text-white/50 hover:text-white uppercase tracking-widest transition-colors">
          <ArrowLeft size={14} /> Volver
        </button>
        <MatterDetail matterId={matterIdParam} />
      </div>
    );
  }

  return (
    <div className={`${compact ? 'min-h-0 space-y-4' : 'space-y-8'} animate-fade-in ${glass ? 'theme-glass' : ''}`}>
      {portalNotice && (
        <div className={`p-4 rounded-xl font-bold border flex items-center gap-3 animate-fade-in ${portalNotice.includes('completo') ? 'bg-red-50 border-red-100 text-red-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
          {portalNotice.includes('completo') ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
          <span className="text-sm">{portalNotice}</span>
        </div>
      )}

      {/* Login / Access Form */}
      <div className="relative">

        {!searched || error || results.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] animate-fade-in-up">
              <div className="w-16 h-16 bg-[var(--pv-gold)] rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(196,161,115,0.3)]">
                <ShieldCheck size={32} className="text-white" />
              </div>
              <h1 className="font-roman text-3xl sm:text-4xl font-bold uppercase tracking-widest text-white mb-2 text-center">
                Mi Portal
              </h1>
              <p className="text-sm text-white/50 mb-10 text-center max-w-sm">
                Inicia sesión con tu email y documento de identidad para gestionar tu expediente.
              </p>
              
              <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black uppercase tracking-widest text-[var(--pv-gold)] ml-2">Email</label>
                   <input
                    type="email"
                    placeholder="ejemplo@correo.com"
                    className="w-full px-5 py-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder:text-gray-300 focus:border-[var(--pv-gold)] focus:ring-1 focus:ring-[var(--pv-gold)] outline-none transition-all"
                    value={email}
                    onChange={(e) => setEmail(normalizeEmail(e.target.value))}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black uppercase tracking-widest text-[var(--pv-gold)] ml-2">NIE / DNI / Pasaporte</label>
                   <input
                    type="text"
                    placeholder="Y1234567Z"
                    className="w-full px-5 py-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder:text-gray-300 focus:border-[var(--pv-gold)] focus:ring-1 focus:ring-[var(--pv-gold)] outline-none transition-all uppercase"
                    value={nie}
                    onChange={(e) => setNie(e.target.value)}
                    required
                  />
                </div>
                
                <button type="submit" className="w-full py-4 mt-6 rounded-2xl bg-[var(--pv-gold)] hover:bg-[#b8914b] text-white font-bold uppercase tracking-widest transition-colors" disabled={loading}>
                  {loading ? 'Accediendo...' : 'Entrar'}
                </button>
                <div className="mt-4 text-center">
                  <a href="/registro" className="text-[11px] font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors">
                    Crear cuenta
                  </a>
                </div>
              </form>
              
              {error && (
                <div className="mt-6 w-full max-w-sm p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold flex items-center gap-2 animate-shake">
                  <AlertCircle size={16} /> {error}
                </div>
              )}
            </div>
        ) : (
          <div className="hidden">
            {/* The old top bar showing email/user was removed to keep it clean */}
          </div>
        )}
      </div>

      {searched && !error && results.length === 0 && (
        <div className="w-full max-w-md mx-auto p-12 text-center border-2 border-dashed border-white/20 rounded-3xl animate-fade-in mt-12">
           <AlertCircle size={40} className="mx-auto text-white/30 mb-4" />
           <p className="text-sm font-bold text-white/50 uppercase tracking-widest">No encontramos registros con esos datos.</p>
           <button onClick={() => setSearched(false)} className="mt-6 text-xs text-[var(--pv-gold)] hover:text-white uppercase tracking-widest font-bold">Volver atrás</button>
        </div>
      )}

      {searched && (results.length > 0 || documents.length > 0 || matters.length > 0 || paymentLinks.length > 0) && lastQuery && (
        <div className="animate-fade-in mt-6 max-w-2xl mx-auto">
          
          {activeTab === 'menu' ? (
            <div className="flex flex-col gap-8 py-8 w-full">
              <button 
                onClick={() => changeTab('case')}
                className="flex items-center gap-4 w-full p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[var(--pv-gold)]/50 hover:translate-x-2 transition-all duration-300 group"
              >
                <div className="w-12 h-12 shrink-0 rounded-full bg-[var(--pv-gold)]/10 text-[var(--pv-gold)] flex items-center justify-center">
                  <Briefcase size={24} strokeWidth={1.5} />
                </div>
                <div>
                  <span className="font-roman text-[14px] sm:text-lg font-bold uppercase tracking-[0.15em] text-white">Estado del caso</span>
                </div>
              </button>

              <button 
                onClick={() => changeTab('documents')}
                className="flex items-center gap-4 w-full p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[var(--pv-gold)]/50 hover:translate-x-2 transition-all duration-300 group"
              >
                <div className="w-12 h-12 shrink-0 rounded-full bg-[var(--pv-gold)]/10 text-[var(--pv-gold)] flex items-center justify-center relative">
                  <FileText size={24} strokeWidth={1.5} />
                  {documents.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-blue-500 text-white w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold shadow-sm">
                      {documents.length}
                    </span>
                  )}
                </div>
                <div>
                  <span className="font-roman text-[14px] sm:text-lg font-bold uppercase tracking-[0.15em] text-white">Documentos</span>
                </div>
              </button>

              <button 
                onClick={() => changeTab('payments')}
                className="flex items-center gap-4 w-full p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[var(--pv-gold)]/50 hover:translate-x-2 transition-all duration-300 group"
              >
                <div className="w-12 h-12 shrink-0 rounded-full bg-[var(--pv-gold)]/10 text-[var(--pv-gold)] flex items-center justify-center relative">
                  <CreditCard size={24} strokeWidth={1.5} />
                  {totalPending > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-[#0f172a] text-white flex items-center justify-center text-[9px] font-black shadow-lg">
                      {totalPending}
                    </span>
                  )}
                </div>
                <div>
                  <span className="font-roman text-[14px] sm:text-lg font-bold uppercase tracking-[0.15em] text-white">Pagos Pendientes</span>
                </div>
              </button>

              <button 
                onClick={() => changeTab('appointments')}
                className="flex items-center gap-4 w-full p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[var(--pv-gold)]/50 hover:translate-x-2 transition-all duration-300 group"
              >
                <div className="w-12 h-12 shrink-0 rounded-full bg-[var(--pv-gold)]/10 text-[var(--pv-gold)] flex items-center justify-center relative">
                  <Clock size={24} strokeWidth={1.5} />
                  {activeAppointments > 0 && (
                    <span className="absolute -top-1 -right-1 bg-emerald-500 text-white w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold shadow-sm">
                      {activeAppointments}
                    </span>
                  )}
                </div>
                <div>
                  <span className="font-roman text-[14px] sm:text-lg font-bold uppercase tracking-[0.15em] text-white">Tus Citas</span>
                </div>
              </button>

              <div className="mt-8">
                <a href={matters.length > 0 ? existingMatterAppointmentUrl : newAppointmentUrl} className="w-full py-5 rounded-2xl bg-[#cba358] hover:bg-[#b8914b] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-3 transition-colors shadow-lg">
                  Nueva Cita <ChevronRight size={20} />
                </a>
              </div>
                
              <div className="mt-12 flex flex-col items-center gap-4 border-t border-white/10 pt-8">
                <a href="mailto:soporte@pvabogadas.es" className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-white/50 hover:text-white transition-colors">
                  <Mail size={14} /> Contactar Soporte
                </a>
                <button onClick={() => { setSearched(false); setEmail(''); setNie(''); fetch('/api/portal/session', { method: 'DELETE' }); }} className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-white/30 hover:text-white transition-colors">
                  Cerrar sesión
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full animate-fade-in">
              
              <button 
                onClick={() => changeTab('menu')}
                className="mb-8 inline-flex items-center gap-3 text-xs uppercase font-bold tracking-widest text-white/50 hover:text-[var(--pv-gold)] transition-colors py-2"
              >
                <ChevronLeft size={16} /> Volver al menú
              </button>

              {activeTab === 'case' && (
              <div className="animate-fade-in space-y-6">
                <h3 className="font-roman text-2xl font-bold uppercase tracking-widest text-white flex flex-wrap items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[var(--pv-gold)]/20 border border-[var(--pv-gold)]/50 text-[var(--pv-gold)] flex items-center justify-center">
                    <Briefcase size={22} />
                  </div>
                  Estado del Caso
                </h3>
                
                {latestMatter ? (
                  <div className="rounded-[2rem] bg-white/5 p-6 sm:p-8 border border-white/10 shadow-2xl backdrop-blur-sm">
                    <div className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--pv-gold)] mb-2">{latestMatter.reference}</div>
                    <div className="font-roman text-2xl sm:text-3xl font-bold uppercase text-white mb-4">{latestMatter.title}</div>
                    <div className="inline-flex rounded-xl bg-[var(--pv-gold)] px-4 py-2 text-xs font-black uppercase tracking-widest text-white shadow-lg">
                      {statusLabels[latestMatter.status] || latestMatter.status}
                    </div>
                    {latestMatter.summary && <p className="mt-6 text-sm sm:text-base leading-relaxed text-white/70">{latestMatter.summary}</p>}
                  </div>
                ) : (
                  <div className="rounded-[2rem] border-2 border-dashed border-white/20 p-8 text-center">
                    <p className="text-xs font-bold uppercase tracking-widest text-white/40">Todavía no hay expediente publicado.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="animate-fade-in space-y-6">
                <div className="mb-6">
                  <h3 className="font-roman text-2xl font-bold uppercase tracking-widest text-white flex flex-wrap items-center gap-4">
                     <div className="w-12 h-12 rounded-full bg-[var(--pv-gold)]/20 border border-[var(--pv-gold)]/50 text-[var(--pv-gold)] flex items-center justify-center">
                       <FileText size={22} />
                     </div>
                     Documentos
                  </h3>
                  <p className="text-xs text-white/50 mt-3 pl-16">Descarga los documentos, resoluciones o justificantes que te envíe la abogada.</p>
                </div>
               
                <div className="bg-white/5 backdrop-blur-sm rounded-[2rem] p-4 sm:p-6 border border-white/10 shadow-2xl">
                  <ClientDocumentUploader
                     documents={documents}
                     compact={false}
                   />
                </div>
              </div>
            )}

            {activeTab === 'payments' && (
              <div className="animate-fade-in space-y-6">
                <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-6">
                  <h3 className="font-roman text-2xl font-bold uppercase tracking-widest text-white flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[var(--pv-gold)]/20 border border-[var(--pv-gold)]/50 text-[var(--pv-gold)] flex items-center justify-center">
                      <CreditCard size={22} />
                    </div>
                    Pagos Pendientes
                  </h3>
                </div>
                
                {totalPending === 0 ? (
                  <div className="rounded-[2rem] bg-emerald-500/10 border border-emerald-500/30 p-10 text-center flex flex-col items-center justify-center">
                    <CheckCircle2 size={40} className="text-emerald-400 mb-4" />
                    <span className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-emerald-300">¡Todo al día!</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {results
                      .filter((appt) => appt.paymentStatus !== 'PAID' && appt.status !== 'CANCELLED')
                      .map((appt) => (
                        <div key={appt.id} className="rounded-2xl bg-white/5 backdrop-blur-sm border border-red-500/30 p-6 shadow-2xl relative overflow-hidden group hover:border-red-500/60 transition-colors">
                          <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/10 rounded-bl-full -z-10"></div>
                          <div className="text-[10px] font-black uppercase text-red-400 tracking-widest mb-2">Consulta</div>
                          <div className="font-bold text-sm sm:text-base text-white mb-4 line-clamp-1">{appt.serviceName}</div>
                          <div className="flex items-center justify-between mt-2">
                            <div className="text-2xl font-black text-[var(--pv-gold)]">{formatEuro(CONSULTATION_DEPOSIT_AMOUNT)}</div>
                            <button onClick={() => handlePay(appt.id)} className="py-2.5 px-6 rounded-xl text-[10px] uppercase font-bold tracking-widest bg-red-500 hover:bg-red-600 text-white transition-colors">
                              Pagar
                            </button>
                          </div>
                        </div>
                      ))}
                    
                    {pendingBillingDocuments.map((doc) => (
                      <div key={doc.id} className="rounded-2xl bg-white/5 backdrop-blur-sm border border-red-500/30 p-6 shadow-2xl relative overflow-hidden group hover:border-red-500/60 transition-colors">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/10 rounded-bl-full -z-10"></div>
                        <div className="text-[10px] font-black uppercase text-red-400 tracking-widest mb-2">Expediente</div>
                        <div className="font-bold text-sm sm:text-base text-white mb-1 truncate">{doc.concept}</div>
                        <div className="text-[10px] text-white/50 truncate mb-4">{doc.matterTitle}</div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="text-2xl font-black text-[var(--pv-gold)]">
                            {(doc.totalAmount - doc.paidAmount).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                          </div>
                          <button className="py-2.5 px-6 rounded-xl text-[10px] uppercase font-bold tracking-widest bg-white/10 hover:bg-white/20 text-white/50 cursor-not-allowed transition-colors">
                            Contactar
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    {paymentLinks.map((link) => (
                      <div key={link.id} className="rounded-2xl bg-white/5 backdrop-blur-sm border border-red-500/30 p-6 shadow-2xl relative overflow-hidden group hover:border-red-500/60 transition-colors">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/10 rounded-bl-full -z-10"></div>
                        <div className="text-[10px] font-black uppercase text-red-400 tracking-widest mb-2">Pago Pendiente</div>
                        <div className="font-bold text-sm sm:text-base text-white mb-1 truncate">{link.concept}</div>
                        {link.reference && <div className="text-[10px] text-white/50 truncate mb-4">Ref: {link.reference}</div>}
                        <div className="flex items-center justify-between mt-4">
                          <div className="text-2xl font-black text-[var(--pv-gold)]">
                            {link.amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                          </div>
                          <button onClick={() => handlePayLink(link.id)} className="py-2.5 px-6 rounded-xl text-[10px] uppercase font-bold tracking-widest bg-red-500 hover:bg-red-600 text-white transition-colors">
                            Pagar
                          </button>
                        </div>
                      </div>
                    ))}

                  </div>
                )}
              </div>
            )}

            {activeTab === 'appointments' && (
              <div className="animate-fade-in space-y-6">
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
                  <h3 className="font-roman text-2xl font-bold uppercase tracking-widest text-white flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[var(--pv-gold)]/20 border border-[var(--pv-gold)]/50 text-[var(--pv-gold)] flex items-center justify-center">
                      <Clock size={22} />
                    </div>
                    Próximas Citas
                  </h3>
                </div>
                
                {results.length === 0 ? (
                  <div className="rounded-[2rem] border-2 border-dashed border-white/20 p-10 text-center text-xs font-bold uppercase tracking-widest text-white/40">
                    No tienes citas registradas.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {results.map((appt) => {
                      const dateStr = appt.date.split('T')[0];
                      return (
                        <div key={appt.id} className="rounded-2xl border-l-4 border-l-[var(--pv-gold)] bg-white/5 backdrop-blur-sm p-6 shadow-2xl border border-white/10 transition-transform hover:scale-[1.02]">
                          <div className="flex justify-between items-start mb-4">
                            <div className="font-roman text-sm sm:text-base font-bold uppercase text-white pr-4">{appt.serviceName}</div>
                            <span className="shrink-0 text-[9px] font-black px-2 py-1.5 rounded-lg border border-white/20 uppercase tracking-widest bg-white/10 text-white">
                              {STATUS_LABELS[appt.status] || appt.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs font-bold text-white/70 uppercase tracking-widest bg-black/20 p-3 rounded-xl border border-white/5">
                            <Clock size={14} className="text-[var(--pv-gold)]" />
                            {formatDateShort(dateStr)} · {appt.startTime}
                          </div>
                          <div className="mt-4 pt-4 border-t border-white/10">
                            <a href={`?appointmentId=${appt.id}`} className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-white/5 hover:bg-white/10 text-[var(--pv-gold)] font-bold text-[10px] uppercase tracking-widest transition-colors">
                              Ver expediente de la cita <ChevronRight size={14} />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          </div>
          )}
        </div>
      )}

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
        .animate-fade-in {
          animation: fadeIn 0.6s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.4s ease-in-out; }
      `}</style>
    </div>
  );
}
