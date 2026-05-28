import { AppointmentData } from '@/types/booking';
import { STATUS_LABELS, STATUS_COLORS, formatDateShort } from '@/lib/constants';
import { Clock, Phone, Check, X, ShieldAlert, CreditCard } from 'lucide-react';

interface AppointmentListItemProps {
  appt: AppointmentData;
  onUpdateStatus: (id: string, status: string) => void;
  showDate?: boolean;
}

export function AppointmentListItem({ appt, onUpdateStatus, showDate }: AppointmentListItemProps) {
  const dateStr = typeof appt.date === 'string' ? appt.date.split('T')[0] : new Date(appt.date).toISOString().split('T')[0];

  return (
    <div className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-white/50 hover:border-[var(--pv-gold)] transition-all duration-300 bg-white/70 hover:bg-white hover:shadow-xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-[var(--pv-gold)]/20 group-hover:bg-[var(--pv-gold)] transition-all"></div>
      
      <div className="flex items-center gap-5">
        <div className="text-center bg-[var(--pv-marble)] border border-white rounded-xl px-4 py-2 shadow-inner min-w-[90px]">
          {showDate && <div className="text-[10px] font-black text-[var(--pv-gold)] uppercase tracking-tighter mb-1">{formatDateShort(dateStr)}</div>}
          <div className="flex items-center justify-center gap-1.5 text-sm font-black text-[var(--pv-navy)]">
             <Clock size={12} className="text-[var(--pv-gold)]" />
             {appt.startTime}
          </div>
          <div className="text-[10px] font-bold text-[var(--pv-navy)] opacity-40 uppercase tracking-widest mt-1">Hito</div>
        </div>
        
        <div>
          <div className="text-base font-bold text-[var(--pv-ink)] group-hover:text-[var(--pv-gold)] transition-colors">{appt.clientName}</div>
          <div className="text-xs font-medium text-[var(--pv-navy)] opacity-60 uppercase tracking-tight">{appt.service?.name || 'Consulta Jurídica'}</div>
          <div className="flex items-center gap-3 mt-3">
            <span className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${appt.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
              <CreditCard size={10} />
              {appt.paymentStatus === 'PAID' ? 'Saldado' : 'Pendiente'}
            </span>
            <span className="flex items-center gap-1 text-[9px] font-bold text-[var(--pv-navy)] opacity-40">
               <Phone size={10} /> {appt.clientPhone}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border shadow-sm ${STATUS_COLORS[appt.status] || ''}`}>
          {STATUS_LABELS[appt.status] || appt.status}
        </span>
        
        <div className="flex gap-2">
          {appt.status === 'PENDING' && (
            <>
              <button
                onClick={() => onUpdateStatus(appt.id, 'CONFIRMED')}
                className="p-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-100 transition-all"
                title="Confirmar Cita"
              >
                <Check size={16} />
              </button>
              <button
                onClick={() => onUpdateStatus(appt.id, 'CANCELLED')}
                className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-all"
                title="Anular Cita"
              >
                <X size={16} />
              </button>
            </>
          )}
          {appt.status === 'CONFIRMED' && (
            <>
              <button
                onClick={() => onUpdateStatus(appt.id, 'COMPLETED')}
                className="px-4 py-2 rounded-xl bg-[var(--pv-gold)] text-white text-[10px] font-black uppercase tracking-widest hover:brightness-110 shadow-lg shadow-[var(--pv-gold)]/20 transition-all"
              >
                Finalizar
              </button>
              <button
                onClick={() => onUpdateStatus(appt.id, 'NO_SHOW')}
                className="p-2 rounded-xl bg-[var(--pv-marble)] text-[var(--pv-navy)] hover:bg-stone-200 transition-all"
                title="No Presentado"
              >
                <ShieldAlert size={16} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
