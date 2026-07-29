import { PublicHeader } from '@/components/public/PublicHeader';
import { HomeFooter } from '@/components/public/HomeFooter';
import { WhatsAppButton } from '@/components/public/WhatsAppButton';
import { ChevronRight, HelpCircle } from 'lucide-react';
import Link from 'next/link';

const FAQS = [
  {
    q: '¿Cuánto cuesta la primera asesoría?',
    a: (
      <>
        Ofrecemos una primera asesoría donde evaluamos tu caso en detalle (ya sea de Extranjería, Laboral o Familia). Contáctanos para conocer las tarifas actuales. Nuestro compromiso es la transparencia total en costes. Puedes <Link href="/reservar" className="text-[var(--pv-gold)] font-bold hover:underline">reservar tu cita inicial aquí</Link>.
      </>
    ),
  },
  {
    q: '¿Necesito pedir cita previa?',
    a: (
      <>
        Sí, trabajamos exclusivamente con cita previa para dedicar a cada cliente el tiempo y atención que merece. Puedes <Link href="/reservar" className="text-[var(--pv-gold)] font-bold hover:underline">agendar tu cita</Link> fácilmente desde el flujo interactivo de esta web.
      </>
    ),
  },
  {
    q: '¿Qué áreas legales cubren exactamente?',
    a: 'Somos especialistas en tres pilares fundamentales: Extranjería e Inmigración, Derecho Laboral (despidos, contratos) y Derecho de Familia (divorcios, convenios).',
  },
  {
    q: '¿Dónde está ubicada la oficina?',
    a: (
      <>
        Nos encontramos en Valencia: <a href="https://www.google.com/maps/search/?api=1&query=C/+de+Sant+Ignasi+de+Loiola,+21,+46008+Valencia" target="_blank" rel="noopener noreferrer" className="text-[var(--pv-gold)] font-bold hover:underline">C/ de Sant Ignasi de Loiola, 21, Entresuelo, Extramurs, 46008 València</a>.
      </>
    ),
  },
  {
    q: '¿Puedo hacer la consulta online (videollamada)?',
    a: (
      <>
        Sí. Durante el proceso de <Link href="/reservar" className="text-[var(--pv-gold)] font-bold hover:underline">reserva de cita</Link> podrás elegir la modalidad: Presencial en nuestro despacho o de forma Online mediante videollamada.
      </>
    ),
  },
  {
    q: 'Ya soy cliente, ¿cómo puedo ver el estado de mi expediente?',
    a: (
      <>
        Si ya eres cliente, puedes acceder a nuestro <Link href="/portal" className="text-[var(--pv-gold)] font-bold hover:underline">Portal de Cliente</Link>. Desde allí podrás ver el estado de tus casos en proceso, descargar documentos y subir documentación que te hayamos solicitado.
      </>
    ),
  },
  {
    q: '¿Tiene algún coste agendar una cita sobre un expediente que ya está abierto?',
    a: (
      <>
        No, si ya eres cliente y tienes un caso activo con nosotras, la <Link href="/reservar" className="text-[var(--pv-gold)] font-bold hover:underline">cita de seguimiento sobre tu expediente es completamente gratuita</Link>. Solo tendrás que pagar si quieres consultar sobre un caso nuevo y diferente.
      </>
    ),
  },
  {
    q: '¿Cómo subo documentos a mi portal si me lo piden?',
    a: (
      <>
        Es muy sencillo. Inicia sesión en <Link href="/portal" className="text-[var(--pv-gold)] font-bold hover:underline">Mi Portal</Link> introduciendo tu email y NIE. En tu área privada verás una sección de documentos donde podrás subir los archivos de forma segura desde tu ordenador o móvil.
      </>
    ),
  }
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-[var(--pv-marble)] font-sans flex flex-col relative">
      <PublicHeader />
      
      <main className="flex-1 max-w-4xl mx-auto px-6 py-32 sm:py-40 w-full relative z-10">
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1 rounded-full bg-[var(--pv-gold)]/10 text-[var(--pv-gold)] text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-4 sm:mb-6 border border-[var(--pv-gold)]/20">
             <HelpCircle size={14} />
             Dudas Comunes
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold font-roman uppercase text-[var(--pv-navy)] tracking-tight mb-4">Preguntas Frecuentes</h1>
          <p className="text-sm sm:text-base text-[var(--pv-navy)] opacity-60">Encuentra respuestas rápidas a las consultas más habituales de nuestros clientes.</p>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {FAQS.map((faq, i) => (
            <details key={i} className="bg-white rounded-2xl shadow-sm border border-[var(--glass-border)] group cursor-pointer marker:content-[''] hover:shadow-md transition-all p-4 sm:p-6">
               <summary className="flex items-center justify-between font-bold text-[var(--pv-navy)] text-sm sm:text-lg list-none outline-none pr-2">
                  <span className="pr-4">{faq.q}</span>
                  <span className="text-[var(--pv-gold)] shrink-0 transform transition-transform duration-300 group-open:rotate-90">
                     <ChevronRight size={16} className="sm:w-5 sm:h-5" />
                  </span>
               </summary>
               <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-[var(--glass-border)] text-xs sm:text-base text-[var(--pv-navy)] opacity-70 leading-relaxed">
                  {faq.a}
               </div>
            </details>
          ))}
        </div>
      </main>

      <HomeFooter />
      <WhatsAppButton />
    </div>
  );
}
