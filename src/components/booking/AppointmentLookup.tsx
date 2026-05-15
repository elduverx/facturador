'use client';

import { useEffect, useState } from 'react';
import { STATUS_COLORS, STATUS_LABELS, formatDateShort } from '@/lib/constants';
import { CONSULTATION_DEPOSIT_AMOUNT, formatEuro } from '@/lib/payments';
import { isValidEmail, isValidPhone, normalizeEmail, normalizePhone } from '@/lib/validation';
import { ClientDocumentUploader, PublicDocument } from './ClientDocumentUploader';

type PublicNote = {
  id: string;
  content: string;
  status: string;
  createdAt: string;
};

type PublicAppointment = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  paymentStatus: string;
  serviceName: string;
  price: number;
};

interface AppointmentLookupProps {
  compact?: boolean;
}

export function AppointmentLookup({ compact = false }: AppointmentLookupProps) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<PublicAppointment[]>([]);
  const [notes, setNotes] = useState<PublicNote[]>([]);
  const [documents, setDocuments] = useState<PublicDocument[]>([]);
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
        throw new Error(data?.error || 'No se pudo consultar la cita');
      }
      const appointments = Array.isArray(data?.appointments) ? data.appointments : [];
      setResults(appointments);
      setNotes(Array.isArray(data?.notes) ? data.notes : []);
      setDocuments(Array.isArray(data?.documents) ? data.documents : []);
      setTotal(typeof data?.total === 'number' ? data.total : appointments.length);
      setPage(nextPage);
      setSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al consultar la cita');
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
    setSearched(false);
    setTotal(0);

    const normalizedEmail = normalizeEmail(email);
    const normalizedPhone = normalizePhone(phone);

    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      setError('Email no valido');
      setSearched(true);
      return;
    }

    if (!normalizedPhone || !isValidPhone(normalizedPhone)) {
      setError('Telefono no valido (9 digitos, empieza con 6, 7, 8 o 9)');
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
      setPortalNotice('Pago recibido. Hemos abierto tu portal para que puedas revisar el estado de tu cita y pendientes.');
    }
    if (payment === 'error') {
      setPortalNotice('El pago no se completo. Puedes intentarlo de nuevo desde tus citas pendientes.');
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

  return (
    <div className={`${compact ? 'h-full min-h-0 flex flex-col gap-3' : 'space-y-6'}`}>
      {portalNotice && (
        <div className={`rounded-md border border-[var(--pv-gold)] bg-[#fff8e8] ${compact ? 'p-2 text-xs' : 'p-4 text-sm'} text-[var(--pv-navy)]`}>
          {portalNotice}
        </div>
      )}

      <div className={`card ${compact ? '!p-3 shrink-0' : ''}`}>
        <div className="flex items-start gap-3">
          <div className={`${compact ? 'w-8 h-8' : 'w-10 h-10'} pv-seal rounded-full flex items-center justify-center font-legal text-xs font-bold shrink-0`}>
            PV
          </div>
          <div>
            <h2 className={`font-legal ${compact ? 'text-lg' : 'text-xl'} text-[var(--pv-navy)]`}>Acceso al portal</h2>
            <p className={`${compact ? 'hidden sm:block' : ''} text-xs text-[var(--pv-muted)] mt-1`}>
              Introduce el email y telefono utilizados en tu reserva para consultar citas, documentos y estado del expediente.
            </p>
          </div>
        </div>

        {sessionLoading && (
          <div className={`${compact ? 'mt-2 p-2' : 'mt-4 p-3'} rounded-md border border-[var(--pv-line)] bg-[#fff8e8]/70 text-xs text-[var(--pv-muted)]`}>
            Comprobando si ya tienes una sesion activa del portal...
          </div>
        )}

        <form onSubmit={handleSubmit} className={`${compact ? 'mt-3' : 'mt-5'} grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2`}>
          <input
            type="email"
            placeholder="Email"
            className="form-input text-sm"
            value={email}
            onChange={(e) => setEmail(normalizeEmail(e.target.value))}
            required
          />
          <input
            type="tel"
            placeholder="600000000"
            className="form-input text-sm"
            value={phone}
            onChange={(e) => setPhone(normalizePhone(e.target.value))}
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={9}
            required
          />
          <button type="submit" className="btn btn-primary text-sm" disabled={loading}>
            {loading ? 'Accediendo...' : 'Entrar'}
          </button>
        </form>

        {error && (
          <div className="mt-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-md p-2">
            {error}
          </div>
        )}
      </div>

      {searched && !error && results.length === 0 && (
        <p className="text-xs text-[var(--pv-muted)] text-center py-3 bg-[#fff8e8]/70 rounded-md border border-dashed border-[var(--pv-line)]">
          No encontramos registros con esos datos.
        </p>
      )}

      {searched && (notes.length > 0 || results.length > 0) && lastQuery && (
        <div className={`${compact ? 'min-h-0 flex-1 flex flex-col gap-3' : 'space-y-6'}`}>
          <div className="grid grid-cols-3 gap-2 shrink-0">
            <div className={`rounded-md border border-[var(--pv-line)] bg-[#fff8e8]/70 ${compact ? 'p-3' : 'p-4'}`}>
              <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--pv-muted)]">Citas activas</div>
              <div className={`font-legal ${compact ? 'text-xl' : 'text-2xl'} text-[var(--pv-navy)] mt-1`}>{activeAppointments}</div>
            </div>
            <div className={`rounded-md border border-[var(--pv-line)] bg-[#fff8e8]/70 ${compact ? 'p-3' : 'p-4'}`}>
              <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--pv-muted)]">Pagos pendientes</div>
              <div className={`font-legal ${compact ? 'text-xl' : 'text-2xl'} text-[var(--pv-navy)] mt-1`}>{pendingPayments}</div>
            </div>
            <div className={`rounded-md border border-[var(--pv-line)] bg-[#fff8e8]/70 ${compact ? 'p-3' : 'p-4'}`}>
              <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--pv-muted)]">Documentos</div>
              <div className={`font-legal ${compact ? 'text-xl' : 'text-2xl'} text-[var(--pv-navy)] mt-1`}>{documents.length}</div>
            </div>
          </div>

        <div className={`${compact ? 'min-h-0 overflow-hidden grid grid-cols-1 lg:grid-cols-[1fr_1.15fr_1fr] gap-3' : 'grid grid-cols-1 xl:grid-cols-3 gap-6'}`}>
          <div className="space-y-2 min-h-0 flex flex-col">
            <h3 className="font-legal text-sm uppercase tracking-wide text-[var(--pv-navy)] px-1">
              Estado del tramite
            </h3>
            {notes.length === 0 ? (
              <div className="p-3 bg-[#fff8e8]/70 rounded-md border border-[var(--pv-line)] text-xs text-[var(--pv-muted)] text-center">
                No hay actualizaciones publicas de tu expediente por ahora.
              </div>
            ) : (
              <div className={`${compact ? 'overflow-y-auto pr-1' : ''} space-y-2`}>
                {notes.map((note) => (
                  <div key={note.id} className="p-3 bg-[#fff8e8]/70 rounded-md border border-[var(--pv-line)] shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] text-[var(--pv-muted)]">{formatDateShort(note.createdAt.split('T')[0])}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        note.status === 'DONE' ? 'bg-green-100 text-green-700' :
                        note.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {note.status}
                      </span>
                    </div>
                    <div className="text-xs text-[var(--pv-text)] whitespace-pre-wrap leading-relaxed">{note.content}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <ClientDocumentUploader
            email={lastQuery.email}
            phone={lastQuery.phone}
            documents={documents}
            onUploaded={(document) => setDocuments((current) => [document, ...current])}
            compact={compact}
          />

          <div className="space-y-2 min-h-0 flex flex-col">
            <h3 className="font-legal text-sm uppercase tracking-wide text-[var(--pv-navy)] px-1">
              Tus citas
            </h3>
            <div className={`${compact ? 'overflow-y-auto pr-1' : ''} space-y-2`}>
              {results.map((appt) => {
                const dateStr = appt.date.split('T')[0];
                return (
                  <div key={appt.id} className="p-3 bg-[#fff8e8]/70 rounded-md border border-[var(--pv-line)] shadow-sm">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="text-sm font-semibold text-[var(--pv-navy)]">{appt.serviceName}</div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${STATUS_COLORS[appt.status] || ''}`}>
                        {STATUS_LABELS[appt.status] || appt.status}
                      </span>
                    </div>
                    <div className="text-xs text-[var(--pv-muted)]">
                      {formatDateShort(dateStr)} - {appt.startTime} - {appt.endTime}
                    </div>

                    <div className="mt-3 pt-3 border-t border-[var(--pv-line)] flex items-center justify-between gap-2">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-[var(--pv-muted)] uppercase tracking-wider">Pago</span>
                        <span className={`text-xs font-medium ${appt.paymentStatus === 'PAID' ? 'text-green-700' : 'text-amber-700'}`}>
                          {appt.paymentStatus === 'PAID' ? 'Pagado' : 'Pendiente'}
                        </span>
                      </div>

                      {appt.paymentStatus !== 'PAID' && appt.status !== 'CANCELLED' && (
                        <button onClick={() => handlePay(appt.id)} className="btn btn-primary !px-3 !py-1.5 text-xs">
                          Pagar anticipo {formatEuro(CONSULTATION_DEPOSIT_AMOUNT)}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {total > pageSize && (
              <div className="mt-4 flex items-center justify-between text-xs text-[var(--pv-muted)]">
                <button
                  type="button"
                  className="btn btn-secondary !py-1"
                  disabled={page <= 1 || loading}
                  onClick={() => lastQuery && fetchAppointments(lastQuery, Math.max(1, page - 1))}
                >
                  Anterior
                </button>
                <span>Pagina {page} de {totalPages}</span>
                <button
                  type="button"
                  className="btn btn-secondary !py-1"
                  disabled={page >= totalPages || loading}
                  onClick={() => lastQuery && fetchAppointments(lastQuery, Math.min(totalPages, page + 1))}
                >
                  Siguiente
                </button>
              </div>
            )}
          </div>
        </div>
        </div>
      )}
    </div>
  );
}
