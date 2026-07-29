import { PublicHeader } from '@/components/public/PublicHeader';
import { HomeFooter } from '@/components/public/HomeFooter';
import { WhatsAppButton } from '@/components/public/WhatsAppButton';
import { Scale } from 'lucide-react';

export default function AvisoLegalPage() {
  return (
    <div className="min-h-screen bg-[var(--pv-marble)] font-sans flex flex-col relative">
      <PublicHeader />
      
      <main className="flex-1 max-w-4xl mx-auto px-6 py-32 sm:py-40 w-full relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--pv-gold)]/10 text-[var(--pv-gold)] text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-6 border border-[var(--pv-gold)]/20 shadow-sm">
            <Scale size={14} /> Información Legal
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-roman uppercase text-[var(--pv-navy)] tracking-tight">Aviso Legal</h1>
        </div>
        
        <div className="neo-card bg-white p-8 sm:p-12 shadow-2xl">
          <div className="prose prose-stone prose-lg max-w-none prose-headings:font-roman prose-headings:uppercase prose-headings:text-[var(--pv-navy)] prose-a:text-[var(--pv-gold)] text-[var(--pv-ink)]">
            <p className="lead font-medium opacity-80">
              En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y Comercio Electrónico (LSSICE), a continuación se exponen los datos identificativos del titular del sitio web:
            </p>
            
            <hr className="border-[var(--glass-border)] my-8" />
            
            <h2 className="flex items-center gap-3"><span className="text-[var(--pv-gold)]">1.</span> Datos Identificativos</h2>
            <ul className="bg-[var(--pv-marble)] p-6 rounded-2xl list-none space-y-3">
              <li><strong className="text-[var(--pv-navy)] uppercase tracking-widest text-xs">Titular:</strong> PV Abogadas</li>
              <li><strong className="text-[var(--pv-navy)] uppercase tracking-widest text-xs">Domicilio:</strong> C/ de Sant Ignasi de Loiola, 21, Entresuelo, Extramurs, 46008 València, Valencia</li>
              <li><strong className="text-[var(--pv-navy)] uppercase tracking-widest text-xs">Email:</strong> <a href="mailto:info@pvabogadas.com" className="no-underline hover:underline font-bold">info@pvabogadas.com</a></li>
            </ul>

            <h2 className="flex items-center gap-3"><span className="text-[var(--pv-gold)]">2.</span> Propiedad Intelectual e Industrial</h2>
            <p>
              El diseño del portal y sus códigos fuente, así como los logos, marcas y demás signos distintivos que aparecen en el mismo pertenecen a <strong>PV Abogadas</strong> y están protegidos por los correspondientes derechos de propiedad intelectual e industrial. Queda terminantemente prohibida la reproducción parcial o total sin consentimiento previo.
            </p>

            <h2 className="flex items-center gap-3"><span className="text-[var(--pv-gold)]">3.</span> Responsabilidad de los contenidos</h2>
            <p>
              PV Abogadas no se hace responsable de la legalidad de otros sitios web de terceros desde los que pueda accederse al portal. Tampoco respondemos por la legalidad de otros sitios web de terceros, que pudieran estar vinculados o enlazados desde este portal.
            </p>
            <p>
              Nos reservamos el derecho a realizar cambios en el sitio web sin previo aviso, al objeto de mantener actualizada su información, añadiendo, modificando, corrigiendo o eliminando los contenidos publicados o el diseño del portal en cualquier momento.
            </p>
          </div>
        </div>
      </main>

      <HomeFooter />
      <WhatsAppButton />
    </div>
  );
}
