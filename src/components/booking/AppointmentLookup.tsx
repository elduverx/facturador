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

import { AppointmentDetail } from './AppointmentDetail';

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
  if (appointmentId) {
    return <AppointmentDetail appointmentId={appointmentId} paymentSuccess={paymentSuccess} />;
  }

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
    const appointmentIdParam = params.get('appointmentId');
    const documentIdParam = params.get('documentId');
    if (payment === 'success') {
      setPortalNotice('Pago recibido. Estamos actualizando el estado.');
    }
    if (payment === 'error') {
      setPortalNotice('El pago no se completo. Puedes intentarlo de nuevo desde la seccion de citas.');
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
              }),
            }).catch(() => undefined);
          }

          if (!data.phone) return;

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
    <div className={`${compact ? 'min-h-0 space-y-4' : 'space-y-8'} animate-fade-in ${glass ? 'theme-glass' : ''}`}>
      {portalNotice && (
        <div className={`p-4 rounded-xl font-bold border flex items-center gap-3 animate-fade-in ${portalNotice.includes('completo') ? 'bg-red-50 border-red-100 text-red-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
          {portalNotice.includes('completo') ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
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

      {searched && (results.length > 0 || documents.length > 0 || matters.length > 0) && lastQuery && (
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] gap-4 sm:gap-6 animate-fade-in mt-6">
          
          {/* LEFT COLUMN: Case Status & Documents */}
          <div className="space-y-6">
            
            {/* Estado del Caso */}
            <section className="neo-card !p-4 sm:!p-6 border-t-4 border-t-[var(--pv-gold)] shadow-xl">
              <h3 className="font-roman text-lg font-bold uppercase tracking-widest text-[var(--pv-ink)] mb-4 flex flex-wrap items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--pv-gold)]/10 text-[var(--pv-gold)] flex items-center justify-center">
                  <Briefcase size={20} />
                </div>
                Estado del Caso
              </h3>
              
              {latestMatter ? (
                <div className="rounded-2xl bg-[var(--pv-marble)] p-5 border border-white">
                  <div className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--pv-gold)] mb-1">{latestMatter.reference}</div>
                  <div className="font-roman text-xl font-bold uppercase text-[var(--pv-ink)]">{latestMatter.title}</div>
                  <div className="mt-3 inline-flex rounded-lg bg-white px-3 py-1.5 text-xs font-black uppercase tracking-widest text-[var(--pv-navy)] shadow-sm">
                    {statusLabels[latestMatter.status] || latestMatter.status}
                  </div>
                  {latestMatter.summary && <p className="mt-4 text-sm leading-relaxed text-[var(--pv-navy)]/80">{latestMatter.summary}</p>}
                </div>
              ) : (
                <div className="rounded-2xl border-2 border-dashed border-[var(--pv-gold)]/20 bg-[var(--pv-marble)]/50 p-6 text-center">
                  <p className="text-xs font-bold uppercase tracking-widest text-[var(--pv-navy)]/40">Todavía no hay expediente publicado.</p>
                </div>
              )}
            </section>

            {/* Documentos */}
            <section className="neo-card !p-4 sm:!p-6 shadow-xl">
               <div className="mb-4">
                 <h3 className="font-roman text-lg font-bold uppercase tracking-widest text-[var(--pv-ink)] flex flex-wrap items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <FileText size={20} />
                    </div>
                    Documentos
                 </h3>
                 <p className="text-xs text-[var(--pv-navy)]/60 mt-2 pl-13">Descarga los documentos, resoluciones o justificantes que te envíe la abogada.</p>
               </div>
              
              <div className="bg-[var(--pv-marble)] rounded-2xl p-2 border border-white">
                 <ClientDocumentUploader
                    documents={documents}
                    compact={false}
                  />
              </div>
            </section>

          </div>

          {/* RIGHT COLUMN: Appointments & Payments */}
          <div className="space-y-6">
            
            {/* Pagos */}
            <section className="neo-card !p-4 sm:!p-6 shadow-xl border-t-4 border-t-red-500">
              <div className="mb-6 flex items-center justify-between border-b border-[var(--glass-border)] pb-4">
                <h3 className="font-roman text-lg font-bold uppercase tracking-widest text-[var(--pv-ink)] flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                    <CreditCard size={20} />
                  </div>
                  Tus Pagos
                </h3>
              </div>
              
              {pendingPayments + pendingMatterPayments === 0 ? (
                <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-6 text-center flex flex-col items-center justify-center">
                  <CheckCircle2 size={30} className="text-emerald-500 mb-2" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">¡Todo al día!</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {results
                    .filter((appt) => appt.paymentStatus !== 'PAID' && appt.status !== 'CANCELLED')
                    .map((appt) => (
                      <div key={appt.id} className="rounded-2xl bg-white border border-red-100 p-4 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-12 h-12 bg-red-50 rounded-bl-full -z-10"></div>
                        <div className="text-[9px] font-black uppercase text-red-600 tracking-widest mb-1">Consulta</div>
                        <div className="font-bold text-xs text-[var(--pv-ink)] mb-3 line-clamp-1">{appt.serviceName}</div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="text-lg font-black text-[var(--pv-ink)]">{formatEuro(CONSULTATION_DEPOSIT_AMOUNT)}</div>
                          <button onClick={() => handlePay(appt.id)} className="btn-roman !py-2 !px-4 !text-[10px] !bg-red-600 hover:!bg-red-700">
                            Pagar
                          </button>
                        </div>
                      </div>
                    ))}
                  
                  {pendingBillingDocuments.map((doc) => (
                    <div key={doc.id} className="rounded-2xl bg-white border border-red-100 p-4 shadow-sm relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-12 h-12 bg-red-50 rounded-bl-full -z-10"></div>
                      <div className="text-[9px] font-black uppercase text-red-600 tracking-widest mb-1">Expediente</div>
                      <div className="font-bold text-xs text-[var(--pv-ink)] mb-1 truncate">{doc.concept}</div>
                      <div className="text-[9px] text-[var(--pv-navy)]/50 truncate mb-3">{doc.matterTitle}</div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="text-lg font-black text-[var(--pv-ink)]">
                          {(doc.totalAmount - doc.paidAmount).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                        </div>
                        <button className="btn-roman !py-2 !px-4 !text-[9px] !bg-[var(--pv-navy)] hover:!bg-[var(--pv-ink)] opacity-50 cursor-not-allowed">
                          Contactar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Citas */}
            <section className="neo-card !p-4 sm:!p-6 shadow-xl">
              <div className="mb-6 flex items-center justify-between border-b border-[var(--glass-border)] pb-4">
                <h3 className="font-roman text-lg font-bold uppercase tracking-widest text-[var(--pv-ink)] flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Clock size={20} />
                  </div>
                  Tus Citas
                </h3>
                <a href={newAppointmentUrl} className="btn-roman !py-2.5 !px-4 !text-[10px] !uppercase !tracking-widest">
                  <CalendarPlus size={14} /> Nueva
                </a>
              </div>
              
              {results.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-[var(--pv-gold)]/20 p-6 text-center text-xs font-bold uppercase tracking-widest text-[var(--pv-navy)]/40">
                  No tienes citas registradas.
                </div>
              ) : (
                <div className="space-y-4">
                  {results.map((appt) => {
                    const dateStr = appt.date.split('T')[0];
                    return (
                      <div key={appt.id} className="rounded-2xl border-l-4 border-l-[var(--pv-gold)] bg-white p-4 shadow-sm border-t border-r border-b border-[var(--glass-border)]">
                        <div className="flex justify-between items-start mb-3">
                          <div className="font-roman text-sm font-bold uppercase text-[var(--pv-ink)] pr-4">{appt.serviceName}</div>
                          <span className={`shrink-0 text-[9px] font-black px-2 py-1 rounded-lg border uppercase tracking-widest ${STATUS_COLORS[appt.status] || ''}`}>
                            {STATUS_LABELS[appt.status] || appt.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] font-bold text-[var(--pv-navy)] opacity-70 uppercase tracking-widest bg-[var(--pv-marble)] p-2.5 rounded-xl">
                          <Clock size={12} className="text-[var(--pv-gold)]" />
                          {formatDateShort(dateStr)} · {appt.startTime}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

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
