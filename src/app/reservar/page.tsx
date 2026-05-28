import { BookingWizard } from '@/components/booking/BookingWizard';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function ReservarPage() {
  return (
    <div className="min-h-screen bg-[var(--pv-marble)]">
      <header className="sticky top-0 z-50 border-b border-[var(--glass-border)] bg-[var(--glass-bg)] shadow-sm backdrop-blur-md">
        <div className="mx-auto flex h-16 sm:h-20 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 rotate-12 items-center justify-center rounded-full bg-[var(--pv-gold)] shadow-lg">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="font-roman text-base sm:text-lg font-bold tracking-tight text-[var(--pv-ink)]">PV ABOGADAS</div>
            </div>
          </Link>

          <Link href="/" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--pv-navy)] transition-colors hover:text-[var(--pv-gold)]">
            <ArrowLeft size={14} />
            Inicio
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-3 py-3 sm:px-6 sm:py-8 lg:py-12">
        <section className="neo-card !p-3 sm:!p-6 lg:!p-8">
          <div className="mx-auto mb-4 max-w-2xl text-center sm:mb-8">
            <h1 className="font-roman text-2xl font-bold uppercase tracking-tight text-[var(--pv-navy)] sm:text-4xl">Reserva tu consulta</h1>
            <p className="mt-2 hidden text-sm leading-relaxed text-[var(--pv-navy)]/70 sm:block sm:text-base">
              Elige abogada, trámite, fecha y completa tus datos. Si vienes desde Mi Portal, tus datos aparecerán prellenados.
            </p>
          </div>

          <BookingWizard />
        </section>
      </main>
    </div>
  );
}
