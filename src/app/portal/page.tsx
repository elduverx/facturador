import { AppointmentLookup } from '@/components/booking/AppointmentLookup';

export default function PortalPage() {
  return (
    <div className="pv-page lg:h-screen lg:overflow-hidden">
      <header className="pv-dark-panel border-b border-[rgba(200,170,106,0.42)]">
        <div className="pv-shell h-16 flex items-center justify-between gap-4">
          <a href="/" className="flex items-center gap-3">
            <div className="pv-seal w-10 h-10 rounded-full flex items-center justify-center font-legal font-bold">PV</div>
            <div>
              <div className="font-legal text-lg text-[#f8f1df]">PV Abogadas</div>
              <p className="text-[9px] uppercase tracking-[0.2em] text-[#c8aa6a]">Area privada</p>
            </div>
          </a>
          <nav className="flex items-center gap-4 text-[11px] uppercase tracking-[0.16em] text-[#ead9ad]">
            <a href="/" className="hover:text-white transition-colors">Inicio</a>
            <a href="/blog" className="hover:text-white transition-colors">Blog</a>
          </nav>
        </div>
      </header>

      <main className="pv-shell py-4 lg:h-[calc(100vh-4rem)]">
        <section className="pv-frame pv-paper h-full p-3 sm:p-4 lg:p-5">
          <div className="h-full min-h-0">
            <AppointmentLookup compact />
          </div>
        </section>
      </main>
    </div>
  );
}
