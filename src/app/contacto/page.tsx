import { PublicHeader } from '@/components/public/PublicHeader';
import { HomeFooter } from '@/components/public/HomeFooter';
import { WhatsAppButton } from '@/components/public/WhatsAppButton';
import { Mail, MapPin } from 'lucide-react';

export default function ContactoPage() {
  return (
    <div className="min-h-screen bg-[var(--pv-marble)] font-sans flex flex-col relative">
      <PublicHeader />
      
      <main className="flex-1 max-w-4xl mx-auto px-6 py-32 sm:py-40 w-full relative z-10">
        <h1 className="text-3xl sm:text-5xl font-bold font-roman uppercase text-[var(--pv-navy)] mb-8 tracking-tight text-center">Contactar Soporte</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
          
          <div className="bg-white p-8 rounded-3xl shadow-lg border border-[var(--glass-border)] text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--pv-gold)]/10 text-[var(--pv-gold)] flex items-center justify-center mb-6">
              <Mail size={32} />
            </div>
            <h2 className="font-roman font-bold text-xl uppercase tracking-widest text-[var(--pv-navy)] mb-2">Email</h2>
            <p className="text-[var(--pv-ink)] opacity-70 mb-4">Para consultas generales y soporte.</p>
            <a href="mailto:info@pvabogadas.es" className="text-[var(--pv-gold)] font-bold hover:underline">info@pvabogadas.es</a>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-lg border border-[var(--glass-border)] text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--pv-gold)]/10 text-[var(--pv-gold)] flex items-center justify-center mb-6">
              <MapPin size={32} />
            </div>
            <h2 className="font-roman font-bold text-xl uppercase tracking-widest text-[var(--pv-navy)] mb-2">Oficina</h2>
            <p className="text-[var(--pv-ink)] opacity-70 mb-4">Visítanos en Valencia.</p>
            <a 
              href="https://www.google.com/maps/search/?api=1&query=C/+de+Sant+Ignasi+de+Loiola,+21,+46008+Valencia" 
              target="_blank" rel="noopener noreferrer"
              className="text-[var(--pv-gold)] font-bold hover:underline"
            >
              C/ de Sant Ignasi de Loiola, 21<br/>
              Entresuelo, Extramurs, 46008 València
            </a>
          </div>

        </div>

        <div className="mt-16 text-center">
          <p className="text-sm text-[var(--pv-navy)] opacity-60">También puedes contactarnos rápidamente a través de nuestro WhatsApp haciendo clic en el icono de la esquina inferior derecha.</p>
        </div>
      </main>

      <HomeFooter />
      <WhatsAppButton />
    </div>
  );
}
