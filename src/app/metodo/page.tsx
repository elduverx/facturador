import { HomeNavbar } from '@/components/public/HomeNavbar';
import { HomeFooter } from '@/components/public/HomeFooter';
import { WhatsAppButton } from '@/components/public/WhatsAppButton';
import Link from 'next/link';
import { Calendar, Search, ArrowRight, ShieldCheck, FileText, CheckCircle2 } from 'lucide-react';

export const metadata = {
  title: 'Nuestro Método - PV Abogadas',
  description: 'Conoce cómo trabajamos. Claridad, transparencia y acompañamiento desde el primer día.',
};

const STEPS = [
  {
    number: '01',
    title: 'Reserva tu Cita',
    icon: Calendar,
    desc: 'El primer paso para resolver tu problema es conocernos. Agenda tu cita de forma rápida y sencilla desde nuestra plataforma web.',
    details: [
      'Elige la modalidad que prefieras: Presencial en nuestro despacho en Valencia u Online por videollamada.',
      'Selecciona el área de tu consulta para que podamos prepararnos adecuadamente.',
      'Abónala de forma 100% segura mediante tarjeta y recibe tu confirmación al instante.'
    ]
  },
  {
    number: '02',
    title: 'Asesoría y Estudio',
    icon: Search,
    desc: 'Nos sentamos contigo (física o virtualmente) para escuchar tu caso, revisar tu documentación y trazar una estrategia legal clara.',
    details: [
      'Analizamos la viabilidad de tu caso sin falsas promesas.',
      'Te explicamos las distintas opciones legales disponibles con un lenguaje claro y sin tecnicismos innecesarios.',
      'Te entregamos un presupuesto cerrado y transparente. Sabrás el coste exacto desde el primer momento.'
    ]
  },
  {
    number: '03',
    title: 'Trámite Legal',
    icon: FileText,
    desc: 'Una vez aceptado el presupuesto, nos ponemos en marcha. Iniciamos tu procedimiento y asumimos todo el peso burocrático.',
    details: [
      'Redactamos demandas, contratos, recursos o solicitudes según requiera el caso.',
      'Presentamos toda la documentación de forma telemática para agilizar los plazos.',
      'Nos encargamos de las comunicaciones con la Administración o los tribunales para que tú no tengas que preocuparte de nada.'
    ]
  },
  {
    number: '04',
    title: 'Seguimiento y Resolución',
    icon: ShieldCheck,
    desc: 'Te mantenemos informado en tiempo real y te acompañamos hasta obtener la resolución de tu expediente.',
    details: [
      'Acceso 24/7 a "Mi Portal", tu área privada de cliente donde podrás ver el estado exacto de tu caso.',
      'Intercambio seguro de documentos: sube y descarga archivos directamente desde tu móvil.',
      'Asistencia a juicios, firmas o comparecencias asegurando la máxima defensa de tus intereses.'
    ]
  }
];

export default function MetodoPage() {
  return (
    <div className="min-h-screen bg-[var(--pv-marble)] font-sans flex flex-col">
      <header className="fixed w-full z-50 bg-[var(--glass-bg)] backdrop-blur-md border-b border-[var(--glass-border)] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex w-10 h-10 sm:w-12 sm:h-12 rounded-full items-center justify-center shadow-lg border-2 border-white overflow-hidden shrink-0">
              <img src="/logopv.jpeg" alt="PV Abogadas" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="font-roman text-lg sm:text-xl font-bold tracking-tight text-[var(--pv-navy)] uppercase">PV Abogadas</div>
              <p className="text-[7px] sm:text-[8px] uppercase tracking-widest text-[var(--pv-gold)] font-bold">expertas en Extranjeria | Laboral | Familia</p>
            </div>
          </Link>
          <HomeNavbar />
        </div>
      </header>

      <main className="flex-1 pt-24 pb-20">
        {/* Hero Section */}
        <section className="relative w-full bg-[var(--pv-navy)] py-20 lg:py-32 overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--pv-navy)] via-transparent to-[var(--pv-marble)] opacity-80"></div>
          
          <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[var(--pv-gold)]/30 text-[var(--pv-gold)] text-xs font-bold uppercase tracking-[0.2em] mb-8 bg-[var(--pv-navy)] shadow-xl">
              <CheckCircle2 size={14} /> Claridad y Transparencia
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white font-roman uppercase tracking-tight drop-shadow-xl mb-6">
              Nuestro <span className="text-[var(--pv-gold)]">Método</span>
            </h1>
            <p className="text-lg sm:text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
              Sabemos que los procesos legales pueden ser estresantes. Por eso, hemos diseñado una metodología clara, paso a paso, para que sepas en todo momento en qué punto nos encontramos.
            </p>
          </div>
        </section>

        {/* Timeline Listing */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-10 lg:-mt-16 relative z-20 space-y-8 pb-20">
          {STEPS.map((step, idx) => (
            <div key={idx} className="bg-white rounded-3xl p-8 sm:p-12 border border-[var(--pv-navy)]/5 shadow-2xl relative overflow-hidden group">
              {/* Background Number */}
              <div className="absolute -top-10 -right-10 text-[180px] font-roman font-black text-[var(--pv-navy)]/[0.03] group-hover:text-[var(--pv-gold)]/[0.05] transition-colors duration-500 pointer-events-none">
                {step.number}
              </div>

              <div className="relative z-10 flex flex-col md:flex-row gap-8 lg:gap-16 items-start">
                <div className="shrink-0 flex flex-col items-center gap-4">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[2rem] bg-[var(--pv-navy)] flex items-center justify-center text-white shadow-xl">
                    <step.icon size={40} className="text-[var(--pv-gold)]" />
                  </div>
                  <div className="font-roman text-3xl font-black text-[var(--pv-navy)]/20 uppercase tracking-tighter">
                    Paso {step.number}
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="text-2xl sm:text-3xl font-bold text-[var(--pv-navy)] uppercase tracking-tight mb-4 group-hover:text-[var(--pv-gold)] transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-lg text-[var(--pv-navy)]/70 leading-relaxed mb-8">
                    {step.desc}
                  </p>
                  <ul className="space-y-4">
                    {step.details.map((detail, dIdx) => (
                      <li key={dIdx} className="flex items-start gap-4">
                        <div className="w-6 h-6 rounded-full bg-[var(--pv-gold)]/10 flex items-center justify-center shrink-0 mt-0.5 text-[var(--pv-gold)]">
                          <CheckCircle2 size={14} />
                        </div>
                        <span className="text-[var(--pv-navy)]/80 leading-relaxed">
                          {detail}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <section className="bg-[var(--pv-navy)] py-20 mt-12 relative overflow-hidden">
           <div className="absolute inset-0 opacity-20 bg-[url('/loginm.png')] bg-cover bg-center bg-fixed mix-blend-overlay"></div>
           <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
             <h2 className="text-3xl sm:text-5xl font-roman font-bold text-white uppercase tracking-tight mb-6">
               ¿Listo para empezar?
             </h2>
             <p className="text-lg text-white/80 mb-10 max-w-2xl mx-auto">
               Ahora que conoces cómo trabajamos, da el primer paso hacia tu tranquilidad legal. Agenda tu cita y deja que nos encarguemos del resto.
             </p>
             <Link href="/reservar" className="btn-roman inline-flex items-center gap-3 bg-[var(--pv-gold)] text-[var(--pv-navy)] hover:bg-white hover:text-[var(--pv-navy)] text-sm sm:text-base px-10 py-5">
                Agenda tu Cita Ahora <ArrowRight size={20} />
             </Link>
           </div>
        </section>
      </main>

      <HomeFooter />
      <WhatsAppButton />
    </div>
  );
}
