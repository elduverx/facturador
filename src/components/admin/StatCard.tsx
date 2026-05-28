import { ChevronRight } from 'lucide-react';

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
      className={`neo-card text-left w-full transition-all group relative overflow-hidden ${
        isActive ? 'ring-4 ring-[var(--pv-gold)] ring-opacity-20 shadow-2xl scale-[1.02] bg-white' : 'hover:border-[var(--pv-gold)]/50'
      }`}
    >
      <div className={`absolute top-0 left-0 w-1.5 h-full ${isActive ? 'bg-[var(--pv-gold)]' : 'bg-[var(--pv-gold)]/20'}`}></div>
      
      <div className="flex items-center gap-4 mb-6">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isActive ? 'bg-[var(--pv-gold)] text-white shadow-lg' : 'bg-[var(--pv-marble)] text-[var(--pv-gold)] shadow-inner'}`}>
          {icon}
        </div>
        <h2 className="font-roman font-bold text-sm uppercase tracking-widest text-[var(--pv-ink)]">
          {title}
        </h2>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {['PENDING', 'CONFIRMED', 'CANCELLED'].map((status) => (
          <span
            key={status}
            className={`text-[9px] font-black uppercase tracking-tighter px-2.5 py-1 rounded-lg border shadow-sm ${
              statusColors[status] || ''
            }`}
          >
            {statusLabels[status] || status}:{' '}
            <span className="font-black ml-1">{counts[status] || 0}</span>
          </span>
        ))}
      </div>

      <div className="flex justify-between items-center mt-auto pt-4 border-t border-[var(--pv-marble)]">
        <div className="text-[10px] font-black text-[var(--pv-navy)] opacity-40 uppercase tracking-widest">Total: {total}</div>
        <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest transition-all ${isActive ? 'text-[var(--pv-gold)] translate-x-1' : 'text-[var(--pv-navy)] group-hover:text-[var(--pv-gold)] group-hover:translate-x-1'}`}>
          Explorar <ChevronRight size={12} />
        </div>
      </div>
    </button>
  );
}
