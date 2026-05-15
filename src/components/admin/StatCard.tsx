interface StatCardProps {
  title: string;
  counts: Record<string, number>;
  total: number;
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
  isActive: boolean;
  statusLabels: Record<string, string>;
  statusColors: Record<string, string>;
}

export function StatCard({
  title,
  counts,
  total,
  icon,
  color,
  onClick,
  isActive,
  statusLabels,
  statusColors,
}: StatCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`card text-left w-full transition-all ${
        isActive ? 'ring-2 ring-[var(--pv-gold)]' : 'hover:border-[var(--pv-gold)]'
      }`}
    >
      <h2 className="font-legal text-sm text-[var(--pv-navy)] mb-4 flex items-center gap-2">
        {icon}
        {title}
      </h2>
      <div className="flex flex-wrap gap-2">
        {['PENDING', 'CONFIRMED', 'CANCELLED'].map((status) => (
          <span
            key={status}
            className={`text-[10px] px-2 py-0.5 rounded-full border ${
              statusColors[status] || ''
            }`}
          >
            {statusLabels[status] || status}:{' '}
            <span className="font-semibold">{counts[status] || 0}</span>
          </span>
        ))}
      </div>
      <div className="flex justify-between items-end mt-3">
        <div className="text-[10px] text-[var(--pv-muted)]">Total: {total}</div>
        <div className="text-[10px] font-semibold text-[var(--pv-navy)]">Ver detalle</div>
      </div>
    </button>
  );
}
