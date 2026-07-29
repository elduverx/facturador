import Link from 'next/link';

export function HomeFooter() {
  return (
    <footer className="bg-[var(--pv-navy)] text-white py-12 sm:py-16 border-t border-[var(--pv-gold)]/30">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-center md:items-start mb-10 text-center md:text-left">
          <div className="flex flex-col items-center md:items-start gap-3 opacity-90">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-lg border-2 border-[var(--pv-gold)] overflow-hidden shrink-0 bg-white">
              <img src="/logopv.jpeg" alt="PV Abogadas" className="w-full h-full object-cover" />
            </div>
            <div className="font-roman text-lg sm:text-xl font-bold tracking-tight text-white uppercase mt-2">PV Abogadas</div>
          </div>
          
          <div className="flex flex-col items-center md:items-start">
            <h4 className="text-[10px] uppercase tracking-widest text-[var(--pv-gold)] font-bold mb-3">Nuestra Oficina</h4>
            <a 
              href="https://www.google.com/maps/search/?api=1&query=C/+de+Sant+Ignasi+de+Loiola,+21,+46008+Valencia" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-white/80 text-sm leading-relaxed max-w-[250px] hover:text-[var(--pv-gold)] transition-colors group flex items-start text-center md:text-left"
            >
              <span>
                C/ de Sant Ignasi de Loiola, 21<br />
                Entresuelo, Extramurs<br />
                46008 València, Valencia
                <span className="block mt-1 text-[10px] uppercase tracking-widest text-[var(--pv-gold)] opacity-0 group-hover:opacity-100 transition-opacity">
                  Ver en Google Maps &rarr;
                </span>
              </span>
            </a>
          </div>

          <div className="flex flex-col items-center md:items-end md:text-right">
            <h4 className="text-[10px] uppercase tracking-widest text-[var(--pv-gold)] font-bold mb-3">Enlaces Legales</h4>
            <div className="flex flex-col gap-2 opacity-60 text-sm">
              <Link href="/aviso-legal" className="hover:text-[var(--pv-gold)] transition-colors text-white">Aviso Legal</Link>
              <Link href="/politica-privacidad" className="hover:text-[var(--pv-gold)] transition-colors text-white">Política de Privacidad</Link>
              <Link href="/cookies" className="hover:text-[var(--pv-gold)] transition-colors text-white">Política de Cookies</Link>
              <Link href="/faq" className="hover:text-[var(--pv-gold)] transition-colors text-white mt-2">Preguntas Frecuentes</Link>
              <Link href="/contacto" className="hover:text-[var(--pv-gold)] transition-colors text-white">Contactar Soporte</Link>
            </div>
          </div>
        </div>
        
        <div className="pt-8 border-t border-white/10 text-center">
          <div className="text-[9px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] opacity-40 font-bold text-white">
            &copy; {new Date().getFullYear()} PV Abogadas - Todos los derechos reservados
          </div>
        </div>
      </div>
    </footer>
  );
}
