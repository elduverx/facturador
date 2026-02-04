'use client';

import { useState } from 'react';
import { STATUS_COLORS, STATUS_LABELS, formatDateShort } from '@/lib/constants';
import { isValidEmail, isValidPhone, normalizeEmail, normalizePhone } from '@/lib/validation';

type PublicAppointment = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  serviceName: string;
};

export function AppointmentLookup() {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<PublicAppointment[]>([]);
  const [searched, setSearched] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 4;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const [lastQuery, setLastQuery] = useState<{ email: string; phone: string } | null>(null);

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

  return (
    <div className="card">
      <div className="flex items-center gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-teal-600">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z"></path>
        </svg>
        <h2 className="font-semibold text-sm">Consultar cita ya agendada</h2>
      </div>
      <p className="text-xs text-stone-500 mt-1">
        Introduce el mismo email y telefono usados en la reserva.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3">
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
          {loading ? 'Consultando...' : 'Consultar'}
        </button>
      </form>

      {error && (
        <div className="mt-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
          {error}
        </div>
      )}

      {searched && !error && results.length === 0 && (
        <p className="text-xs text-stone-400 mt-4">No encontramos citas futuras con esos datos.</p>
      )}

      {results.length > 0 && (
        <div className="mt-4 space-y-2">
          {results.map((appt) => {
            const dateStr = appt.date.split('T')[0];
            return (
              <div key={appt.id} className="p-3 rounded-lg border border-stone-200">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-medium">{appt.serviceName}</div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${STATUS_COLORS[appt.status] || ''}`}>
                    {STATUS_LABELS[appt.status] || appt.status}
                  </span>
                </div>
                <div className="text-xs text-stone-500 mt-1">
                  {formatDateShort(dateStr)} - {appt.startTime} - {appt.endTime}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {total > pageSize && (
        <div className="mt-4 flex items-center justify-between text-xs text-stone-500">
          <button
            type="button"
            className="btn btn-secondary"
            disabled={page <= 1 || loading}
            onClick={() => lastQuery && fetchAppointments(lastQuery, Math.max(1, page - 1))}
          >
            Anterior
          </button>
          <span>
            Pagina {page} de {totalPages}
          </span>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={page >= totalPages || loading}
            onClick={() => lastQuery && fetchAppointments(lastQuery, Math.min(totalPages, page + 1))}
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
