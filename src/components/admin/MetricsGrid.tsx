import { TrendingUp, Users, Target, Euro } from 'lucide-react';

interface MetricsGridProps {
  noShowRate: number | null;
  noShowCount: number;
  attendedTotal: number;
  conversionRate: number | null;
  convertedCount: number;
  totalCreated: number;
  revenueLabel: string;
  completedCount: number;
}

export function MetricsGrid({
  noShowRate,
  noShowCount,
  attendedTotal,
  conversionRate,
  convertedCount,
  totalCreated,
  revenueLabel,
  completedCount,
}: MetricsGridProps) {
  return (
    <div className="neo-card !p-8 shadow-xl">
      <div className="flex items-center gap-3 mb-8">
         <div className="p-2 bg-[var(--pv-gold)] text-white rounded-xl shadow-md">
            <TrendingUp size={20} />
         </div>
         <h2 className="text-xl font-bold font-roman uppercase text-[var(--pv-ink)] tracking-tight">
          Análisis de Rendimiento
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-[var(--pv-marble)] shadow-inner border border-white/50 group hover:bg-white hover:shadow-lg transition-all duration-500">
          <div className="flex items-center justify-between mb-4">
             <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--pv-gold)] font-black">Tasa No-Show</div>
             <Users size={14} className="text-[var(--pv-gold)] opacity-40 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="text-3xl font-black text-[var(--pv-navy)]">{noShowRate !== null ? `${noShowRate.toFixed(1)}%` : '-'}</div>
          <div className="text-[10px] font-bold text-[var(--pv-navy)] opacity-40 mt-3 uppercase tracking-widest">{noShowCount}/{attendedTotal || 0} Citas Concluidas</div>
        </div>

        <div className="p-6 rounded-2xl bg-[var(--pv-marble)] shadow-inner border border-white/50 group hover:bg-white hover:shadow-lg transition-all duration-500">
          <div className="flex items-center justify-between mb-4">
             <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--pv-gold)] font-black">Conversión</div>
             <Target size={14} className="text-[var(--pv-gold)] opacity-40 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="text-3xl font-black text-[var(--pv-navy)]">{conversionRate !== null ? `${conversionRate.toFixed(1)}%` : '-'}</div>
          <div className="text-[10px] font-bold text-[var(--pv-navy)] opacity-40 mt-3 uppercase tracking-widest">{convertedCount}/{totalCreated || 0} Solicitudes Web</div>
        </div>

        <div className="p-6 rounded-2xl bg-[var(--pv-marble)] shadow-inner border border-white/50 group hover:bg-white hover:shadow-lg transition-all duration-500">
          <div className="flex items-center justify-between mb-4">
             <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--pv-gold)] font-black">Facturación Est.</div>
             <Euro size={14} className="text-[var(--pv-gold)] opacity-40 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="text-3xl font-black text-[var(--pv-navy)]">{revenueLabel}</div>
          <div className="text-[10px] font-bold text-[var(--pv-navy)] opacity-40 mt-3 uppercase tracking-widest">{completedCount} Citas Facturables</div>
        </div>
      </div>

      <div className="text-[9px] font-bold text-[var(--pv-navy)] opacity-30 mt-6 uppercase tracking-[0.2em] italic flex items-center gap-2">
        <span className="w-1.5 h-1.5 bg-[var(--pv-gold)] rounded-full"></span>
        Cálculos basados en valores de servicios y estados de cita validados.
      </div>
    </div>
  );
}
