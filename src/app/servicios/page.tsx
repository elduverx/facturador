'use client';

import { useState, useEffect } from 'react';
import { HomeNavbar } from '@/components/public/HomeNavbar';
import { HomeFooter } from '@/components/public/HomeFooter';
import { WhatsAppButton } from '@/components/public/WhatsAppButton';
import Link from 'next/link';
import { 
  Globe, Briefcase, Heart, CheckCircle2, ChevronRight, 
  ArrowRight, ShieldCheck, Scale, FileText, Stamp, Award, Target, Users
} from 'lucide-react';

const SERVICES = [
  {
    id: 'extranjeria',
    title: 'Extranjería e Inmigración',
    icon: Globe,
    desc: 'Tu proyecto de vida en España, con máxima seguridad jurídica. Gestionamos todos los trámites para que puedas residir y trabajar de manera regular.',
    items: [
      { 
        name: 'Arraigos', 
        details: 'Tramitamos Arraigo Social, Laboral, Familiar y para la Formación. Evaluamos tu situación y encontramos la mejor vía para regularizarte tras residir un tiempo en España.',
        icon: ShieldCheck
      },
      { 
        name: 'Nacionalidades', 
        details: 'Proceso completo para la obtención de la nacionalidad española por residencia, carta de naturaleza o Ley de Memoria Democrática. Seguimiento exhaustivo del expediente.',
        icon: Stamp
      },
      { 
        name: 'Visados y Estancias', 
        details: 'Obtén tu permiso para formarte en centros españoles autorizados. Gestionamos la solicitud inicial, prórrogas y la autorización para poder trabajar mientras estudias.',
        icon: FileText
      },
      { 
        name: 'Residencia por Vínculo', 
        details: 'Tarjeta de familiar de ciudadano de la UE y autorización de residencia por reagrupación familiar. Logra traer a tus familiares o unirte a ellos en territorio español.',
        icon: Heart
      },
      { 
        name: 'Asilo Político', 
        details: 'Asesoramiento en la solicitud de protección internacional (asilo político) y recursos frente a denegaciones. Te acompañamos en todo el procedimiento.',
        icon: Scale
      },
      { 
        name: 'Renovaciones', 
        details: 'No pierdas tus derechos. Gestionamos la renovación de tus permisos de residencia y trabajo o la modificación de cuenta ajena a cuenta propia y viceversa.',
        icon: ChevronRight
      }
    ]
  },
  {
    id: 'laboral',
    title: 'Derecho Laboral',
    icon: Briefcase,
    desc: 'Defendemos tus derechos como trabajador. No permitas abusos laborales; estamos aquí para proteger tus intereses frente a cualquier empresa.',
    items: [
      { 
        name: 'Despidos Improcedentes', 
        details: 'Impugnamos despidos sin justificación o que vulneran derechos fundamentales. Negociamos la máxima indemnización o tu readmisión con garantías.',
        icon: ShieldCheck
      },
      { 
        name: 'Reclamación de Salarios', 
        details: '¿No te pagan lo que corresponde? Reclamamos impagos de nóminas, pagas extras, finiquitos o diferencias salariales según tu convenio.',
        icon: Stamp
      },
      { 
        name: 'Modificación de Condiciones', 
        details: 'Defensa legal frente a cambios sustanciales injustificados en tu horario, jornada, salario o funciones por parte de la empresa.',
        icon: Scale
      },
      { 
        name: 'Permisos y Excedencias', 
        details: 'Hacemos valer tu derecho a conciliación, reclamando vacaciones no concedidas, reducción de jornada o excedencias legales.',
        icon: FileText
      }
    ]
  },
  {
    id: 'familia',
    title: 'Derecho de Familia',
    icon: Heart,
    desc: 'Empatía y firmeza en los momentos más delicados. Te acompañamos para proteger tu patrimonio y el bienestar de los tuyos.',
    items: [
      { 
        name: 'Divorcios y Separaciones', 
        details: 'Gestión íntegra de divorcios de mutuo acuerdo o contenciosos. Protegemos tus intereses económicos y personales en la disolución del matrimonio.',
        icon: Scale
      },
      { 
        name: 'Convenios Reguladores', 
        details: 'Redactamos y negociamos convenios justos que regulen pensiones, vivienda familiar y medidas patrimoniales garantizando el equilibrio.',
        icon: FileText
      },
      { 
        name: 'Guarda y Custodia', 
        details: 'Establecimiento o modificación de régimen de visitas, pensión de alimentos y medidas relativas a los hijos menores priorizando su bienestar.',
        icon: ShieldCheck
      },
      { 
        name: 'Incapacitaciones', 
        details: 'Asesoramiento integral para la protección jurídica y patrimonial de familiares que no pueden valerse por sí mismos.',
        icon: Stamp
      }
    ]
  }
];

export default function ServiciosPage() {
  const [activeSection, setActiveSection] = useState('extranjeria');

  useEffect(() => {
    const handleScroll = () => {
      const sections = SERVICES.map(s => document.getElementById(s.id));
      const scrollPosition = window.scrollY + 300;

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(SERVICES[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const offset = 120;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans flex flex-col">
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

      <main className="flex-1">
        {/* Dynamic Hero Section */}
        <section className="relative w-full h-[70vh] min-h-[600px] flex items-center justify-center overflow-hidden">
          {/* Background Video */}
          <div className="absolute inset-0 w-full h-full z-0">
            <video 
              src="/video_sobre_estas_dos_gemelas.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover object-center scale-105"
            />
            {/* Elegant dark gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--pv-navy)]/95 via-[var(--pv-navy)]/80 to-[var(--pv-navy)]/40"></div>
          </div>
          
          <div className="max-w-7xl mx-auto px-6 relative z-10 w-full flex flex-col items-start mt-20">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[var(--pv-gold)]/50 text-[var(--pv-gold)] text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] mb-6 backdrop-blur-md bg-white/5 shadow-2xl">
              <Award size={14} /> Soluciones Legales de Alto Nivel
            </div>
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-bold text-white font-roman uppercase tracking-tight drop-shadow-2xl mb-6 max-w-4xl leading-[0.9]">
              Nuestras <br/><span className="text-[var(--pv-gold)]">Especialidades</span>
            </h1>
            <p className="text-lg sm:text-2xl text-white/90 max-w-2xl leading-relaxed font-medium drop-shadow-md">
              Protegemos tus derechos con rigor, estrategia y empatía. Conoce en detalle todas las áreas en las que podemos representarte.
            </p>
          </div>
        </section>



        {/* Main Content with Sticky Sidebar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 lg:py-32 flex flex-col lg:flex-row gap-12 lg:gap-24 relative">
          
          {/* Sticky Sidebar Navigation (Desktop only) */}
          <div className="hidden lg:block w-72 shrink-0 relative">
            <div className="sticky top-32 bg-transparent p-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--pv-navy)]/40 mb-6 ml-4">Navegación</h4>
              <nav className="space-y-1 border-l border-[var(--pv-navy)]/10 ml-4 pl-4">
                {SERVICES.map((area) => (
                  <button
                    key={area.id}
                    onClick={() => scrollTo(area.id)}
                    className={`w-full text-left px-2 py-3 flex items-center gap-3 transition-all duration-300 font-bold uppercase tracking-wider text-xs relative
                      ${activeSection === area.id 
                        ? 'text-[var(--pv-navy)]' 
                        : 'text-[var(--pv-navy)]/40 hover:text-[var(--pv-navy)]/70'}`}
                  >
                    {activeSection === area.id && (
                       <span className="absolute -left-[17px] top-1/2 -translate-y-1/2 w-[2px] h-4 bg-[var(--pv-navy)]"></span>
                    )}
                    {area.title}
                  </button>
                ))}
              </nav>
              
              <div className="mt-12 pt-8 border-t border-[var(--pv-navy)]/5">
                <p className="text-[10px] text-[var(--pv-navy)]/50 leading-relaxed mb-4 font-bold uppercase tracking-widest">
                  ¿Dudas sobre tu caso?
                </p>
                <Link href="/reservar" className="text-xs font-bold uppercase tracking-widest text-[var(--pv-gold)] hover:text-[var(--pv-navy)] transition-colors flex items-center gap-2">
                  Agendar Cita <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>

          {/* Services Content */}
          <div className="flex-1 space-y-32">
            {SERVICES.map((area) => (
              <div key={area.id} id={area.id} className="scroll-mt-32">
                
                {/* Area Header */}
                <div className="mb-12 relative">
                  <div className="absolute -left-8 -top-8 text-[120px] font-roman font-black text-[var(--pv-navy)]/[0.03] pointer-events-none select-none hidden md:block">
                    {area.title.substring(0, 2)}
                  </div>
                  <div className="relative z-10 flex items-center gap-4 mb-4">
                    <div className="text-[var(--pv-navy)] shrink-0">
                      <area.icon size={36} strokeWidth={1.5} />
                    </div>
                    <div>
                      <h2 className="text-3xl sm:text-4xl font-roman font-bold text-[var(--pv-navy)] uppercase tracking-tight leading-none">
                        {area.title}
                      </h2>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="h-px w-8 bg-[var(--pv-gold)]/50"></div>
                        <p className="text-[var(--pv-navy)]/50 font-bold text-[9px] tracking-widest uppercase">
                          {area.items.length} Trámites
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm sm:text-base text-[var(--pv-navy)]/60 max-w-2xl leading-relaxed font-light mb-8">
                    {area.desc}
                  </p>
                </div>

                {/* Sub-services Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {area.items.map((service, sIdx) => (
                    <div key={sIdx} className="group relative bg-white p-5 lg:p-6 transition-all duration-500 border border-[var(--pv-navy)]/5 hover:border-[var(--pv-navy)]/20 flex flex-col justify-between h-full rounded-xl">
                      
                      <div className="relative z-10 mb-6">
                        <div className="w-8 h-8 text-[var(--pv-navy)]/50 flex items-center justify-start mb-4 group-hover:text-[var(--pv-gold)] transition-colors duration-500">
                          <service.icon size={20} strokeWidth={1.5} />
                        </div>
                        <h3 className="text-base font-bold text-[var(--pv-navy)] mb-2 tracking-tight leading-tight group-hover:text-[var(--pv-gold)] transition-colors duration-300">
                          {service.name}
                        </h3>
                        <p className="text-[11px] sm:text-xs text-[var(--pv-navy)]/60 leading-relaxed font-light">
                          {service.details}
                        </p>
                      </div>

                      <div className="relative z-10 pt-4 border-t border-gray-50 flex items-center justify-between mt-auto">
                        <Link href="/reservar" className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--pv-navy)]/50 group-hover:text-[var(--pv-navy)] transition-colors flex items-center gap-1.5">
                          Agendar <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Grand CTA Section */}
        <section className="bg-[var(--pv-navy)] py-24 relative overflow-hidden">
           <div className="absolute inset-0 opacity-10 bg-[url('/loginm.png')] bg-cover bg-center bg-fixed mix-blend-overlay"></div>
           <div className="absolute -left-40 top-0 w-96 h-96 bg-[var(--pv-gold)]/20 rounded-full blur-[120px]"></div>
           <div className="absolute -right-40 bottom-0 w-96 h-96 bg-[var(--pv-gold)]/20 rounded-full blur-[120px]"></div>
           
           <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
             <div className="w-20 h-20 rounded-full bg-white/5 border border-[var(--pv-gold)]/30 mx-auto flex items-center justify-center mb-8 text-[var(--pv-gold)] backdrop-blur-md">
               <Users size={32} />
             </div>
             <h2 className="text-3xl sm:text-4xl font-roman font-bold text-white uppercase tracking-tight mb-4 drop-shadow-lg">
               Tu tranquilidad es <span className="text-[var(--pv-gold)]">nuestra prioridad</span>
             </h2>
             <p className="text-sm sm:text-base text-white/70 mb-8 max-w-2xl mx-auto leading-relaxed">
               Si tienes dudas sobre qué trámite exacto necesitas, agenda una primera asesoría. Estudiaremos tu caso y te guiaremos por el camino correcto.
             </p>
             <Link href="/reservar" className="btn-roman inline-flex items-center justify-center gap-3 bg-[var(--pv-gold)] text-[var(--pv-navy)] hover:bg-white hover:text-[var(--pv-navy)] text-xs sm:text-sm px-8 py-3.5 shadow-lg">
                Reserva tu Asesoría <ArrowRight size={16} />
             </Link>
           </div>
        </section>
      </main>

      <HomeFooter />
      <WhatsAppButton />
    </div>
  );
}
