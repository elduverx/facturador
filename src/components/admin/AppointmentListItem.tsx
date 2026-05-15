import { AppointmentData } from '@/types/booking';
import { STATUS_LABELS, STATUS_COLORS, formatDateShort } from '@/lib/constants';

interface AppointmentListItemProps {
  appt: AppointmentData;
  onUpdateStatus: (id: string, status: string) => void;
  showDate?: boolean;
}

export function AppointmentListItem({ appt, onUpdateStatus, showDate }: AppointmentListItemProps) {
  const dateStr = typeof appt.date === 'string' ? appt.date.split('T')[0] : new Date(appt.date).toISOString().split('T')[0];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-md border border-[var(--pv-line)] hover:border-[var(--pv-gold)] transition-colors bg-[#fff8e8]/70">
      <div className="flex items-center gap-3">
        <div className="text-center bg-[#f8f1df] border border-[var(--pv-line)] rounded-md px-3 py-1 min-w-[70px]">
          {showDate && <div className="text-[10px] text-[var(--pv-muted)] mb-0.5">{formatDateShort(dateStr)}</div>}
          <div className="text-sm font-bold text-[var(--pv-navy)]">{appt.startTime}</div>
          <div className="text-[10px] text-[var(--pv-muted)]">{appt.endTime}</div>
        </div>
        <div>
          <div className="text-sm font-semibold text-[var(--pv-navy)]">{appt.clientName}</div>
          <div className="text-xs text-[var(--pv-muted)]">{appt.service?.name || 'Servicio'}</div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full border ${appt.paymentStatus === 'PAID' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
              {appt.paymentStatus === 'PAID' ? 'Pagado' : 'Pago Pendiente'}
            </span>
            <span className="text-[9px] text-stone-400">{appt.clientPhone}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-[10px] px-2 py-1 rounded-full border ${STATUS_COLORS[appt.status] || ''}`}>
          {STATUS_LABELS[appt.status] || appt.status}
        </span>
        
        <div className="flex gap-1">
          {appt.status === 'PENDING' && (
            <>
              <button
                onClick={() => onUpdateStatus(appt.id, 'CONFIRMED')}
              className="text-[10px] px-2 py-1 rounded bg-[var(--pv-navy)] text-white hover:opacity-90 transition-colors"
              >
                Confirmar
              </button>
              <button
                onClick={() => onUpdateStatus(appt.id, 'CANCELLED')}
                className="text-[10px] px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
              >
                Cancelar
              </button>
            </>
          )}
          {appt.status === 'CONFIRMED' && (
            <>
              <button
                onClick={() => onUpdateStatus(appt.id, 'COMPLETED')}
                className="text-[10px] px-2 py-1 rounded bg-green-600 text-white hover:bg-green-700 transition-colors"
              >
                Completar
              </button>
              <button
                onClick={() => onUpdateStatus(appt.id, 'NO_SHOW')}
                className="text-[10px] px-2 py-1 rounded bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors"
              >
                No presentado
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
