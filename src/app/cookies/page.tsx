import { PublicHeader } from '@/components/public/PublicHeader';
import { HomeFooter } from '@/components/public/HomeFooter';
import { WhatsAppButton } from '@/components/public/WhatsAppButton';
import { Cookie } from 'lucide-react';

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-[var(--pv-marble)] font-sans flex flex-col relative">
      <PublicHeader />
      
      <main className="flex-1 max-w-4xl mx-auto px-6 py-32 sm:py-40 w-full relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--pv-gold)]/10 text-[var(--pv-gold)] text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-6 border border-[var(--pv-gold)]/20 shadow-sm">
            <Cookie size={14} /> Preferencias Web
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-roman uppercase text-[var(--pv-navy)] tracking-tight">Política de Cookies</h1>
        </div>
        
        <div className="neo-card bg-white p-8 sm:p-12 shadow-2xl">
          <div className="prose prose-stone prose-lg max-w-none prose-headings:font-roman prose-headings:uppercase prose-headings:text-[var(--pv-navy)] prose-a:text-[var(--pv-gold)] text-[var(--pv-ink)]">
            <p className="lead font-medium opacity-80">
              Esta web utiliza cookies para facilitar la navegación y proporcionar una mejor experiencia.
            </p>
            
            <hr className="border-[var(--glass-border)] my-8" />
            
            <h2 className="flex items-center gap-3"><span className="text-[var(--pv-gold)]">1.</span> ¿Qué son las cookies?</h2>
            <p>
              Una cookie es un fichero que se descarga en su ordenador al acceder a determinadas páginas web. Las cookies permiten a una página web, entre otras cosas, almacenar y recuperar información sobre los hábitos de navegación de un usuario o de su equipo.
            </p>

            <h2 className="flex items-center gap-3"><span className="text-[var(--pv-gold)]">2.</span> Tipos de cookies que utilizamos</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
              <div className="bg-[var(--pv-marble)] p-6 rounded-2xl border border-[var(--glass-border)]">
                <h3 className="text-lg font-bold text-[var(--pv-navy)] uppercase tracking-tight mt-0 mb-2">Técnicas</h3>
                <p className="text-sm m-0 opacity-80">Necesarias para la navegación y el buen funcionamiento de nuestra página web.</p>
              </div>
              <div className="bg-[var(--pv-marble)] p-6 rounded-2xl border border-[var(--glass-border)]">
                <h3 className="text-lg font-bold text-[var(--pv-navy)] uppercase tracking-tight mt-0 mb-2">Personalización</h3>
                <p className="text-sm m-0 opacity-80">Permiten acceder al servicio con unas características predefinidas en función de ciertos criterios.</p>
              </div>
              <div className="bg-[var(--pv-marble)] p-6 rounded-2xl border border-[var(--glass-border)]">
                <h3 className="text-lg font-bold text-[var(--pv-navy)] uppercase tracking-tight mt-0 mb-2">Análisis</h3>
                <p className="text-sm m-0 opacity-80">Nos permiten cuantificar el número de usuarios y medir estadísticamente el uso de la web.</p>
              </div>
            </div>

            <h2 className="flex items-center gap-3"><span className="text-[var(--pv-gold)]">3.</span> Desactivación de cookies</h2>
            <p>
              Puede usted permitir, bloquear o eliminar las cookies instaladas en su equipo mediante la configuración de las opciones del navegador instalado en su ordenador (Chrome, Safari, Firefox, Edge, etc.).
            </p>
          </div>
        </div>
      </main>

      <HomeFooter />
      <WhatsAppButton />
    </div>
  );
}
