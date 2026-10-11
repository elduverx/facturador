// Branded placeholder for posts without a cover image.
export function CoverFallback({ category }: { category?: string | null }) {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center gap-4 overflow-hidden bg-[var(--pv-navy)]">
      <div className="absolute -left-16 -top-16 h-48 w-48 rounded-full bg-[var(--pv-gold)]/20 blur-3xl" aria-hidden />
      <div className="absolute -right-16 -bottom-16 h-48 w-48 rounded-full bg-[var(--pv-gold)]/10 blur-3xl" aria-hidden />
      <div className="absolute inset-4 rounded-xl border border-[var(--pv-gold)]/20" aria-hidden />
      <img src="/logopv.jpeg" alt="" className="relative h-16 w-16 rounded-full border-2 border-[var(--pv-gold)] object-cover shadow-xl" />
      <span className="relative font-roman text-[11px] font-bold uppercase tracking-[0.3em] text-[var(--pv-gold)]">
        {category || 'PV Abogadas'}
      </span>
    </div>
  );
}
