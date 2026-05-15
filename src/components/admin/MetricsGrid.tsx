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
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-legal text-sm text-[var(--pv-navy)] flex items-center gap-2">
          Metricas de negocio
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-md bg-[#fff8e8]/70 border border-[var(--pv-line)] p-4 shadow-sm">
          <div className="text-[10px] uppercase tracking-wider text-[var(--pv-muted)] font-bold mb-1">Tasa No-Show</div>
          <div className="text-2xl font-bold text-[var(--pv-navy)]">{noShowRate !== null ? `${noShowRate.toFixed(1)}%` : '-'}</div>
          <div className="text-[10px] text-[var(--pv-muted)] mt-1">{noShowCount}/{attendedTotal || 0} citas finalizadas</div>
        </div>

        <div className="rounded-md bg-[#fff8e8]/70 border border-[var(--pv-line)] p-4 shadow-sm">
          <div className="text-[10px] uppercase tracking-wider text-[var(--pv-muted)] font-bold mb-1">Conversion Web</div>
          <div className="text-2xl font-bold text-[var(--pv-navy)]">{conversionRate !== null ? `${conversionRate.toFixed(1)}%` : '-'}</div>
          <div className="text-[10px] text-[var(--pv-muted)] mt-1">{convertedCount}/{totalCreated || 0} solicitudes</div>
        </div>

        <div className="rounded-md bg-[#fff8e8]/70 border border-[var(--pv-line)] p-4 shadow-sm">
          <div className="text-[10px] uppercase tracking-wider text-[var(--pv-muted)] font-bold mb-1">Facturacion Est.</div>
          <div className="text-2xl font-bold text-[var(--pv-navy)]">{revenueLabel}</div>
          <div className="text-[10px] text-[var(--pv-muted)] mt-1">{completedCount} citas completadas</div>
        </div>
      </div>

      <div className="text-[10px] text-[var(--pv-muted)] mt-4 italic">
        * Estimacion basada en precios de servicios y estado de citas.
      </div>
    </div>
  );
}
