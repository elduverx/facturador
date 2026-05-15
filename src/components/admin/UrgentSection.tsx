import { AppointmentData } from '@/types/booking';
import { STATUS_COLORS, STATUS_LABELS, formatDateShort } from '@/lib/constants';

interface UrgentSectionProps {
  urgentItems: { appointment: AppointmentData; label: string }[];
  urgentCount: number;
  onUpdateStatus: (id: string, status: string) => void;
}

export function UrgentSection({ urgentItems, urgentCount, onUpdateStatus }: UrgentSectionProps) {
  return (
    <div className="card h-full">
      <h2 className="font-semibold text-sm mb-4 flex items-center gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-600">
          <path d="M12 9v4"></path>
          <path d="M12 17h.01"></path>
          <path d="M10.29 3.86l-8.13 14a2 2 0 0 0 1.71 3h16.26a2 2 0 0 0 1.71-3l-8.13-14a2 2 0 0 0-3.42 0z"></path>
        </svg>
        Prioridad / Alertas
        <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">{urgentCount}</span>
      </h2>

      {urgentItems.length === 0 ? (
        <p className="text-sm text-stone-400 py-4 text-center">No hay alertas urgentes</p>
      ) : (
        <div className="space-y-3">
          {urgentItems.map(({ appointment, label }) => {
            const dateStr = typeof appointment.date === 'string' ? appointment.date.split('T')[0] : new Date(appointment.date).toISOString().split('T')[0];
            return (
              <div key={appointment.id} className="p-3 rounded-lg border-l-4 border-l-red-500 border border-stone-200 bg-red-50/10">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] uppercase tracking-wide text-red-600 font-bold">{label}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full border ${STATUS_COLORS[appointment.status] || ''}`}>
                    {STATUS_LABELS[appointment.status] || appointment.status}
                  </span>
                </div>
                <div className="text-sm font-semibold mt-1 text-stone-800">{appointment.clientName}</div>
                <div className="text-[11px] text-stone-500 mt-0.5">
                  {formatDateShort(dateStr)} · {appointment.startTime} · {appointment.service?.name || 'Servicio'}
                </div>
                <div className="flex gap-1 mt-3">
                  {appointment.status === 'PENDING' && (
                    <>
                      <button onClick={() => onUpdateStatus(appointment.id, 'CONFIRMED')} className="text-[10px] px-2 py-1 rounded bg-teal-600 text-white hover:bg-teal-700">Confirmar</button>
                      <button onClick={() => onUpdateStatus(appointment.id, 'CANCELLED')} className="text-[10px] px-2 py-1 rounded bg-red-100 text-red-600 hover:bg-red-200">Cancelar</button>
                    </>
                  )}
                  {appointment.status === 'CONFIRMED' && (
                    <>
                      <button onClick={() => onUpdateStatus(appointment.id, 'COMPLETED')} className="text-[10px] px-2 py-1 rounded bg-green-600 text-white hover:bg-green-700">Completar</button>
                      <button onClick={() => onUpdateStatus(appointment.id, 'NO_SHOW')} className="text-[10px] px-2 py-1 rounded bg-stone-100 text-stone-600 hover:bg-stone-200">No presentado</button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
