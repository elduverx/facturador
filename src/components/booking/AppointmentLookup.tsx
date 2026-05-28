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
  AlertCircle, 
  CheckCircle2, 
  Activity,
  History,
  Briefcase,
  CalendarPlus
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

interface AppointmentLookupProps {
  compact?: boolean;
}

const statusLabels: Record<string, string> = {
  INITIAL: 'Fase inicial',
  IN_PROGRESS: 'En tramite',
  WAITING_ADMIN: 'Pendiente de respuesta',
  RESOLVED: 'Resuelto',
  ARCHIVED: 'Archivado',
};

const noteStatusLabels: Record<string, string> = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En revision',
  WAITING: 'En espera',
  DONE: 'Completado',
};

export function AppointmentLookup({ compact = false }: AppointmentLookupProps) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<PublicAppointment[]>([]);
  const [notes, setNotes] = useState<PublicNote[]>([]);
  const [documents, setDocuments] = useState<PublicDocument[]>([]);
  const [matters, setMatters] = useState<PublicMatter[]>([]);
  const [searched, setSearched] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 4;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const [lastQuery, setLastQuery] = useState<{ email: string; phone: string } | null>(null);
  const [portalNotice, setPortalNotice] = useState('');
  const [sessionLoading, setSessionLoading] = useState(true);

  const fetchAppointments = async (query: { email: string; phone: string }, nextPage: number) => {
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
    setSearched(false);
    setTotal(0);

    const normalizedEmail = normalizeEmail(email);
    const normalizedPhone = normalizePhone(phone);

    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      setError('Email no válido');
      setSearched(true);
      return;
    }

    if (!normalizedPhone || !isValidPhone(normalizedPhone)) {
      setError('Teléfono no válido (9 dígitos)');
      setSearched(true);
      return;
    }

    const query = { email: normalizedEmail, phone: normalizedPhone };
    setLastQuery(query);
    await fetchAppointments(query, 1);
  };

  const handlePay = async (appointmentId: string) => {
    window.location.href = `/api/payments/redsys?appointmentId=${appointmentId}`;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');
    if (payment === 'success') {
      setPortalNotice('Pago recibido correctamente. Hemos actualizado el estado de tu cita.');
    }
    if (payment === 'error') {
      setPortalNotice('El pago no se completo. Puedes intentarlo de nuevo desde la seccion de citas.');
    }

    let active = true;
    fetch('/api/portal/session')
      .then((res) => res.json())
      .then(async (data) => {
        if (!active) return;
        if (data?.authenticated && data.email && data.phone) {
          const query = { email: normalizeEmail(data.email), phone: normalizePhone(data.phone) };
          setEmail(query.email);
          setPhone(query.phone);
          setLastQuery(query);
          await fetchAppointments(query, 1);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setSessionLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const pendingPayments = results.filter((appt) => appt.paymentStatus !== 'PAID' && appt.status !== 'CANCELLED').length;
  const activeAppointments = results.filter((appt) => appt.status !== 'CANCELLED').length;
  const pendingMatterPayments = matters.reduce(
    (total, matter) => total + matter.billingDocuments.filter((doc) => doc.status !== 'PAID').length,
    0
  );
  const pendingBillingDocuments = matters.flatMap((matter) =>
    matter.billingDocuments
      .filter((document) => document.status !== 'PAID')
      .map((document) => ({ ...document, matterTitle: matter.title }))
  );
  const latestMatter = matters[0] || null;
  const knownClientName = latestMatter?.clientName || results[0]?.clientName || '';
  const knownClientNie = latestMatter?.clientNie || results[0]?.clientNie || '';
  const newAppointmentUrl = lastQuery
    ? `/reservar?portalBooking=1&email=${encodeURIComponent(lastQuery.email)}&phone=${encodeURIComponent(lastQuery.phone)}&name=${encodeURIComponent(knownClientName)}&nie=${encodeURIComponent(knownClientNie || '')}`
    : '/reservar';

  return (
    <div className={`${compact ? 'min-h-0 space-y-4' : 'space-y-8'} animate-fade-in`}>
      {portalNotice && (
        <div className={`p-4 rounded-xl font-bold border flex items-center gap-3 animate-fade-in ${portalNotice.includes('Error') ? 'bg-red-50 border-red-100 text-red-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
          {portalNotice.includes('Error') ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
          <span className="text-sm">{portalNotice}</span>
        </div>
      )}

      {/* Login / Access Form */}
      <div className={`neo-card !p-4 relative overflow-hidden group ${searched && !error && results.length > 0 ? 'bg-[var(--pv-marble)]/50' : 'bg-white'}`}>
        <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-1000">
           <ShieldCheck size={120} />
        </div>

        {!searched || error || results.length === 0 ? (
          <div className="relative z-10">
            <h2 className="text-lg font-bold font-roman uppercase text-[var(--pv-ink)] mb-1 flex items-center gap-3">
               <Search size={22} className="text-[var(--pv-gold)]" />
               Acceso al portal
            </h2>
            <p className="text-sm text-[var(--pv-navy)] opacity-60 mb-4 leading-relaxed">
              Usa el mismo email y telefono que indicaste al reservar. Si tienes varias citas, apareceran agrupadas en este panel.
            </p>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_auto] gap-4">
              <div className="space-y-1">
                 <label className="text-[9px] font-black uppercase text-[var(--pv-gold)] tracking-widest ml-2">Email</label>
                 <input
                  type="email"
                  placeholder="ejemplo@correo.com"
                  className="neo-input !py-3"
                  value={email}
                  onChange={(e) => setEmail(normalizeEmail(e.target.value))}
                  required
                />
              </div>
              <div className="space-y-1">
                 <label className="text-[9px] font-black uppercase text-[var(--pv-gold)] tracking-widest ml-2">Teléfono</label>
                 <input
                  type="tel"
                  placeholder="600000000"
                  className="neo-input !py-3"
                  value={phone}
                  onChange={(e) => setPhone(normalizePhone(e.target.value))}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={9}
                  required
                />
              </div>
              <div className="lg:pt-5">
                <button type="submit" className="btn-roman w-full lg:w-auto !py-3 !px-8 h-[46px]" disabled={loading}>
                  {loading ? 'Accediendo...' : 'Entrar'}
                </button>
              </div>
            </form>
            {error && (
              <div className="mt-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-xs font-bold flex items-center gap-2 animate-shake">
                <AlertCircle size={16} /> {error}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
             <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-[var(--pv-gold)] flex items-center justify-center text-white shadow-lg font-roman font-bold">
                   {email[0].toUpperCase()}
                </div>
                <div>
                   <h3 className="font-bold text-[var(--pv-ink)]">{email}</h3>
                   <p className="text-[10px] font-bold text-[var(--pv-gold)] uppercase tracking-widest">Sesion activa</p>
                </div>
             </div>
             <div className="flex flex-wrap items-center gap-2">
               <a href={newAppointmentUrl} className="btn-roman !py-2.5 !px-4 !text-[10px] !uppercase !tracking-widest">
                 <CalendarPlus size={14} />
                 Nueva cita
               </a>
               <button onClick={() => { setSearched(false); setEmail(''); setPhone(''); }} className="rounded-lg bg-[var(--pv-marble)] px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[var(--pv-navy)] opacity-70 hover:opacity-100 transition-opacity">Cambiar datos</button>
             </div>
          </div>
        )}
      </div>

      {searched && !error && results.length === 0 && (
        <div className="neo-card !p-12 text-center border-2 border-dashed border-[var(--pv-gold)]/20 animate-fade-in">
           <AlertCircle size={40} className="mx-auto text-[var(--pv-gold)] opacity-20 mb-4" />
           <p className="text-sm font-bold text-[var(--pv-navy)] opacity-40 uppercase tracking-widest">No encontramos registros con esos datos.</p>
        </div>
      )}

      {searched && (notes.length > 0 || results.length > 0 || documents.length > 0 || matters.length > 0) && lastQuery && (
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] gap-4 animate-fade-in">
          <section className="neo-card !p-5 border-l-4 border-l-[var(--pv-gold)]">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-roman text-lg font-bold uppercase text-[var(--pv-ink)]">Notificaciones</h3>
                <p className="text-xs text-[var(--pv-navy)]/60">Mensajes publicados por el despacho para tu expediente.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-xl bg-[var(--pv-marble)] px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-[var(--pv-gold)]">
                  {notes.length} visibles
                </span>
                <a href={newAppointmentUrl} className="btn-roman !py-2.5 !px-4 !text-[10px] !uppercase !tracking-widest">
                  <CalendarPlus size={14} />
                  Pedir cita
                </a>
              </div>
            </div>

            {notes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--pv-gold)]/20 bg-[var(--pv-marble)]/50 p-6 text-center">
                <p className="text-xs font-bold uppercase tracking-widest text-[var(--pv-navy)]/40">Sin notificaciones nuevas</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notes.slice(0, 5).map((note) => (
                  <article key={note.id} className="rounded-2xl border border-white bg-white p-4 shadow-sm">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[var(--pv-navy)]/40">
                        {formatDateShort(note.createdAt.split('T')[0])}
                      </span>
                      <span className={`rounded-lg border px-2.5 py-1 text-[9px] font-black uppercase tracking-widest ${
                        note.status === 'DONE' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        note.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                        'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>
                        {noteStatusLabels[note.status] || note.status}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--pv-navy)]">{note.content}</p>
                  </article>
                ))}
              </div>
            )}
          </section>

          <aside className="space-y-4">
            <section className="neo-card !p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--pv-gold)]/10 text-[var(--pv-gold)]">
                  <Activity size={20} />
                </div>
                <div>
                  <h3 className="font-roman text-sm font-bold uppercase tracking-widest text-[var(--pv-ink)]">Estado del caso</h3>
                  <p className="text-xs text-[var(--pv-navy)]/55">Resumen actual</p>
                </div>
              </div>
              {latestMatter ? (
                <div className="rounded-2xl bg-[var(--pv-marble)] p-4 shadow-inner">
                  <div className="text-[9px] font-black uppercase tracking-[0.25em] text-[var(--pv-gold)]">{latestMatter.reference}</div>
                  <div className="mt-1 font-roman text-base font-bold uppercase text-[var(--pv-ink)]">{latestMatter.title}</div>
                  <div className="mt-3 inline-flex rounded-lg bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[var(--pv-navy)]">
                    {statusLabels[latestMatter.status] || latestMatter.status}
                  </div>
                  {latestMatter.summary && <p className="mt-3 text-xs leading-relaxed text-[var(--pv-navy)]/70">{latestMatter.summary}</p>}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-[var(--pv-gold)]/20 bg-[var(--pv-marble)]/50 p-4 text-xs font-bold uppercase tracking-widest text-[var(--pv-navy)]/40">
                  Todavia no hay expediente publicado.
                </div>
              )}
            </section>

            <section className="neo-card !p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <CreditCard size={20} />
                </div>
                <div>
                  <h3 className="font-roman text-sm font-bold uppercase tracking-widest text-[var(--pv-ink)]">Pagos</h3>
                  <p className="text-xs text-[var(--pv-navy)]/55">{pendingPayments + pendingMatterPayments} pendiente(s)</p>
                </div>
              </div>

              <div className="space-y-3">
                {results
                  .filter((appt) => appt.paymentStatus !== 'PAID' && appt.status !== 'CANCELLED')
                  .map((appt) => (
                    <div key={appt.id} className="rounded-xl bg-white p-3 shadow-sm">
                      <div className="text-xs font-bold text-[var(--pv-ink)]">{appt.serviceName}</div>
                      <button onClick={() => handlePay(appt.id)} className="btn-roman mt-3 w-full !py-2.5 !text-[10px] !uppercase !tracking-widest">
                        Pagar {formatEuro(CONSULTATION_DEPOSIT_AMOUNT)}
                      </button>
                    </div>
                  ))}
                {pendingBillingDocuments.map((doc) => (
                  <div key={doc.id} className="rounded-xl bg-white p-3 shadow-sm">
                    <div className="text-xs font-bold text-[var(--pv-ink)]">{doc.concept}</div>
                    <div className="mt-1 text-[10px] text-[var(--pv-navy)]/50">{doc.matterTitle}</div>
                    <div className="mt-2 text-sm font-black text-red-600">
                      {(doc.totalAmount - doc.paidAmount).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                    </div>
                  </div>
                ))}
                {pendingPayments + pendingMatterPayments === 0 && (
                  <div className="rounded-2xl bg-emerald-50 p-4 text-xs font-bold uppercase tracking-widest text-emerald-700">
                    No tienes pagos pendientes.
                  </div>
                )}
              </div>
            </section>

            <section className="neo-card !p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Clock size={20} />
                </div>
                <div>
                  <h3 className="font-roman text-sm font-bold uppercase tracking-widest text-[var(--pv-ink)]">Citas</h3>
                  <p className="text-xs text-[var(--pv-navy)]/55">{activeAppointments} activa(s)</p>
                </div>
              </div>

              <div className="space-y-3">
                {results.map((appt) => {
                  const dateStr = appt.date.split('T')[0];
                  return (
                    <div key={appt.id} className="rounded-xl border border-white bg-white p-3 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-xs font-black uppercase text-[var(--pv-ink)]">{appt.serviceName}</div>
                          <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-[var(--pv-navy)]/45">
                            {formatDateShort(dateStr)} · {appt.startTime} - {appt.endTime}
                          </div>
                        </div>
                        <span className={`shrink-0 rounded-lg border px-2 py-1 text-[9px] font-black uppercase tracking-widest ${STATUS_COLORS[appt.status] || ''}`}>
                          {STATUS_LABELS[appt.status] || appt.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {total > pageSize && (
                <div className="mt-4 flex items-center justify-between px-1">
                  <button
                    type="button"
                    className="p-2.5 rounded-xl bg-white border border-[var(--pv-gold)]/20 text-[var(--pv-gold)] hover:bg-[var(--pv-gold)] hover:text-white transition-all shadow-sm"
                    disabled={page <= 1 || loading}
                    onClick={() => lastQuery && fetchAppointments(lastQuery, Math.max(1, page - 1))}
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <span className="text-[10px] font-black uppercase text-[var(--pv-navy)] opacity-40 tracking-[0.2em]">Página {page} de {totalPages}</span>
                  <button
                    type="button"
                    className="p-2.5 rounded-xl bg-white border border-[var(--pv-gold)]/20 text-[var(--pv-gold)] hover:bg-[var(--pv-gold)] hover:text-white transition-all shadow-sm"
                    disabled={page >= totalPages || loading}
                    onClick={() => lastQuery && fetchAppointments(lastQuery, Math.min(totalPages, page + 1))}
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </section>
          </aside>
        </div>
      )}

      {false && searched && (notes.length > 0 || results.length > 0 || documents.length > 0 || matters.length > 0) && lastQuery && (
        <div className="space-y-5 animate-fade-in">
          {/* Dashboard Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="neo-card !p-4 border-b-4 border-b-blue-500">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                 <Activity size={20} />
              </div>
              <div className="text-[10px] uppercase font-black tracking-widest text-blue-600">Citas activas</div>
              <div className="text-2xl font-black text-[var(--pv-ink)]">{activeAppointments}</div>
            </div>
            <div className="neo-card !p-4 border-b-4 border-b-red-500">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600">
                 <CreditCard size={20} />
              </div>
              <div className="text-[10px] uppercase font-black tracking-widest text-red-600">Pagos pendientes</div>
              <div className="text-2xl font-black text-[var(--pv-ink)]">{pendingPayments + pendingMatterPayments}</div>
            </div>
            <div className="neo-card !p-4 border-b-4 border-b-[var(--pv-gold)]">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--pv-gold)]/10 text-[var(--pv-gold)]">
                 <FileText size={20} />
              </div>
              <div className="text-[10px] uppercase font-black tracking-widest text-[var(--pv-gold)]">Documentos enviados</div>
              <div className="text-2xl font-black text-[var(--pv-ink)]">{documents.length}</div>
            </div>
            <div className="neo-card !p-4 border-b-4 border-b-emerald-500">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                 <History size={20} />
              </div>
              <div className="text-[10px] uppercase font-black tracking-widest text-emerald-600">Actualizaciones</div>
              <div className="text-2xl font-black text-[var(--pv-ink)]">{notes.length}</div>
            </div>
          </div>

        {/* Matters Section */}
        {matters.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
               <Briefcase size={20} className="text-[var(--pv-gold)]" />
               <h3 className="font-roman text-lg font-bold uppercase text-[var(--pv-ink)] tracking-tight">Tus expedientes</h3>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {matters.map((matter) => (
                <div key={matter.id} className="neo-card !p-4 border-l-4 border-l-[var(--pv-gold)]">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                    <div>
                      <div className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--pv-gold)]">{matter.reference}</div>
                      <h4 className="text-base font-bold text-[var(--pv-ink)] transition-colors mt-1 uppercase font-roman">{matter.title}</h4>
                      <p className="text-xs font-medium text-[var(--pv-navy)] opacity-60 uppercase tracking-widest mt-1">{matter.procedureType}</p>
                    </div>
                    <span className="text-[9px] font-black px-3 py-1 rounded-lg bg-[var(--pv-marble)] border border-white text-[var(--pv-navy)] opacity-70 uppercase tracking-widest">
                      {statusLabels[matter.status] || matter.status}
                    </span>
                  </div>
                  
              {matter.summary && <p className="text-sm text-[var(--pv-navy)] leading-relaxed opacity-80 mb-4 bg-[var(--pv-marble)] p-3 rounded-xl border border-white">{matter.summary}</p>}
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-white border border-[var(--pv-marble)] shadow-sm">
                      <div className="text-[9px] font-black uppercase text-[var(--pv-gold)] tracking-widest mb-3 flex items-center gap-1"><Clock size={10} /> Proximas fechas</div>
                      {matter.deadlines.length === 0 ? (
                        <p className="text-[10px] text-[var(--pv-navy)] opacity-40 font-bold uppercase">Sin vencimientos</p>
                      ) : (
                        <div className="space-y-3">
                          {matter.deadlines.slice(0, 2).map((deadline) => (
                            <div key={deadline.id} className="flex justify-between items-center gap-2">
                              <span className="text-[11px] font-bold text-[var(--pv-navy)] truncate">{deadline.title}</span>
                              <span className="text-[10px] font-black text-[var(--pv-gold)]">{formatDateShort(deadline.dueAt.split('T')[0])}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-[var(--pv-marble)] shadow-sm">
                      <div className="text-[9px] font-black uppercase text-emerald-600 tracking-widest mb-3 flex items-center gap-1"><CreditCard size={10} /> Pagos del expediente</div>
                      {matter.billingDocuments.length === 0 ? (
                        <p className="text-[10px] text-[var(--pv-navy)] opacity-40 font-bold uppercase">Sin deudas</p>
                      ) : (
                        <div className="space-y-3">
                          {matter.billingDocuments.slice(0, 2).map((doc) => (
                            <div key={doc.id} className="flex justify-between items-center gap-2">
                              <span className="text-[11px] font-bold text-[var(--pv-navy)] truncate">{doc.concept}</span>
                              <span className="text-[10px] font-black text-emerald-600">{doc.totalAmount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {matter.timeline.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-[var(--pv-marble)] space-y-3">
                      <div className="text-[9px] font-black uppercase text-[var(--pv-gold)] tracking-widest mb-2 flex items-center gap-1"><History size={10} /> Ultimas actualizaciones</div>
                      {matter.timeline.slice(0, 2).map((entry) => (
                        <div key={entry.id} className="relative pl-6 before:absolute before:left-0 before:top-1.5 before:w-2 before:h-2 before:bg-[var(--pv-gold)] before:rounded-full before:opacity-40">
                          <div className="text-[11px] font-black text-[var(--pv-ink)] uppercase tracking-tight">{entry.title}</div>
                          {entry.content && <div className="text-[11px] text-[var(--pv-navy)] opacity-60 leading-relaxed mt-1 line-clamp-1 italic">"{entry.content}"</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(280px,0.9fr)_minmax(0,1.6fr)] gap-4 items-start">
          {/* Status Column */}
          <div className="space-y-4">
            <section className="neo-card !p-4">
            <h3 className="font-roman text-sm font-bold uppercase text-[var(--pv-ink)] tracking-widest">Actualizaciones</h3>
            {notes.length === 0 ? (
              <div className="mt-3 rounded-xl border border-dashed border-[var(--pv-gold)]/20 bg-[var(--pv-marble)]/50 p-5 text-center">
                <p className="text-[10px] font-black text-[var(--pv-navy)] opacity-30 uppercase tracking-[0.2em]">Sin entradas recientes</p>
              </div>
            ) : (
              <div className="mt-3 space-y-3 max-h-[340px] overflow-y-auto pr-1 custom-scrollbar">
                {notes.map((note) => (
                  <div key={note.id} className="rounded-xl border border-white bg-white p-3 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[var(--pv-gold)] opacity-20"></div>
                    <div className="flex items-center justify-between mb-3 gap-2">
                      <span className="text-[10px] font-black text-[var(--pv-navy)] opacity-40 uppercase tracking-widest">{formatDateShort(note.createdAt.split('T')[0])}</span>
                      <span className={`text-[9px] px-2.5 py-1 rounded-lg font-black uppercase tracking-widest border shadow-sm ${
                        note.status === 'DONE' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        note.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                        'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>
                        {noteStatusLabels[note.status] || note.status}
                      </span>
                    </div>
                    <div className="text-xs text-[var(--pv-navy)] leading-relaxed font-medium bg-[var(--pv-marble)] p-3 rounded-xl border border-white">{note.content}</div>
                  </div>
                ))}
              </div>
            )}
            </section>

          {/* Document Uploader Column */}
          <section className="neo-card !p-4">
             <ClientDocumentUploader
                email={lastQuery?.email || ''}
                phone={lastQuery?.phone || ''}
                documents={documents}
                onUploaded={(document) => setDocuments((current) => [document, ...current])}
                compact={compact}
              />
          </section>
          </div>

          {/* Appointments Column */}
          <div className="neo-card !p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-roman text-sm font-bold uppercase text-[var(--pv-ink)] tracking-widest">Tus citas</h3>
              {total > pageSize && (
                <span className="text-[10px] font-black uppercase text-[var(--pv-navy)] opacity-40 tracking-[0.2em]">Pagina {page} de {totalPages}</span>
              )}
            </div>
            <div className="space-y-3 max-h-[720px] overflow-y-auto pr-1 custom-scrollbar">
              {results.map((appt) => {
                const dateStr = appt.date.split('T')[0];
                return (
                  <div key={appt.id} className="rounded-xl border border-white border-l-4 border-l-[var(--pv-gold)] bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                      <div className="min-w-0 text-sm font-black text-[var(--pv-ink)] uppercase font-roman tracking-tight">{appt.serviceName}</div>
                      <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg border shadow-sm uppercase tracking-widest ${STATUS_COLORS[appt.status] || ''}`}>
                        {STATUS_LABELS[appt.status] || appt.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-[var(--pv-navy)] opacity-50 uppercase tracking-widest">
                      <Clock size={12} className="text-[var(--pv-gold)]" />
                      {formatDateShort(dateStr)} · {appt.startTime} - {appt.endTime}
                    </div>

                    <div className="mt-4 pt-4 border-t border-[var(--pv-marble)] flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <span className="text-[9px] font-black text-[var(--pv-gold)] uppercase tracking-widest block mb-1">Estado de Pago</span>
                        <span className={`text-xs font-black uppercase tracking-tighter ${appt.paymentStatus === 'PAID' ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {appt.paymentStatus === 'PAID' ? 'Saldado' : 'Pendiente'}
                        </span>
                      </div>

                      {appt.paymentStatus !== 'PAID' && appt.status !== 'CANCELLED' && (
                        <button onClick={() => handlePay(appt.id)} className="btn-roman !py-2.5 !px-4 !text-[10px] !uppercase !tracking-widest shadow-xl shadow-[var(--pv-gold)]/20">
                          Pagar {formatEuro(CONSULTATION_DEPOSIT_AMOUNT)}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {total > pageSize && (
              <div className="mt-4 flex items-center justify-between px-1">
                <button
                  type="button"
                  className="p-2.5 rounded-xl bg-white border border-[var(--pv-gold)]/20 text-[var(--pv-gold)] hover:bg-[var(--pv-gold)] hover:text-white transition-all shadow-sm"
                  disabled={page <= 1 || loading}
                  onClick={() => lastQuery && fetchAppointments(lastQuery, Math.max(1, page - 1))}
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="text-[10px] font-black uppercase text-[var(--pv-navy)] opacity-40 tracking-[0.2em]">Página {page} de {totalPages}</span>
                <button
                  type="button"
                  className="p-2.5 rounded-xl bg-white border border-[var(--pv-gold)]/20 text-[var(--pv-gold)] hover:bg-[var(--pv-gold)] hover:text-white transition-all shadow-sm"
                  disabled={page >= totalPages || loading}
                  onClick={() => lastQuery && fetchAppointments(lastQuery, Math.min(totalPages, page + 1))}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </div>
        </div>
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
