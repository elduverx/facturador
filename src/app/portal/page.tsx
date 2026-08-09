import { AppointmentLookup } from '@/components/booking/AppointmentLookup';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default async function PortalPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const params = await searchParams;
  const appointmentId = typeof params?.appointmentId === 'string' ? params.appointmentId : undefined;
  const paymentSuccess = params?.payment === 'success';

  return (
    <div className="min-h-screen relative font-sans text-white selection:bg-[var(--pv-gold)] selection:text-white flex flex-col bg-[#0f172a]/90 bg-[url('/loginm.png')] bg-cover bg-center bg-no-repeat bg-fixed bg-blend-overlay">
      {/* Header */}
      <header className="relative z-50 bg-[#0f172a]/80 backdrop-blur-md border-b border-white/5 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-full overflow-hidden shadow-[0_0_20px_rgba(196,161,115,0.4)] group-hover:scale-105 transition-transform duration-500 border border-[var(--pv-gold)]/30">
              <img src="/logopv.jpeg" alt="PV Abogadas" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="font-roman text-lg font-bold tracking-tight text-white drop-shadow-sm">PV ABOGADAS</div>
              <p className="text-[9px] uppercase tracking-[0.2em] text-[var(--pv-gold)] font-bold">Área privada</p>
            </div>
          </Link>
          
          <nav className="flex items-center gap-6">
             <Link href="/" className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/70 hover:text-white transition-colors flex items-center gap-2">
                <ArrowLeft size={14} />
                Inicio
             </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full max-w-xl mx-auto px-6 py-12 flex flex-col justify-center">
        <AppointmentLookup appointmentId={appointmentId} paymentSuccess={paymentSuccess} />
      </main>
    </div>
  );
}
