import { AppointmentData } from '@/types/booking';
import { STATUS_COLORS, STATUS_LABELS, formatDateShort } from '@/lib/constants';
import { AlertTriangle, Clock, User, Check, X, ShieldAlert } from 'lucide-react';

interface UrgentSectionProps {
  urgentItems: { appointment: AppointmentData; label: string }[];
  urgentCount: number;
  onUpdateStatus: (id: string, status: string) => void;
}

export function UrgentSection({ urgentItems, urgentCount, onUpdateStatus }: UrgentSectionProps) {
  return (
    <div className="neo-card !p-8 h-full border-t-8 border-t-red-500 shadow-2xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-50 text-red-600 rounded-xl shadow-inner">
             <AlertTriangle size={22} className="animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-roman uppercase tracking-tight text-[var(--pv-ink)]">Alertas Críticas</h2>
            <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">Atención Inmediata</p>
          </div>
        </div>
        <span className="flex items-center justify-center w-10 h-10 rounded-full bg-red-600 text-white font-black text-sm shadow-lg shadow-red-200">
           {urgentCount}
        </span>
      </div>

      {urgentItems.length === 0 ? (
        <div className="py-20 text-center bg-[var(--pv-marble)] rounded-2xl border-2 border-dashed border-red-100">
           <p className="text-sm font-bold text-[var(--pv-navy)] opacity-30 uppercase tracking-widest">Sin Alertas de Combate</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          {urgentItems.map(({ appointment, label }, idx) => {
            const dateStr = typeof appointment.date === 'string' ? appointment.date.split('T')[0] : new Date(appointment.date).toISOString().split('T')[0];
            return (
              <div key={appointment.id} className="p-5 rounded-2xl bg-white border border-red-100 shadow-sm hover:shadow-xl transition-all duration-500 group">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-600 px-3 py-1 bg-red-50 rounded-lg">{label}</span>
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border shadow-sm ${STATUS_COLORS[appointment.status] || ''}`}>
                    {STATUS_LABELS[appointment.status] || appointment.status}
                  </span>
                </div>
                
                <div className="mb-4">
                  <h4 className="text-base font-bold text-[var(--pv-ink)] group-hover:text-red-600 transition-colors">{appointment.clientName}</h4>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                     <div className="flex items-center gap-1 text-[10px] font-bold text-[var(--pv-navy)] opacity-50 uppercase">
                        <Clock size={12} /> {formatDateShort(dateStr)} · {appointment.startTime}
                     </div>
                     <div className="flex items-center gap-1 text-[10px] font-bold text-[var(--pv-navy)] opacity-50 uppercase">
                        <User size={12} /> {appointment.service?.name || 'Consulta'}
                     </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-[var(--pv-marble)]">
                  {appointment.status === 'PENDING' && (
                    <>
                      <button onClick={() => onUpdateStatus(appointment.id, 'CONFIRMED')} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 shadow-md shadow-emerald-100 transition-all">
                        <Check size={14} /> Confirmar
                      </button>
                      <button onClick={() => onUpdateStatus(appointment.id, 'CANCELLED')} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all">
                        <X size={14} /> Anular
                      </button>
                    </>
                  )}
                  {appointment.status === 'CONFIRMED' && (
                    <>
                      <button onClick={() => onUpdateStatus(appointment.id, 'COMPLETED')} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[var(--pv-gold)] text-white text-[10px] font-black uppercase tracking-widest hover:brightness-110 shadow-lg shadow-[var(--pv-gold)]/20 transition-all">
                        Finalizar
                      </button>
                      <button onClick={() => onUpdateStatus(appointment.id, 'NO_SHOW')} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[var(--pv-marble)] text-[var(--pv-navy)] text-[10px] font-black uppercase tracking-widest hover:bg-stone-200 transition-all">
                        <ShieldAlert size={14} /> No Presentado
                      </button>
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
