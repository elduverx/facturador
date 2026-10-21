'use client';

import { useEffect, useState } from 'react';
import { Calendar as CalendarIcon, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { formatDateShort } from '@/lib/constants';

interface ClientAppointmentsPanelProps {
  clientEmail: string;
}

const STATUS_CONFIG: Record<string, { label: string, color: string, icon: any }> = {
  PENDING: { label: 'Pendiente', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: Clock },
  CONFIRMED: { label: 'Confirmada', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: CheckCircle2 },
  COMPLETED: { label: 'Completada', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle2 },
  CANCELLED: { label: 'Cancelada', color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
};

export function ClientAppointmentsPanel({ clientEmail }: ClientAppointmentsPanelProps) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduling, setRescheduling] = useState(false);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/appointments?search=${encodeURIComponent(clientEmail)}`);
      const data = await res.json();
      
      if (Array.isArray(data)) {
        // Sort descending by date
        const sorted = data.sort((a, b) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          return dateB - dateA;
        });
        setAppointments(sorted);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clientEmail) loadAppointments();
  }, [clientEmail]);

  const handleSaveReschedule = async (id: string) => {
    if (!rescheduleDate || !rescheduleTime) return;
    setRescheduling(true);
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: rescheduleDate,
          startTime: rescheduleTime,
        }),
      });
      if (res.ok) {
        setReschedulingId(null);
        await loadAppointments();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRescheduling(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-[var(--pv-marble)] shadow-sm">
        <h3 className="font-roman text-sm font-bold uppercase tracking-widest text-[var(--pv-ink)] flex items-center gap-2">
          <CalendarIcon size={16} className="text-[var(--pv-gold)]" />
          Historial de Citas
        </h3>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-[var(--pv-navy)]/50 font-bold uppercase tracking-widest animate-pulse">
          Cargando citas...
        </div>
      ) : appointments.length === 0 ? (
        <div className="p-8 bg-white/50 rounded-2xl border-2 border-dashed border-[var(--pv-marble)] text-center">
          <CalendarIcon size={24} className="mx-auto text-[var(--pv-navy)]/30 mb-2" />
          <div className="text-xs text-[var(--pv-navy)]/50 font-bold uppercase tracking-widest">
            Este cliente no tiene citas registradas
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {appointments.map((appt) => {
             const status = STATUS_CONFIG[appt.status || 'PENDING'] || STATUS_CONFIG.PENDING;
             const StatusIcon = status.icon;
             
             return (
              <div key={appt.id} className="neo-card !p-5 bg-white">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h4 className="font-roman text-base font-bold text-[var(--pv-ink)] mb-1">
                      {appt.serviceTitle || 'Consulta Legal'}
                    </h4>
                    <div className="text-xs font-bold text-[var(--pv-navy)] opacity-60 uppercase tracking-widest flex flex-col gap-1">
                      <span>{formatDateShort(appt.date.split('T')[0])} a las {appt.startTime || appt.time}</span>
                      <span>{appt.modality === 'VIDEO_CALL' ? 'Videollamada' : 'Presencial'}</span>
                    </div>
                  </div>
                  
                  <div className="shrink-0 flex flex-col items-end gap-2">
                    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${status.color}`}>
                      <StatusIcon size={12} />
                      {status.label}
                    </span>
                    {appt.paymentStatus === 'PAID' ? (
                       <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-md">Pagado</span>
                    ) : (
                       <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest bg-amber-50 px-2 py-1 rounded-md">Pago Pendiente</span>
                    )}
                    <button
                      onClick={() => {
                        if (reschedulingId === appt.id) {
                          setReschedulingId(null);
                        } else {
                          setReschedulingId(appt.id);
                          setRescheduleDate(appt.date.split('T')[0]);
                          setRescheduleTime(appt.startTime || appt.time || '09:00');
                        }
                      }}
                      className="text-[10px] font-bold text-[var(--pv-gold)] hover:underline uppercase tracking-widest flex items-center gap-1 mt-1"
                    >
                      <CalendarIcon size={11} /> Reagendar
                    </button>
                  </div>
                </div>

                {reschedulingId === appt.id && (
                  <div className="mt-4 pt-3 border-t border-[var(--pv-marble)] grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                    <div>
                      <label className="text-[9px] font-bold uppercase text-stone-400">Nueva Fecha</label>
                      <input
                        type="date"
                        className="neo-input !py-1.5 !px-2 !bg-stone-50 !text-xs w-full"
                        value={rescheduleDate}
                        onChange={(e) => setRescheduleDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold uppercase text-stone-400">Nueva Hora</label>
                      <input
                        type="time"
                        className="neo-input !py-1.5 !px-2 !bg-stone-50 !text-xs w-full"
                        value={rescheduleTime}
                        onChange={(e) => setRescheduleTime(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveReschedule(appt.id)}
                        disabled={rescheduling}
                        className="flex-1 py-2 rounded-xl bg-[var(--pv-gold)] text-white text-[10px] font-bold uppercase tracking-widest hover:opacity-90"
                      >
                        {rescheduling ? '...' : 'Guardar'}
                      </button>
                      <button
                        onClick={() => setReschedulingId(null)}
                        className="px-3 py-2 rounded-xl bg-stone-100 text-stone-600 text-[10px] font-bold uppercase"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
             );
          })}
        </div>
      )}
    </div>
  );
}
