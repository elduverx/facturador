import { AppointmentLookup } from '@/components/booking/AppointmentLookup';
import { ArrowLeft, ShieldCheck, Mail } from 'lucide-react';
import Link from 'next/link';

export default async function PortalPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const params = await searchParams;
  const appointmentId = typeof params?.appointmentId === 'string' ? params.appointmentId : undefined;
  const paymentSuccess = params?.payment === 'success';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--pv-ink)] via-[var(--pv-navy)] to-black relative font-sans text-white selection:bg-[var(--pv-gold)] selection:text-white">
      {/* Elegant Gradient Overlay */}
      <div className="fixed inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none mix-blend-overlay z-0" />

      {/* Header - Glassmorphism */}
      <header className="relative z-50 bg-white/5 backdrop-blur-md border-b border-white/10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-[var(--pv-gold)] rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(196,161,115,0.4)] transform rotate-12 group-hover:rotate-0 transition-transform duration-500">
              <ShieldCheck className="text-white w-6 h-6" />
            </div>
            <div>
              <div className="font-roman text-lg font-bold tracking-tight text-white drop-shadow-md">PV ABOGADAS</div>
              <p className="text-[9px] uppercase tracking-[0.2em] text-[var(--pv-gold)] font-bold">Área privada</p>
            </div>
          </Link>
          
          <nav className="flex items-center gap-6">
             <Link href="/" className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/70 hover:text-[var(--pv-gold)] transition-colors flex items-center gap-2">
                <ArrowLeft size={14} />
                Volver
             </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        
        {/* Intro Section */}
        <div className="mb-10 text-center animate-fade-in-up">
          <div className="inline-flex items-center justify-center gap-2 mb-4 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-[var(--pv-gold)] backdrop-blur-md">
            <ShieldCheck size={14} />
            Acceso Seguro
          </div>
          <h1 className="font-roman text-4xl sm:text-5xl lg:text-6xl font-bold uppercase tracking-tight text-white drop-shadow-lg mb-4">
            Mi <span className="text-[var(--pv-gold)]">Portal</span>
          </h1>
          <p className="max-w-2xl mx-auto text-sm sm:text-base leading-relaxed text-white/70">
            Visualiza el estado de tu expediente, descarga documentos importantes, gestiona tus próximas citas y liquida pagos pendientes con total seguridad.
          </p>
        </div>

        {/* The Lookup Component */}
        <div className="glass-panel p-2 sm:p-4 rounded-3xl bg-white/5 backdrop-blur-lg border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--pv-gold)] rounded-full mix-blend-overlay filter blur-[120px] opacity-20 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-overlay filter blur-[120px] opacity-10 pointer-events-none"></div>
          
          <div className="relative z-10">
            <AppointmentLookup compact glass appointmentId={appointmentId} paymentSuccess={paymentSuccess} />
          </div>
        </div>

        {/* Footer Support Notice */}
        <div className="mt-12 text-center">
           <p className="text-xs text-white/40 uppercase tracking-widest font-bold">¿Problemas para acceder?</p>
           <a href="/#contacto" className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-white transition-all duration-300">
             <Mail size={14} className="text-[var(--pv-gold)]" />
             Contactar Soporte
           </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 py-8 border-t border-white/5 bg-black/20 text-center backdrop-blur-md">
         <p className="text-[10px] uppercase tracking-[0.4em] text-white/30 font-bold">
            PV ABOGADAS &copy; {new Date().getFullYear()} - Consultorio de Extranjería
         </p>
      </footer>
    </div>
  );
}
