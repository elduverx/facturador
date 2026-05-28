import { AppointmentLookup } from '@/components/booking/AppointmentLookup';
import { ArrowLeft, CalendarCheck, CreditCard, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function PortalPage() {
  return (
    <div className="min-h-screen bg-[var(--pv-marble)]">
      {/* Header - Glassmorphism */}
      <header className="bg-[var(--glass-bg)] backdrop-blur-md border-b border-[var(--glass-border)] shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-[var(--pv-gold)] rounded-full flex items-center justify-center shadow-lg transform rotate-12 group-hover:rotate-0 transition-transform">
              <ShieldCheck className="text-white w-6 h-6" />
            </div>
            <div>
              <div className="font-roman text-lg font-bold tracking-tight text-[var(--pv-ink)]">PV ABOGADAS</div>
              <p className="text-[9px] uppercase tracking-[0.2em] text-[var(--pv-gold)] font-bold">Área privada</p>
            </div>
          </Link>
          
          <nav className="flex items-center gap-6">
             <Link href="/" className="text-[10px] uppercase tracking-[0.2em] font-bold text-[var(--pv-navy)] hover:text-[var(--pv-gold)] transition-colors flex items-center gap-2">
                <ArrowLeft size={14} />
                Inicio
             </Link>
             <div className="h-4 w-px bg-[var(--glass-border)]"></div>
             <div className="w-8 h-8 rounded-full bg-[var(--pv-marble)] border border-[var(--pv-gold)] flex items-center justify-center text-[var(--pv-gold)] font-bold text-xs">
                C
             </div>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <section className="neo-card !p-4 sm:!p-5 mb-5 sm:mb-6">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--pv-gold)]/10 text-[var(--pv-gold)]">
                  <ShieldCheck size={22} />
                </div>
                <div className="min-w-0">
                  <h1 className="font-roman text-2xl font-bold uppercase tracking-tight text-[var(--pv-ink)] sm:text-3xl">Mi Portal</h1>
                  <p className="mt-1 max-w-3xl text-sm leading-relaxed text-[var(--pv-navy)]/70">
                    Accede con el email y telefono de tu reserva para ver notificaciones, estado de tu caso, citas y pagos pendientes.
                  </p>
                </div>
              </div>
              <div className="mt-4 grid gap-2 text-xs font-semibold text-[var(--pv-navy)]/75 sm:grid-cols-3">
                <div className="flex items-start gap-2 rounded-xl bg-[var(--pv-marble)] px-3 py-2">
                  <LockKeyhole size={14} className="mt-0.5 shrink-0 text-[var(--pv-gold)]" />
                  <span>Acceso solo con email y telefono coincidentes.</span>
                </div>
                <div className="flex items-start gap-2 rounded-xl bg-[var(--pv-marble)] px-3 py-2">
                  <CreditCard size={14} className="mt-0.5 shrink-0 text-[var(--pv-gold)]" />
                  <span>Pagos pendientes claramente visibles.</span>
                </div>
                <div className="flex items-start gap-2 rounded-xl bg-[var(--pv-marble)] px-3 py-2">
                  <CalendarCheck size={14} className="mt-0.5 shrink-0 text-[var(--pv-gold)]" />
                  <span>Pagos y citas actualizados desde el panel.</span>
                </div>
              </div>
            </div>

            <aside className="rounded-2xl bg-[var(--pv-ink)] p-4 text-white shadow-xl relative overflow-hidden">
              <div className="absolute -right-5 -bottom-6 opacity-10">
                <ShieldCheck size={110} />
              </div>
              <div className="relative z-10">
              <h2 className="font-roman text-sm font-bold uppercase tracking-wide text-[var(--pv-gold)]">No puedes acceder?</h2>
              <p className="mt-2 text-xs leading-relaxed text-white/70">
                Revisa que el email y el telefono sean exactamente los mismos que usaste al reservar.
              </p>
              <a href="/#contacto" className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-white/15">
                <Mail size={14} />
                Contactar
              </a>
              </div>
            </aside>
          </div>
        </section>

        <section className="min-w-0">
          <AppointmentLookup compact />
        </section>
      </main>

      <footer className="mt-20 py-12 border-t border-[var(--glass-border)] bg-white/30 text-center">
         <p className="text-[10px] uppercase tracking-[0.4em] text-[var(--pv-navy)] font-bold opacity-40">
            PV ABOGADAS &copy; {new Date().getFullYear()} - Consultorio de Extranjería
         </p>
      </footer>
    </div>
  );
}
