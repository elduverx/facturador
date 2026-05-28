import { BookingWizard } from '@/components/booking/BookingWizard';
import { HomeNavbar } from '@/components/public/HomeNavbar';
import { 
  ShieldCheck, 
  Sword as Gladiator, 
  TowerControl as Tower, 
  Users, 
  Calendar, 
  ChevronRight,
  Sparkles,
  ArrowRight,
  Anchor,
  CreditCard,
  RefreshCw,
  Landmark,
  Shield,
  MessageSquareQuote,
  HelpCircle
} from 'lucide-react';

const SERVICES = [
  { name: 'Arraigo', desc: 'Regularización por arraigo social, laboral o familiar con estrategia documental.', icon: Anchor },
  { name: 'NIE / TIE', desc: 'Asignación, renovación, duplicados y acompañamiento administrativo.', icon: CreditCard },
  { name: 'Renovaciones', desc: 'Control de plazos, documentación y presentación de permisos.', icon: RefreshCw },
  { name: 'Nacionalidad', desc: 'Solicitud, pruebas, seguimiento y preparación hasta jura o promesa.', icon: Landmark },
  { name: 'Reagrupación', desc: 'Tramitación para cónyuges, hijos y familiares dependientes.', icon: Users },
  { name: 'Asilo y refugio', desc: 'Protección internacional y defensa de derechos en procedimientos urgentes.', icon: Shield },
];

const PROCESS = [
  { num: 'I', title: 'Valoración jurídica', desc: 'Revisamos tu situación real, antecedentes, riesgos y documentos disponibles antes de prometer una vía.' },
  { num: 'II', title: 'Plan de actuación', desc: 'Te explicamos qué trámite conviene, qué pruebas hacen falta, qué plazos importan y qué coste tendrá el proceso.' },
  { num: 'III', title: 'Gestión y seguimiento', desc: 'Preparamos el expediente, presentamos cuando esté sólido y mantenemos el control de avisos, requerimientos y resolución.' },
];

const PROOF = [
  { value: '500+', label: 'Casos resueltos' },
  { value: '10+', label: 'Años de experiencia' },
  { value: '98%', label: 'Tasa de éxito' },
  { value: '2000+', label: 'Clientes satisfechos' },
];

const TESTIMONIALS = [
  {
    quote: 'Llegué a España sin saber nada del proceso legal. Las abogadas del consultorio me guiaron paso a paso hasta obtener mi residencia. Estaré eternamente agradecida por su dedicación y profesionalismo.',
    name: 'María G.',
    origin: 'Colombia',
    initials: 'MG',
  },
  {
    quote: 'Profesionales, cercanas y muy eficientes. Resolvieron mi caso de reagrupación familiar cuando otros despachos me habían dicho que era imposible.',
    name: 'Ahmed B.',
    origin: 'Marruecos',
    initials: 'AB',
  },
  {
    quote: 'Después de años intentando regularizar mi situación, finalmente lo logré gracias a este equipo. Su conocimiento y dedicación son excepcionales.',
    name: 'Liu W.',
    origin: 'China',
    initials: 'LW',
  },
];

const FAQS = [
  {
    q: '¿Cuánto cuesta la primera consulta?',
    a: 'Ofrecemos una primera consulta a precio reducido donde evaluamos tu caso en detalle. Contáctanos para conocer las tarifas actuales. Nuestro compromiso es la transparencia total en costes.',
  },
  {
    q: '¿Necesito pedir cita previa?',
    a: 'Sí, trabajamos exclusivamente con cita previa para dedicar a cada cliente el tiempo y atención que merece. Puedes reservar tu cita fácilmente desde esta página web.',
  },
  {
    q: '¿Qué documentos debo llevar a la consulta?',
    a: 'Generalmente necesitarás: pasaporte vigente, NIE/TIE si lo tienes, empadronamiento y documentación relacionada con tu trámite. Te enviaremos un listado personalizado al confirmar tu cita.',
  },
  {
    q: '¿Atienden urgencias u órdenes de expulsión?',
    a: 'Sí, actuamos con extrema urgencia en requerimientos con plazos cortos u órdenes de expulsión. Contacta con soporte inmediatamente si te encuentras en esta situación.',
  },
];

export function HomeShell() {
  return (
    <div className="min-h-screen bg-[var(--pv-marble)]">
      {/* Header - Glassmorphism */}
      <header className="fixed w-full z-50 bg-[var(--glass-bg)] backdrop-blur-md border-b border-[var(--glass-border)] shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--pv-gold)] rounded-full flex items-center justify-center shadow-lg transform rotate-12">
              <ShieldCheck className="text-white w-6 h-6" />
            </div>
            <div>
              <div className="font-roman text-xl font-bold tracking-tight text-[var(--pv-navy)]">PV ABOGADAS</div>
              <p className="text-[10px] uppercase tracking-widest text-[var(--pv-gold)] font-bold">Extranjería e Inmigración</p>
            </div>
          </a>
          <HomeNavbar />
        </div>
      </header>

      <main className="pt-24">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 lg:py-20 relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-[0.03] pointer-events-none hidden lg:block">
             <Gladiator size={600} className="transform rotate-12" />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div className="relative z-10 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1 rounded-full bg-[var(--pv-gold)]/10 text-[var(--pv-gold)] text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-4 sm:mb-6 border border-[var(--pv-gold)]/20">
                <Tower size={14} />
                Especialistas
              </div>
              <h1 className="text-3xl sm:text-5xl lg:text-7xl font-bold text-[var(--pv-navy)] font-roman leading-tight mb-4 sm:mb-8 uppercase tracking-tighter">
                Expertas en <span className="text-[var(--pv-gold)]">Nacionalidad y Residencias</span>
              </h1>
              <p className="text-sm sm:text-lg lg:text-xl text-[var(--pv-navy)] opacity-70 leading-relaxed mb-6 sm:mb-10 max-w-xl mx-auto lg:mx-0">
                Asilo y Arraigos · Derecho Familiar · Representación en toda España. <br className="hidden sm:block" />
                <span className="font-bold text-[var(--pv-gold)]">Tu seguridad jurídica es nuestra prioridad.</span>
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
                <a href="/reservar" className="btn-roman px-6 py-3.5 text-base w-full sm:hidden">
                  Agendar Asesoría
                  <ArrowRight size={20} />
                </a>
                <a href="#reservar" className="btn-roman px-8 py-4 text-lg w-full sm:w-auto hidden sm:flex">
                  Agendar Asesoría
                  <ArrowRight size={20} />
                </a>
                <a href="/portal" className="neo-card !px-6 sm:!px-8 !py-3.5 sm:!py-4 text-base sm:text-lg font-bold text-[var(--pv-gold)] flex items-center justify-center gap-2 hover:bg-white transition-all shadow-sm w-full sm:w-auto">
                  Mi Portal
                </a>
              </div>
            </div>

            <div className="relative mt-2 hidden sm:block lg:mt-0">
              <div className="neo-card !p-1 bg-gradient-to-br from-[var(--pv-gold)] to-[var(--pv-gold-light)] rounded-[2.5rem] shadow-2xl">
                <div className="bg-[var(--pv-marble)] rounded-[2.3rem] p-6 sm:p-10">
                  <h2 className="font-roman text-xl sm:text-2xl font-bold text-[var(--pv-navy)] mb-8 uppercase tracking-wide border-b border-[var(--pv-gold)] pb-4 text-center sm:text-left">Nuestro Método</h2>
                  <div className="space-y-6 sm:space-y-8">
                    {PROCESS.map((step) => (
                      <div key={step.num} className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center sm:items-start text-center sm:text-left">
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[var(--pv-gold)]/10 flex items-center justify-center text-[var(--pv-gold)] font-roman font-bold text-xl shadow-inner border border-[var(--pv-gold)]/20">
                          {step.num}
                        </div>
                        <div>
                          <h3 className="font-bold text-[var(--pv-navy)] text-lg mb-1">{step.title}</h3>
                          <p className="text-sm text-[var(--pv-navy)] opacity-60 leading-relaxed">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Floating Shield Decoration - Hidden on very small screens */}
              <div className="absolute -bottom-6 -right-6 sm:-bottom-10 sm:-right-10 w-24 h-24 sm:w-40 sm:h-40 bg-[var(--pv-gold)] rounded-full flex items-center justify-center shadow-2xl animate-bounce-slow border-4 sm:border-8 border-white z-10">
                <ShieldCheck className="text-white w-12 h-12 sm:w-20 sm:h-20" />
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="bg-[var(--pv-navy)] py-10 sm:py-16 lg:py-20 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
             <div className="flex justify-around items-center h-full">
                <Tower size={400} />
                <Tower size={400} />
                <Tower size={400} />
             </div>
          </div>
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-8 lg:gap-12 text-center">
              {PROOF.map((stat) => (
                <div key={stat.label}>
                  <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[var(--pv-gold)] mb-2 font-roman">{stat.value}</p>
                  <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] opacity-60 font-bold text-white leading-tight">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Sobre Nosotras Section */}
        <section id="nosotras" className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
             <div className="order-2 lg:order-1">
                <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-[var(--pv-gold)]/10 text-[var(--pv-gold)] text-xs font-bold uppercase tracking-widest mb-6 border border-[var(--pv-gold)]/20">
                  <ShieldCheck size={14} />
                  Sobre Nosotras
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-roman text-[var(--pv-navy)] uppercase tracking-tight mb-8">
                  Detrás de cada expediente hay <span className="text-[var(--pv-gold)]">una historia</span>
                </h2>
                <p className="text-base sm:text-lg text-[var(--pv-navy)] opacity-70 leading-relaxed mb-6">
                  Somos un equipo de abogadas apasionadas por defender los derechos de la comunidad inmigrante en España. Con más de una década de experiencia, hemos ayudado a miles de personas a regularizar su situación, reunirse con sus familias y construir su futuro.
                </p>
                <p className="text-base sm:text-lg text-[var(--pv-navy)] opacity-70 leading-relaxed mb-8">
                  Entendemos que detrás de cada trámite hay una familia, un sueño, una vida entera. Por eso ofrecemos un trato cercano, transparente y personalizado.
                </p>
                <div className="border-l-4 border-[var(--pv-gold)] pl-6 py-2">
                  <p className="font-roman text-lg sm:text-xl text-[var(--pv-navy)] italic opacity-90">
                    "Donde otros ven trámites burocráticos, nosotras vemos la construcción de tu futuro."
                  </p>
                </div>
             </div>
             <div className="relative order-1 lg:order-2 px-4 sm:px-10 lg:px-0">
                <div className="neo-card !p-2 bg-[var(--pv-gold)]/10 rounded-[2rem] transform lg:rotate-3 shadow-2xl">
                   <div className="bg-[var(--pv-marble)] rounded-[1.8rem] p-8 sm:p-12 text-center transform lg:-rotate-3 border border-white shadow-xl">
                      <Tower size={48} className="mx-auto text-[var(--pv-gold)] mb-6 sm:size-64" />
                      <h3 className="font-roman text-xl sm:text-2xl font-bold text-[var(--pv-navy)] uppercase tracking-wide mb-4">Firmes como la piedra</h3>
                      <p className="text-sm sm:text-base text-[var(--pv-navy)] opacity-70 mb-8">
                         Nuestro compromiso con la excelencia legal y la ética profesional es inquebrantable.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                         <div className="flex items-center gap-2 text-sm font-bold text-[var(--pv-navy)]">
                            <Shield size={16} className="text-[var(--pv-gold)]" /> Colegiadas ICAV
                         </div>
                         <div className="flex items-center gap-2 text-sm font-bold text-[var(--pv-navy)]">
                            <Sparkles size={16} className="text-[var(--pv-gold)]" /> +10 Años Exp.
                         </div>
                         <div className="flex items-center gap-2 text-sm font-bold text-[var(--pv-navy)]">
                            <Users size={16} className="text-[var(--pv-gold)]" /> Trato Humano
                         </div>
                         <div className="flex items-center gap-2 text-sm font-bold text-[var(--pv-navy)]">
                            <Landmark size={16} className="text-[var(--pv-gold)]" /> Ética Legal
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </section>

        {/* Services Grid */}
        <section id="servicios" className="bg-white/50 border-y border-[var(--glass-border)] py-12 sm:py-20 lg:py-32">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16 lg:mb-20">
              <p className="text-[var(--pv-gold)] font-bold uppercase tracking-[0.4em] text-xs mb-4">Servicios</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-roman text-[var(--pv-navy)] uppercase tracking-tight">Trámites Principales</h2>
              <div className="w-24 h-1 bg-[var(--pv-gold)] mx-auto mt-6"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {SERVICES.map((service) => (
                <div key={service.name} className="neo-card group transition-all duration-500 hover:bg-white p-8">
                  <div className="w-14 h-14 rounded-2xl bg-[var(--pv-gold)]/10 flex items-center justify-center text-[var(--pv-gold)] mb-6 transition-all group-hover:scale-110 group-hover:bg-[var(--pv-gold)]/20 shadow-inner border border-[var(--pv-gold)]/10">
                    <service.icon size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-[var(--pv-navy)] mb-3 font-roman transition-all uppercase">{service.name}</h3>
                  <p className="text-sm sm:text-base text-[var(--pv-navy)] opacity-70 leading-relaxed transition-all">
                    {service.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Proceso Section */}
        <section id="proceso" className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-12 lg:gap-16 items-start">
            <div className="lg:sticky lg:top-32 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-[var(--pv-gold)]/10 text-[var(--pv-gold)] text-xs font-bold uppercase tracking-widest mb-6 border border-[var(--pv-gold)]/20">
                <Calendar size={14} />
                Proceso
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-roman text-[var(--pv-navy)] uppercase tracking-tight mb-6">
                Una estrategia clara antes de mover expediente
              </h2>
              <p className="text-base sm:text-lg text-[var(--pv-navy)] opacity-70 leading-relaxed mb-8">
                No convertimos tu caso en una lista mecanica de pasos. Primero entendemos el contexto, despues elegimos la via mas defendible y, cuando hay base documental, gestionamos el tramite con control de plazos y comunicacion clara.
              </p>
              <a href="/reservar" className="btn-roman inline-flex px-8 py-4 w-full sm:hidden">
                Empezar ahora
                <ArrowRight size={20} />
              </a>
              <a href="#reservar" className="btn-roman px-8 py-4 w-full sm:w-auto hidden sm:inline-flex">
                Empezar ahora
                <ArrowRight size={20} />
              </a>
            </div>

            <div className="space-y-6">
              {PROCESS.map((step, index) => (
                <div key={step.num} className="neo-card !p-0 overflow-hidden hover:bg-white shadow-lg">
                  <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr]">
                    <div className="bg-[var(--pv-navy)] text-white flex flex-row sm:flex-col items-center justify-between sm:justify-center gap-2 sm:gap-4 px-6 py-4 sm:py-6">
                      <span className="font-roman text-3xl sm:text-4xl text-[var(--pv-gold)]">{step.num}</span>
                      <span className="text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.3em] opacity-60 font-bold">Fase {index + 1}</span>
                    </div>
                    <div className="p-6 sm:p-8">
                      <h3 className="font-roman text-xl sm:text-2xl font-bold text-[var(--pv-navy)] uppercase mb-3">{step.title}</h3>
                      <p className="text-sm sm:text-base text-[var(--pv-navy)] opacity-70 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonios" className="bg-[var(--pv-navy)] py-12 sm:py-20 lg:py-32 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none hidden lg:block">
             <div className="flex justify-around items-center h-full">
                <Gladiator size={400} />
             </div>
          </div>
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center mb-16 lg:mb-20">
              <p className="text-[var(--pv-gold)] font-bold uppercase tracking-[0.4em] text-xs mb-4">Testimonios</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-roman text-white uppercase tracking-tight">Opiniones de clientes</h2>
              <div className="w-24 h-1 bg-[var(--pv-gold)] mx-auto mt-6"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              {TESTIMONIALS.map((t, i) => (
                <div key={i} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 sm:p-8 hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-2">
                   <MessageSquareQuote size={32} className="text-[var(--pv-gold)] mb-6 opacity-80" />
                   <p className="text-base sm:text-lg italic opacity-90 leading-relaxed mb-8">"{t.quote}"</p>
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-[var(--pv-gold)]/20 border border-[var(--pv-gold)]/50 flex items-center justify-center font-bold text-[var(--pv-gold)] font-roman shadow-inner">
                         {t.initials}
                      </div>
                      <div>
                         <h4 className="font-bold text-white uppercase text-sm sm:text-base">{t.name}</h4>
                         <p className="text-[10px] sm:text-xs text-[var(--pv-gold)] tracking-widest uppercase">{t.origin}</p>
                      </div>
                   </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQs Section */}
        <section id="faq" className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20 lg:py-32">
          <div className="text-center mb-12 lg:mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-[var(--pv-gold)]/10 text-[var(--pv-gold)] text-xs font-bold uppercase tracking-widest mb-6 border border-[var(--pv-gold)]/20">
               <HelpCircle size={14} />
               Dudas Comunes
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold font-roman text-[var(--pv-navy)] uppercase tracking-tight mb-4">Preguntas Frecuentes</h2>
            <p className="text-sm sm:text-base text-[var(--pv-navy)] opacity-70">Claridad y transparencia desde el primer momento.</p>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, i) => (
              <details key={i} className="neo-card group cursor-pointer marker:content-[''] hover:bg-white transition-all p-4 sm:p-6">
                 <summary className="flex items-center justify-between font-bold text-[var(--pv-navy)] text-base sm:text-lg list-none outline-none pr-2">
                    <span className="pr-4">{faq.q}</span>
                    <span className="text-[var(--pv-gold)] shrink-0 transform transition-transform duration-300 group-open:rotate-90">
                       <ChevronRight size={20} />
                    </span>
                 </summary>
                 <div className="mt-4 pt-4 border-t border-[var(--glass-border)] text-sm sm:text-base text-[var(--pv-navy)] opacity-70 leading-relaxed">
                    {faq.a}
                 </div>
              </details>
            ))}
          </div>
        </section>

        {/* Booking Section */}
        <section id="reservar" className="hidden sm:block bg-[var(--pv-marble)] py-14 sm:py-20 lg:py-28 border-t border-[var(--glass-border)] scroll-mt-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="neo-card !p-4 sm:!p-6 lg:!p-8 xl:!p-10 shadow-2xl overflow-hidden">
              <div className="text-center mb-8 lg:mb-10 max-w-2xl mx-auto">
                <h2 className="text-3xl sm:text-4xl font-bold font-roman text-[var(--pv-navy)] uppercase mb-4">Agenda tu Consulta</h2>
                <p className="text-sm sm:text-base text-[var(--pv-navy)] opacity-70">Elige el servicio y selecciona el mejor momento para tu defensa legal.</p>
              </div>
              <div className="overflow-visible">
                <BookingWizard />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[var(--pv-navy)] text-white py-12 border-t border-[var(--pv-gold)]/30">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3 opacity-80">
            <div className="w-10 h-10 bg-[var(--pv-gold)] rounded-full flex items-center justify-center shadow-lg transform rotate-12 border border-[var(--pv-gold)]">
              <ShieldCheck className="text-white w-6 h-6" />
            </div>
            <div className="font-roman text-lg font-bold tracking-tight text-white">PV ABOGADAS</div>
          </div>
          <div className="text-xs uppercase tracking-[0.3em] opacity-40 font-bold text-white text-center md:text-left">
            &copy; {new Date().getFullYear()} Consultorio de Extranjería - Todos los derechos reservados
          </div>
          <div className="flex gap-6 opacity-60 text-sm">
             <a href="#" className="hover:text-[var(--pv-gold)] transition-colors text-white">Aviso Legal</a>
             <a href="#" className="hover:text-[var(--pv-gold)] transition-colors text-white">Privacidad</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
