"use client";

import { useState, useRef, useEffect } from 'react';
import { BookingWizard } from '@/components/booking/BookingWizard';
import { HomeNavbar } from '@/components/public/HomeNavbar';
import { 
  ShieldCheck, 
  Users, 
  Calendar, 
  ChevronRight,
  ArrowRight,
  Briefcase,
  Globe,
  Heart,
  ChevronLeft,
  CheckCircle2,
  MessageSquareQuote,
  HelpCircle,
  TowerControl as Tower,
  Shield
} from 'lucide-react';

const PILLARS = [
  {
    id: 'extranjeria',
    title: 'Extranjería',
    icon: Globe,
    description: 'Regulariza tu situación y la de tu familia en España con seguridad.',
    services: [
      { name: 'Visados o estancias por estudios', desc: 'Gestionamos tu visado para que puedas formarte en España.' },
      { name: 'Arraigos', desc: 'Social, sociolaboral, socioformativo, por estudio o de familia.' },
      { name: 'Residencia por vínculo', desc: 'Para familiares de ciudadanos españoles o de la UE.' },
      { name: 'Reagrupaciones familiares', desc: 'Trae a tus seres queridos a vivir contigo a España.' },
      { name: 'Nacionalidades', desc: 'Tramitación completa para obtener la nacionalidad española.' },
      { name: 'Renovaciones', desc: 'Renueva tus permisos a tiempo y sin complicaciones.' },
    ]
  },
  {
    id: 'laboral',
    title: 'Laboral',
    icon: Briefcase,
    description: 'Defendemos tus derechos como trabajador frente a cualquier injusticia.',
    services: [
      { name: 'Contratos y nóminas', desc: 'Revisión y asesoramiento sobre condiciones laborales.' },
      { name: 'Despidos', desc: 'Impugnación de despidos improcedentes o nulos.' },
      { name: 'Vacaciones', desc: 'Reclamaciones por vacaciones no disfrutadas o denegadas.' },
    ]
  },
  {
    id: 'familia',
    title: 'Familia',
    icon: Heart,
    description: 'Soluciones legales empáticas y firmes para asuntos familiares.',
    services: [
      { name: 'Convenios reguladores', desc: 'Redacción y negociación de acuerdos justos y equilibrados.' },
      { name: 'Régimen de visitas', desc: 'Establecimiento y modificación de medidas paterno-filiales.' },
      { name: 'Divorcios', desc: 'Asesoramiento integral en separaciones de mutuo acuerdo o contenciosos.' },
    ]
  }
];

const TESTIMONIALS = [
  {
    quote: 'Llegué a España sin saber nada del proceso legal. Las abogadas me guiaron paso a paso hasta obtener mi residencia. Estaré eternamente agradecida.',
    name: 'María G.',
    origin: 'Colombia',
    initials: 'MG',
  },
  {
    quote: 'Resolvieron mi despido improcedente de manera rápida y muy profesional. Sentí que mis derechos estaban en las mejores manos.',
    name: 'Carlos R.',
    origin: 'España',
    initials: 'CR',
  },
  {
    quote: 'Me acompañaron en un proceso de divorcio muy difícil con una empatía y firmeza excepcionales. Las recomiendo 100%.',
    name: 'Laura M.',
    origin: 'Argentina',
    initials: 'LM',
  },
];

const FAQS = [
  {
    q: '¿Cuánto cuesta la primera asesoría?',
    a: 'Ofrecemos una primera asesoría donde evaluamos tu caso en detalle (ya sea de Extranjería, Laboral o Familia). Contáctanos para conocer las tarifas actuales. Nuestro compromiso es la transparencia total en costes.',
  },
  {
    q: '¿Necesito pedir cita previa?',
    a: 'Sí, trabajamos exclusivamente con cita previa para dedicar a cada cliente el tiempo y atención que merece. Puedes reservar tu cita fácilmente desde el flujo interactivo de esta web.',
  },
  {
    q: '¿Qué áreas legales cubren exactamente?',
    a: 'Somos especialistas en tres pilares fundamentales: Extranjería e Inmigración, Derecho Laboral (despidos, contratos) y Derecho de Familia (divorcios, convenios).',
  },
];

export function HomeShell() {
  const [activePillar, setActivePillar] = useState<string | null>(null);
  const [activeService, setActiveService] = useState<string | null>(null);
  const bookingRef = useRef<HTMLElement>(null);
  const servicesRef = useRef<HTMLDivElement>(null);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setIsHeaderVisible(false); // Scrolling down
      } else {
        setIsHeaderVisible(true); // Scrolling up
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handlePillarClick = (id: string) => {
    setActivePillar(id);
    setActiveService(null);
    setTimeout(() => {
      servicesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
  };

  const handleServiceClick = (serviceName: string) => {
    setActiveService(serviceName);
    setTimeout(() => {
      bookingRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 300);
  };

  const activePillarData = PILLARS.find(p => p.id === activePillar);

  return (
    <div className="min-h-screen bg-[var(--pv-marble)] font-sans">
      {/* Header */}
      <header className={`fixed w-full z-50 bg-[var(--glass-bg)] backdrop-blur-md border-b border-[var(--glass-border)] shadow-sm transition-transform duration-500 ease-in-out ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex w-10 h-10 sm:w-12 sm:h-12 rounded-full items-center justify-center shadow-lg border-2 border-white overflow-hidden shrink-0">
              <img src="/logopv.jpeg" alt="PV Abogadas" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="font-roman text-lg sm:text-xl font-bold tracking-tight text-[var(--pv-navy)] uppercase">PV Abogadas</div>
              <p className="text-[7px] sm:text-[8px] uppercase tracking-widest text-[var(--pv-gold)] font-bold">expertas en Extranjeria | Laboral | Familia</p>
            </div>
          </a>
          <HomeNavbar />
        </div>
      </header>

      <main className="pb-8 sm:pb-12">
        {/* Dynamic Funnel Hero Section with Video Background */}
        <section id="servicios" className="relative w-full min-h-screen pt-28 pb-16 lg:pt-40 lg:pb-32 flex flex-col justify-center overflow-hidden">
          {/* Background Video */}
          <div className="absolute inset-0 w-full h-full z-0">
            <video 
              src="/video_sobre_estas_dos_gemelas.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover object-center"
            />
            {/* Elegant dark overlay so the white text and translucent cards pop */}
            <div className="absolute inset-0 bg-gradient-to-b from-[var(--pv-navy)]/90 via-[var(--pv-navy)]/60 to-[var(--pv-marble)]"></div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 w-full">
            <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-[var(--pv-gold)]/20 text-[var(--pv-gold)] text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-4 sm:mb-6 border border-[var(--pv-gold)]/30 backdrop-blur-sm shadow-lg">
                <ShieldCheck size={14} className="sm:w-4 sm:h-4" />
                Tu tranquilidad legal
              </div>
              <h1 className="text-3xl sm:text-5xl lg:text-7xl font-bold text-white font-roman leading-tight mb-4 sm:mb-6 uppercase tracking-tighter drop-shadow-xl">
                ¿En qué podemos <span className="text-[var(--pv-gold)]">ayudarte hoy?</span>
              </h1>
              <p className="text-base sm:text-xl text-white/90 leading-relaxed drop-shadow-md px-2 sm:px-0">
                Selecciona tu área de interés para recibir una asesoría especializada, paso a paso.
              </p>
            </div>

            {/* Step 1: The 3 Pillars */}
            <div className="grid grid-cols-3 gap-2 sm:gap-6 lg:gap-8 mb-8 sm:mb-10">
              {PILLARS.map((pillar) => (
                <button
                  key={pillar.id}
                  onClick={() => handlePillarClick(pillar.id)}
                  className={`neo-card group flex flex-col items-center md:items-start text-center md:text-left transition-all duration-500 p-3 sm:p-6 lg:p-10 border-2 rounded-2xl md:rounded-[2rem] shadow-2xl hover:-translate-y-1 md:hover:-translate-y-2 backdrop-blur-md
                    ${activePillar === pillar.id 
                      ? 'border-[var(--pv-gold)] bg-white/95 ring-2 md:ring-4 ring-[var(--pv-gold)]/20' 
                      : 'border-white/20 bg-white/10 hover:bg-white hover:border-[var(--pv-gold)]/50'}`}
                >
                  <div className={`w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center mb-3 md:mb-6 transition-colors duration-300 shadow-inner
                    ${activePillar === pillar.id 
                      ? 'bg-[var(--pv-gold)] text-white' 
                      : 'bg-white/20 text-white group-hover:bg-[var(--pv-gold)]/20 group-hover:text-[var(--pv-gold)]'}`}
                  >
                    <div className="md:hidden"><pillar.icon size={24} /></div>
                    <div className="hidden md:block"><pillar.icon size={32} /></div>
                  </div>
                  <h3 className={`text-[9px] min-[400px]:text-[10px] sm:text-base md:text-2xl font-bold mb-2 md:mb-4 font-roman uppercase transition-colors duration-300 whitespace-nowrap truncate w-full
                    ${activePillar === pillar.id ? 'text-[var(--pv-navy)]' : 'text-white group-hover:text-[var(--pv-navy)]'}`}>{pillar.title}</h3>
                  <p className={`hidden md:block text-[9px] sm:text-xs md:text-base leading-snug md:leading-relaxed mb-3 md:mb-6 transition-colors duration-300
                    ${activePillar === pillar.id ? 'text-[var(--pv-navy)] opacity-90' : 'text-white/90 group-hover:text-[var(--pv-navy)] group-hover:opacity-80'}`}>
                    {pillar.description}
                  </p>
                  <div className={`flex items-center justify-center md:justify-start text-[8px] sm:text-xs md:text-sm font-bold uppercase tracking-tight md:tracking-widest transition-colors w-full whitespace-nowrap
                    ${activePillar === pillar.id ? 'text-[var(--pv-gold)]' : 'text-white/80 group-hover:text-[var(--pv-gold)]'}`}>
                    <span className="hidden sm:inline">Ver servicios</span>
                    <span className="sm:hidden">Servicios</span>
                    <ArrowRight size={10} className="ml-1 md:w-4 md:h-4 md:ml-2 shrink-0" />
                  </div>
                </button>
              ))}
            </div>

            {/* Step 2: Sub-services (Shows when pillar is selected) */}
            <div ref={servicesRef} className={`transition-all duration-700 ease-in-out overflow-hidden ${activePillar ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
              {activePillarData && (
                <div className="bg-white rounded-[1.5rem] sm:rounded-[2.5rem] p-5 sm:p-8 lg:p-12 shadow-2xl border border-[var(--pv-gold)]/10 relative overflow-hidden mt-4 sm:mt-6">
                  {/* Background Icon Watermark */}
                  <div className="absolute top-0 right-0 opacity-[0.03] pointer-events-none transform translate-x-1/4 -translate-y-1/4">
                    <activePillarData.icon size={300} className="sm:w-[400px] sm:h-[400px] text-[var(--pv-navy)]" />
                  </div>
                  
                  <div className="relative z-10">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-10 gap-4">
                      <div>
                        <h2 className="text-xl sm:text-3xl font-roman font-bold text-[var(--pv-navy)] uppercase flex items-center gap-2 sm:gap-3">
                          Trámites de {activePillarData.title}
                        </h2>
                        <p className="text-[var(--pv-gold)] text-[10px] sm:text-sm font-bold uppercase tracking-widest mt-1 sm:mt-2">Paso 2: Selecciona tu trámite específico</p>
                      </div>
                      <button 
                        onClick={() => { setActivePillar(null); setActiveService(null); }}
                        className="text-[var(--pv-navy)]/60 hover:text-[var(--pv-navy)] flex items-center text-xs sm:text-sm font-bold uppercase transition-colors bg-[var(--pv-navy)]/5 px-4 py-2 rounded-xl"
                      >
                        <ChevronLeft size={16} className="mr-1 sm:w-5 sm:h-5" /> Volver a áreas
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
                      {activePillarData.services.map((service, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleServiceClick(service.name)}
                          className={`text-left p-5 sm:p-6 rounded-xl sm:rounded-2xl border-2 transition-all duration-300 flex flex-col justify-between h-full relative group
                            ${activeService === service.name 
                              ? 'bg-[var(--pv-navy)] border-[var(--pv-navy)] text-white shadow-xl transform scale-[1.02]' 
                              : 'bg-white border-[var(--pv-navy)]/10 hover:border-[var(--pv-gold)]/50 hover:shadow-md text-[var(--pv-navy)]'}`}
                        >
                          <div>
                            <h4 className={`font-bold text-base sm:text-lg mb-2 sm:mb-3 pr-8 leading-tight transition-colors duration-300 ${activeService === service.name ? 'text-white' : 'text-[var(--pv-navy)]'}`}>
                              {service.name}
                            </h4>
                            <p className={`text-xs sm:text-sm leading-relaxed transition-colors duration-300 ${activeService === service.name ? 'opacity-80 text-white' : 'opacity-60 text-[var(--pv-navy)] group-hover:opacity-100'}`}>
                              {service.desc}
                            </p>
                          </div>
                          
                          {/* Checkbox Icon */}
                          <div className={`absolute top-5 right-5 transition-opacity duration-300 
                            ${activeService === service.name ? 'opacity-100' : 'opacity-0 group-hover:opacity-30'}`}>
                            <CheckCircle2 size={24} className={activeService === service.name ? "text-[var(--pv-gold)]" : "text-[var(--pv-navy)]"} />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Step 3: CTA / Next Step Indicator */}
            <div className={`transition-all duration-700 ease-in-out flex justify-center mt-6 sm:mt-8 ${activeService ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
               {activeService && (
                  <div className="bg-white px-5 sm:px-8 py-5 sm:py-6 rounded-xl sm:rounded-2xl shadow-xl flex flex-col sm:flex-row items-center gap-4 sm:gap-6 border border-[var(--pv-gold)]/20 w-full sm:w-auto">
                    <div className="text-center sm:text-left w-full sm:w-auto">
                      <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-[var(--pv-navy)]/50 font-bold mb-1">Has seleccionado:</p>
                      <p className="text-base sm:text-lg font-bold text-[var(--pv-navy)] leading-tight">{activeService}</p>
                    </div>
                    <button 
                      onClick={() => bookingRef.current?.scrollIntoView({ behavior: 'smooth' })}
                      className="btn-roman flex items-center justify-center w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-[var(--pv-gold)] text-[var(--pv-navy)] hover:opacity-90 transition-opacity text-xs sm:text-sm"
                    >
                      Agendar Asesoría <ArrowRight size={16} className="ml-2 sm:w-5 sm:h-5" />
                    </button>
                  </div>
               )}
            </div>
          </div>
        </section>

        {/* Info & Trust Section (Simplified) */}
        <section className="bg-white/50 border-y border-[var(--glass-border)] py-10 sm:py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
               <div>
                  <Tower size={32} className="sm:w-10 sm:h-10 mx-auto text-[var(--pv-gold)] mb-3 sm:mb-4" />
                  <h4 className="font-bold text-[var(--pv-navy)] uppercase text-base sm:text-lg mb-1 sm:mb-2">Despacho Experto</h4>
                  <p className="text-xs sm:text-sm text-[var(--pv-navy)] opacity-70">Años de experiencia logrando resultados favorables.</p>
               </div>
               <div>
                  <Shield size={32} className="sm:w-10 sm:h-10 mx-auto text-[var(--pv-gold)] mb-3 sm:mb-4" />
                  <h4 className="font-bold text-[var(--pv-navy)] uppercase text-base sm:text-lg mb-1 sm:mb-2">Máxima Transparencia</h4>
                  <p className="text-xs sm:text-sm text-[var(--pv-navy)] opacity-70">Costes claros y viabilidad real desde el primer día.</p>
               </div>
               <div>
                  <Users size={32} className="sm:w-10 sm:h-10 mx-auto text-[var(--pv-gold)] mb-3 sm:mb-4" />
                  <h4 className="font-bold text-[var(--pv-navy)] uppercase text-base sm:text-lg mb-1 sm:mb-2">Trato Humano</h4>
                  <p className="text-xs sm:text-sm text-[var(--pv-navy)] opacity-70">Comprendemos tu situación y te acompañamos.</p>
               </div>
               <div>
                  <CheckCircle2 size={32} className="sm:w-10 sm:h-10 mx-auto text-[var(--pv-gold)] mb-3 sm:mb-4" />
                  <h4 className="font-bold text-[var(--pv-navy)] uppercase text-base sm:text-lg mb-1 sm:mb-2">Agilidad</h4>
                  <p className="text-xs sm:text-sm text-[var(--pv-navy)] opacity-70">Optimización de tiempos en cada trámite legal.</p>
               </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonios" className="py-12 sm:py-20 lg:py-32 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10 sm:mb-16">
              <h2 className="text-2xl sm:text-4xl font-bold font-roman text-[var(--pv-navy)] uppercase tracking-tight">Nuestras clientas PV Abogadas</h2>
              <div className="w-16 sm:w-24 h-1 bg-[var(--pv-gold)] mx-auto mt-4 sm:mt-6"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {TESTIMONIALS.map((t, i) => (
                <div key={i} className="neo-card bg-white p-6 sm:p-8 hover:-translate-y-2 transition-all duration-300">
                   <MessageSquareQuote size={24} className="sm:w-8 sm:h-8 text-[var(--pv-gold)] mb-4 sm:mb-6 opacity-80" />
                   <p className="text-sm sm:text-base italic text-[var(--pv-navy)] opacity-80 leading-relaxed mb-6 sm:mb-8">"{t.quote}"</p>
                   <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[var(--pv-gold)]/10 flex items-center justify-center font-bold text-[var(--pv-gold)] font-roman shadow-inner text-sm sm:text-base">
                         {t.initials}
                      </div>
                      <div>
                         <h4 className="font-bold text-[var(--pv-navy)] uppercase text-xs sm:text-sm">{t.name}</h4>
                         <p className="text-[9px] sm:text-[10px] text-[var(--pv-navy)]/50 tracking-widest uppercase">{t.origin}</p>
                      </div>
                   </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Booking Section */}
        <section ref={bookingRef} id="reservar" className="bg-[var(--pv-navy)] py-8 sm:py-12 lg:py-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 pointer-events-none"></div>
          
          <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 relative z-10">
            <div className="text-center mb-4 sm:mb-6 max-w-3xl mx-auto px-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] mb-4 border-2 border-[var(--pv-gold)] text-[var(--pv-gold)] bg-[var(--pv-gold)]/10 backdrop-blur-md">
                <Calendar size={14} /> Reserva tu cita
              </div>
              <h2 className="font-roman text-2xl sm:text-3xl lg:text-4xl font-bold text-white uppercase tracking-tight leading-none mb-3 sm:mb-4">
                Agenda tu Asesoría
              </h2>
              <p className="text-xs sm:text-sm text-white/70 font-medium leading-relaxed max-w-2xl mx-auto">
                Selecciona la modalidad, el área de especialidad y la profesional que mejor se adapte a tus necesidades.
              </p>
            </div>
            
            {/* Booking Wizard Container */}
            <div className="bg-[var(--pv-marble)] rounded-t-[1.5rem] rounded-b-[1.5rem] sm:rounded-t-[2rem] sm:rounded-b-[2rem] shadow-2xl overflow-hidden p-2 sm:p-3 lg:p-4">
              <BookingWizard initialServiceName={activeService} />
            </div>
          </div>
        </section>

        {/* FAQs Section */}
        <section id="faq" className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20 lg:py-32">
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1 rounded-full bg-[var(--pv-gold)]/10 text-[var(--pv-gold)] text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-4 sm:mb-6 border border-[var(--pv-gold)]/20">
               <HelpCircle size={14} />
               Dudas Comunes
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold font-roman text-[var(--pv-navy)] uppercase tracking-tight mb-3 sm:mb-4">Preguntas Frecuentes</h2>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {FAQS.map((faq, i) => (
              <details key={i} className="neo-card group cursor-pointer marker:content-[''] hover:bg-white transition-all p-4 sm:p-6">
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
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[var(--pv-navy)] text-white py-8 sm:py-12 border-t border-[var(--pv-gold)]/30">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 sm:gap-8">
          <div className="flex items-center gap-2 sm:gap-3 opacity-90">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-lg border-2 border-[var(--pv-gold)] overflow-hidden shrink-0 bg-white">
              <img src="/logopv.jpeg" alt="PV Abogadas" className="w-full h-full object-cover" />
            </div>
            <div className="font-roman text-base sm:text-lg font-bold tracking-tight text-white uppercase">PV Abogadas</div>
          </div>
          <div className="text-[9px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] opacity-40 font-bold text-white text-center md:text-left">
            &copy; {new Date().getFullYear()} PV Abogadas - Todos los derechos reservados
          </div>
          <div className="flex gap-4 sm:gap-6 opacity-60 text-xs sm:text-sm">
             <a href="#" className="hover:text-[var(--pv-gold)] transition-colors text-white">Aviso Legal</a>
             <a href="#" className="hover:text-[var(--pv-gold)] transition-colors text-white">Privacidad</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

