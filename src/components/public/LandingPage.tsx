'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { BookingWizard } from '@/components/booking/BookingWizard';
import { AppointmentLookup } from '@/components/booking/AppointmentLookup';

/* ═══════════════════════════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════════════════════════ */

const NAV_LINKS = [
  { label: 'Servicios', href: '#servicios' },
  { label: 'Nosotras', href: '#nosotras' },
  { label: 'Proceso', href: '#proceso' },
  { label: 'Opiniones', href: '#testimonios' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Mi Portal', href: '/portal' },
  { label: 'Blog', href: '/blog' },
];

const MARQUEE_ITEMS = [
  'Arraigo Social', 'NIE / TIE', 'Renovaciones', 'Nacionalidad Espanola',
  'Reagrupacion Familiar', 'Asilo y Refugio', 'Permisos de Trabajo',
  'Recursos Administrativos', 'Derecho de Extranjeria',
];

const SERVICES: {
  name: string;
  desc: string;
  large?: boolean;
  icon: React.ReactNode;
}[] = [
  {
    name: 'Arraigo',
    desc: 'Regulariza tu situacion mediante arraigo social, laboral o familiar. Disenamos la estrategia mas solida para que tu solicitud prospere.',
    large: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
        <path d="M3 9.5L12 3l9 6.5V20a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 20V9.5z" />
        <path d="M9 21.5V14h6v7.5" />
      </svg>
    ),
  },
  {
    name: 'NIE / TIE',
    desc: 'Tramitacion integral de tu Numero de Identidad de Extranjero. Primera asignacion, renovacion y duplicados.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M6 9h4M6 13h8M16 13h2" />
        <circle cx="17" cy="9" r="2" />
      </svg>
    ),
  },
  {
    name: 'Renovaciones',
    desc: 'Renueva tus permisos de residencia y trabajo. Controlamos plazos y documentacion para que no pierdas tu estatus.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
        <path d="M21 12a9 9 0 11-6.22-8.56" />
        <path d="M21 3v6h-6" />
      </svg>
    ),
  },
  {
    name: 'Nacionalidad Espanola',
    desc: 'Te guiamos en todo el camino hacia la ciudadania: solicitud, pruebas CCSE y DELE, y jura o promesa.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
  {
    name: 'Reagrupacion Familiar',
    desc: 'Reune a tu familia en Espana. Gestionamos la reagrupacion de conyuges, hijos y ascendientes con rigor y dedicacion.',
    large: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
        <circle cx="9" cy="7" r="3" />
        <circle cx="17" cy="7" r="3" />
        <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
        <path d="M17 11a4 4 0 014 4v2" />
      </svg>
    ),
  },
  {
    name: 'Asilo y Refugio',
    desc: 'Proteccion internacional para quienes la necesitan. Acompanamiento completo en solicitudes de asilo y refugio.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
        <path d="M12 22s-8-4.5-8-11.8A8 8 0 0112 2a8 8 0 018 8.2c0 7.3-8 11.8-8 11.8z" />
        <path d="M12 8v4M12 16h.01" />
      </svg>
    ),
  },
];

const STATS = [
  { value: 500, suffix: '+', label: 'Casos resueltos' },
  { value: 10, suffix: '+', label: 'Anos de experiencia' },
  { value: 98, suffix: '%', label: 'Tasa de exito' },
  { value: 2000, suffix: '+', label: 'Clientes satisfechos' },
];

const DIFFERENTIATORS = [
  {
    title: 'Especializacion exclusiva',
    desc: 'Solo derecho de extranjeria. Es todo lo que hacemos y lo hacemos mejor que nadie.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    title: 'Trato personalizado',
    desc: 'Conocemos tu nombre, tu historia y los detalles de tu caso. No eres un numero.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    title: 'Comunicacion constante',
    desc: 'Te informamos de cada avance. Sin incertidumbre, sin silencios, sin sorpresas.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
  },
  {
    title: 'Resultados comprobados',
    desc: 'Mas de 500 casos resueltos con un 98% de exito. Los resultados nos respaldan.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
        <path d="M22 4L12 14.01l-3-3" />
      </svg>
    ),
  },
];

const PROCESS_STEPS = [
  {
    num: '01',
    title: 'Reserva tu cita',
    desc: 'Selecciona el servicio y elige un horario disponible en nuestro calendario online.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
  },
  {
    num: '02',
    title: 'Consulta personalizada',
    desc: 'Analizamos tu caso, revisamos documentacion y disenamos la mejor estrategia legal.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
      </svg>
    ),
  },
  {
    num: '03',
    title: 'Gestion integral',
    desc: 'Nos encargamos de todos los tramites y te mantenemos informado hasta la resolucion.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
        <path d="M22 4L12 14.01l-3-3" />
      </svg>
    ),
  },
];

const TESTIMONIALS = [
  {
    quote: 'Llegue a Espana sin saber nada del proceso legal. Las abogadas del consultorio me guiaron paso a paso hasta obtener mi residencia. Estare eternamente agradecida por su dedicacion, paciencia y profesionalismo. Me cambiaron la vida.',
    name: 'Maria G.',
    origin: 'Colombia',
    initials: 'MG',
    color: 'from-teal-400 to-emerald-500',
    featured: true,
  },
  {
    quote: 'Profesionales, cercanas y muy eficientes. Resolvieron mi caso de reagrupacion familiar cuando otros despachos me habian dicho que era imposible.',
    name: 'Ahmed B.',
    origin: 'Marruecos',
    initials: 'AB',
    color: 'from-amber-400 to-orange-500',
    featured: false,
  },
  {
    quote: 'Despues de anos intentando regularizar mi situacion, finalmente lo logre gracias a este equipo. Su conocimiento y dedicacion son excepcionales.',
    name: 'Liu W.',
    origin: 'China',
    initials: 'LW',
    color: 'from-rose-400 to-pink-500',
    featured: false,
  },
];

const FAQS = [
  {
    q: 'Cuanto cuesta la primera consulta?',
    a: 'Ofrecemos una primera consulta a precio reducido donde evaluamos tu caso en detalle. Contactanos para conocer las tarifas actuales. Nuestro compromiso es la transparencia total en costes.',
  },
  {
    q: 'Necesito pedir cita previa?',
    a: 'Si, trabajamos exclusivamente con cita previa para dedicar a cada cliente el tiempo y atencion que merece. Puedes reservar tu cita facilmente desde esta pagina web.',
  },
  {
    q: 'Que documentos debo llevar a la consulta?',
    a: 'Generalmente necesitaras: pasaporte vigente, NIE/TIE si lo tienes, empadronamiento y documentacion relacionada con tu tramite. Te enviaremos un listado personalizado al confirmar tu cita.',
  },
  {
    q: 'Atienden en otros idiomas?',
    a: 'Si, nuestro equipo habla espanol, ingles y frances. Ademas, contamos con colaboradores que asisten en arabe, chino mandarin y portugues.',
  },
  {
    q: 'Cuanto tarda un tramite de extranjeria?',
    a: 'Los plazos varian: arraigo entre 3-6 meses, renovacion entre 1-3 meses, nacionalidad hasta 2-3 anos. Te informaremos de los plazos reales de tu caso concreto.',
  },
  {
    q: 'Pueden ayudarme con una orden de expulsion?',
    a: 'Si, actuamos con urgencia en ordenes de expulsion. Contactanos inmediatamente. Analizaremos tu situacion y buscaremos la mejor via legal para proteger tus derechos.',
  },
];

/* ═══════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════════ */

function StatCounter({ end, suffix = '' }: { end: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !started.current) {
          started.current = true;
          const dur = 2200;
          const t0 = performance.now();
          const tick = (now: number) => {
            const p = Math.min((now - t0) / dur, 1);
            const ease = 1 - Math.pow(1 - p, 4);
            setCount(Math.floor(ease * end));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [end]);

  return <span ref={ref}>{count}{suffix}</span>;
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════ */

export function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [showLookup, setShowLookup] = useState(false);

  /* ── Scroll ── */
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  /* ── Reveal Observer ── */
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('revealed'); }),
      { threshold: 0.06, rootMargin: '0px 0px -30px 0px' }
    );
    document.querySelectorAll('.reveal, .stagger-children').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  /* ── Body lock ── */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const close = useCallback(() => setMenuOpen(false), []);

  /* ═══════ RENDER ═══════ */
  return (
    <div className="min-h-screen bg-white text-slate-800 overflow-x-hidden">

      {/* ────────────────── NAVBAR ────────────────── */}
      <nav className={`fixed inset-x-0 top-0 z-50 navbar-transition ${scrolled ? 'bg-white/90 shadow-lg shadow-black/[0.03] border-b border-stone-100' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300 ${scrolled ? 'bg-teal-600 shadow-md shadow-teal-600/20' : 'bg-white/10 border border-white/20'}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
            </div>
            <span className={`font-display text-lg transition-colors duration-300 ${scrolled ? 'text-slate-900' : 'text-white'}`}>
              Consultorio
            </span>
          </a>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-7">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} className={`text-[13px] font-medium tracking-wide uppercase transition-colors ${scrolled ? 'text-slate-500 hover:text-teal-600' : 'text-white/70 hover:text-white'}`}>
                {l.label}
              </a>
            ))}
            <a href="#reservar" className={`text-sm font-semibold px-5 py-2.5 rounded-full transition-all duration-300 ${scrolled ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-600/20' : 'bg-white text-slate-900 hover:bg-white/90 shadow-lg shadow-black/10'}`}>
              Reserva tu cita
            </a>
          </div>

          {/* Mobile Toggle */}
          <button type="button" aria-label="Menu" onClick={() => setMenuOpen(!menuOpen)} className={`lg:hidden w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${scrolled ? 'text-slate-700' : 'text-white'}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {menuOpen ? <path d="M6 6l12 12M6 18L18 6" /> : <path d="M4 7h16M4 12h12M4 17h16" />}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="lg:hidden fixed inset-0 top-16 bg-white/98 backdrop-blur-sm z-40 animate-fade-in">
            <div className="flex flex-col p-8 gap-2">
              {NAV_LINKS.map((l) => (
                <a key={l.href} href={l.href} onClick={close} className="text-xl font-medium text-slate-800 py-3 border-b border-stone-100">{l.label}</a>
              ))}
              <a href="#reservar" onClick={close} className="mt-6 text-center font-semibold px-6 py-4 rounded-full bg-teal-600 text-white text-lg">Reserva tu cita</a>
              <a href="/portal" onClick={close} className="mt-2 text-center font-medium px-6 py-4 rounded-full border-2 border-teal-600 text-teal-700 text-lg">Mi Portal</a>
            </div>
          </div>
        )}
      </nav>

      {/* ────────────────── HERO ────────────────── */}
      <section className="relative min-h-[100dvh] flex items-center overflow-hidden" style={{ background: 'linear-gradient(135deg, #020617 0%, #042f2e 40%, #0c4a6e 70%, #020617 100%)' }}>
        {/* Ambient Lights */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-[800px] h-[800px] -top-[200px] -right-[200px] bg-teal-500/[0.07] rounded-full blur-[150px] animate-pulse-soft" />
          <div className="absolute w-[600px] h-[600px] -bottom-[150px] -left-[100px] bg-cyan-500/[0.06] rounded-full blur-[130px] animate-pulse-soft" style={{ animationDelay: '2s' }} />
          <div className="absolute w-[400px] h-[400px] top-1/3 left-1/4 bg-emerald-400/[0.04] rounded-full blur-[100px] animate-float" />
          {/* Grid Pattern */}
          <div className="absolute inset-0 bg-grid-pattern opacity-40" />
          {/* Decorative Ring */}
          <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] opacity-[0.04] animate-slow-spin" viewBox="0 0 700 700" fill="none">
            <circle cx="350" cy="350" r="340" stroke="white" strokeWidth="0.5" />
            <circle cx="350" cy="350" r="280" stroke="white" strokeWidth="0.3" strokeDasharray="8 12" />
            <circle cx="350" cy="350" r="200" stroke="white" strokeWidth="0.3" />
          </svg>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 w-full pt-28 pb-20 lg:pt-0 lg:pb-0">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            {/* Text Column */}
            <div className="max-w-xl">
              <div className="animate-hero-1 inline-flex items-center gap-2.5 px-4 py-2 rounded-full glass text-teal-300 text-sm font-medium mb-8">
                <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-pulse" />
                Abogadas de Extranjeria — Madrid
              </div>

              <h1 className="animate-hero-2 font-display text-[2.5rem] sm:text-5xl md:text-6xl lg:text-[4.25rem] xl:text-7xl text-white leading-[1.05] mb-6 tracking-tight">
                Hacemos posible{' '}
                <span className="text-gradient-teal">tu vida</span>
                <br className="hidden sm:block" />
                {' '}en Espana
              </h1>

              <p className="animate-hero-2 text-base sm:text-lg text-slate-400 leading-relaxed mb-10 max-w-md">
                Mas de una decada transformando vidas. Te acompanamos con profesionalismo y cercania en cada paso de tu proceso migratorio.
              </p>

              <div className="animate-hero-3 flex flex-col sm:flex-row gap-3">
                <a href="#reservar" className="px-7 py-3.5 rounded-full bg-teal-500 text-white font-semibold text-base hover:bg-teal-400 transition-all hover:shadow-xl hover:shadow-teal-500/20 active:scale-[0.97] text-center">
                  Reserva tu consulta
                </a>
                <a href="#servicios" className="px-7 py-3.5 rounded-full glass text-white font-medium text-base hover:bg-white/10 transition-all active:scale-[0.97] text-center">
                  Nuestros servicios
                </a>
              </div>

              {/* Trust row */}
              <div className="animate-hero-3 mt-12 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
                {['Consulta confidencial', 'Respuesta en 24h', 'Sin compromiso'].map((t) => (
                  <span key={t} className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-teal-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Visual Column – floating glass cards */}
            <div className="hidden lg:flex items-center justify-center relative h-[520px]">
              {/* Card 1 – Success rate */}
              <div className="absolute top-8 right-12 glass rounded-2xl p-5 animate-float-slow">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-teal-500/20 flex items-center justify-center text-teal-400">
                    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">98%</p>
                    <p className="text-xs text-white/50">Tasa de exito</p>
                  </div>
                </div>
              </div>

              {/* Card 2 – Cases resolved */}
              <div className="absolute top-40 left-0 glass rounded-2xl p-5 animate-float">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">500+</p>
                    <p className="text-xs text-white/50">Casos resueltos</p>
                  </div>
                </div>
              </div>

              {/* Card 3 – Fast response */}
              <div className="absolute bottom-16 right-4 glass rounded-2xl p-5 animate-float-reverse">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">24h</p>
                    <p className="text-xs text-white/50">Tiempo de respuesta</p>
                  </div>
                </div>
              </div>

              {/* Central decorative shield */}
              <svg className="w-56 h-56 opacity-[0.06]" viewBox="0 0 200 240" fill="none">
                <path d="M100 10L180 50V130C180 180 140 210 100 230C60 210 20 180 20 130V50L100 10Z" stroke="white" strokeWidth="1" />
                <path d="M100 30L160 60V130C160 170 130 195 100 210C70 195 40 170 40 130V60L100 30Z" stroke="white" strokeWidth="0.5" />
              </svg>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-scroll-bounce">
          <div className="w-5 h-8 rounded-full border border-white/20 flex items-start justify-center p-1.5">
            <div className="w-1 h-1.5 bg-white/40 rounded-full" />
          </div>
        </div>
      </section>

      {/* ────────────────── MARQUEE ────────────────── */}
      <div className="relative border-y border-stone-100 bg-white py-5 overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i} className="flex items-center gap-4 px-4 text-sm font-medium text-slate-400">
              <span className="w-1.5 h-1.5 bg-teal-400 rounded-full shrink-0" />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ────────────────── SERVICES ────────────────── */}
      <section id="servicios" className="py-24 sm:py-32 bg-stone-50/60">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="text-center mb-16 reveal">
            <p className="text-sm font-semibold text-teal-600 tracking-widest uppercase mb-3">Servicios</p>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-slate-900 mb-5">
              Soluciones legales para <span className="text-teal-600">cada situacion</span>
            </h2>
            <p className="max-w-2xl mx-auto text-lg text-slate-500 leading-relaxed">
              Cubrimos todas las areas del derecho de extranjeria con un enfoque personalizado para cada caso.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children reveal">
            {SERVICES.map((s) => (
              <div
                key={s.name}
                className={`service-card group relative bg-white rounded-2xl border border-stone-200/70 p-7 sm:p-8 hover:border-teal-300/60 ${s.large ? 'lg:col-span-2' : ''}`}
              >
                {/* Hover glow */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-teal-50/0 via-teal-50/0 to-teal-50/0 group-hover:from-teal-50/50 group-hover:to-transparent transition-all duration-500 pointer-events-none" />
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-50 to-teal-100/80 text-teal-600 flex items-center justify-center mb-5 group-hover:shadow-lg group-hover:shadow-teal-500/10 transition-shadow duration-500">
                    {s.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">{s.name}</h3>
                  <p className="text-slate-500 leading-relaxed text-[15px]">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* General Consultation CTA */}
          <div className="reveal mt-10 relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-600 via-teal-600 to-teal-700 p-8 sm:p-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.04] rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative flex flex-col sm:flex-row items-center justify-between gap-6 text-white">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6"><path d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold">No sabes que tramite necesitas?</h3>
                  <p className="text-teal-100 mt-1 text-[15px]">Reserva una consulta general y analizaremos tu caso sin compromiso.</p>
                </div>
              </div>
              <a href="#reservar" className="shrink-0 px-7 py-3.5 bg-white text-teal-700 font-semibold rounded-full hover:bg-teal-50 transition-colors shadow-lg shadow-black/5">
                Consultar ahora
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────── STATS + WHY US ────────────────── */}
      <section className="relative py-24 sm:py-32 overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #134e4a 50%, #0f172a 100%)' }}>
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
        <div className="relative max-w-7xl mx-auto px-5 sm:px-8">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-display text-4xl sm:text-5xl lg:text-6xl text-white mb-2">
                  <StatCounter end={s.value} suffix={s.suffix} />
                </p>
                <p className="text-sm sm:text-base text-teal-200/70 font-medium">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="w-20 h-px bg-gradient-to-r from-transparent via-teal-400/40 to-transparent mx-auto mb-16" />

          {/* Differentiators */}
          <div className="text-center mb-12 reveal">
            <h2 className="font-display text-3xl sm:text-4xl text-white">
              Por que <span className="text-gradient-teal">elegirnos</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 stagger-children reveal">
            {DIFFERENTIATORS.map((d) => (
              <div key={d.title} className="glass rounded-2xl p-6 text-center hover:bg-white/[0.08] transition-colors">
                <div className="w-12 h-12 rounded-xl bg-teal-500/15 text-teal-400 flex items-center justify-center mx-auto mb-4">
                  {d.icon}
                </div>
                <h3 className="text-white font-semibold mb-2">{d.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────── ABOUT ────────────────── */}
      <section id="nosotras" className="py-24 sm:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Visual */}
            <div className="reveal relative flex items-center justify-center">
              <div className="relative w-full max-w-md aspect-square">
                {/* Shield bg */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-72 h-72 sm:w-80 sm:h-80 text-teal-100" viewBox="0 0 200 240" fill="currentColor" fillOpacity="0.5">
                    <path d="M100 10L180 50V130C180 180 140 210 100 230C60 210 20 180 20 130V50L100 10Z" />
                  </svg>
                </div>
                {/* Floating elements */}
                <div className="absolute top-4 right-4 glass-white rounded-xl px-4 py-3 shadow-lg animate-float-slow">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                      <svg className="w-4 h-4 text-teal-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">Colegiadas</p>
                      <p className="text-[10px] text-slate-500">ICAM Madrid</p>
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-8 left-0 glass-white rounded-xl px-4 py-3 shadow-lg animate-float">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                      <svg className="w-4 h-4 text-emerald-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">+10 anos</p>
                      <p className="text-[10px] text-slate-500">de experiencia</p>
                    </div>
                  </div>
                </div>
                {/* Central icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-2xl bg-white shadow-2xl shadow-teal-600/10 flex items-center justify-center border border-stone-100">
                    <svg className="w-12 h-12 text-teal-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                      <path d="M12 2L2 7l10 5 10-5-10-5z" />
                      <path d="M2 17l10 5 10-5" />
                      <path d="M2 12l10 5 10-5" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Text */}
            <div className="reveal">
              <p className="text-sm font-semibold text-teal-600 tracking-widest uppercase mb-3">Sobre Nosotras</p>
              <h2 className="font-display text-3xl sm:text-4xl text-slate-900 leading-tight mb-6">
                Detras de cada expediente hay <span className="text-teal-600">una historia</span>
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed mb-4">
                Somos un equipo de abogadas apasionadas por defender los derechos de la comunidad inmigrante en Espana. Con mas de una decada de experiencia, hemos ayudado a miles de personas a regularizar su situacion, reunirse con sus familias y construir su futuro.
              </p>
              <p className="text-base text-slate-500 leading-relaxed mb-8">
                Entendemos que detras de cada expediente hay una familia, un sueno, una vida entera. Por eso ofrecemos un trato cercano, transparente y personalizado que va mas alla del tramite legal.
              </p>

              {/* Quote */}
              <div className="border-l-2 border-teal-500 pl-5 py-1 mb-8">
                <p className="font-display text-xl text-slate-700 italic">&ldquo;Donde otros ven tramites, nosotras vemos suenos.&rdquo;</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {['Profesionalismo', 'Cercania', 'Transparencia', 'Compromiso'].map((v) => (
                  <div key={v} className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                      <svg className="w-3 h-3 text-teal-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    </div>
                    <span className="text-sm font-medium text-slate-700">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────── PROCESS ────────────────── */}
      <section id="proceso" className="py-24 sm:py-32 bg-stone-50/60">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="text-center mb-16 reveal">
            <p className="text-sm font-semibold text-teal-600 tracking-widest uppercase mb-3">Proceso</p>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-slate-900 mb-5">
              Tres pasos hacia tu <span className="text-teal-600">tranquilidad</span>
            </h2>
            <p className="max-w-lg mx-auto text-lg text-slate-500">Sencillo, claro y sin complicaciones.</p>
          </div>

          <div className="relative">
            {/* Connecting line (desktop) */}
            <div className="hidden lg:block absolute top-[72px] left-[15%] right-[15%] h-px bg-gradient-to-r from-stone-200 via-teal-300 to-stone-200" />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 stagger-children reveal">
              {PROCESS_STEPS.map((s, i) => (
                <div key={s.num} className="relative text-center">
                  <div className="relative z-10 inline-flex flex-col items-center">
                    <div className="w-[72px] h-[72px] rounded-2xl bg-white border border-stone-200 shadow-lg shadow-stone-200/50 flex items-center justify-center mb-6 text-teal-600">
                      {s.icon}
                    </div>
                    <span className="font-display text-5xl text-teal-100 mb-3">{s.num}</span>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">{s.title}</h3>
                    <p className="text-slate-500 leading-relaxed max-w-[280px]">{s.desc}</p>
                  </div>
                  {i < PROCESS_STEPS.length - 1 && (
                    <div className="lg:hidden flex justify-center py-4 text-teal-300">
                      <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────── TESTIMONIALS ────────────────── */}
      <section id="testimonios" className="py-24 sm:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="text-center mb-16 reveal">
            <p className="text-sm font-semibold text-teal-600 tracking-widest uppercase mb-3">Testimonios</p>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-slate-900 mb-5">
              Lo que dicen <span className="text-teal-600">nuestros clientes</span>
            </h2>
          </div>

          {/* Featured + Grid layout */}
          <div className="grid lg:grid-cols-5 gap-6 stagger-children reveal">
            {/* Featured testimonial */}
            {TESTIMONIALS.filter((t) => t.featured).map((t) => (
              <div key={t.name} className="lg:col-span-3 testimonial-card bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 sm:p-10 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-teal-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                <svg className="w-12 h-12 text-teal-500/30 mb-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H14.017zM0 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H0z" />
                </svg>
                <p className="text-lg sm:text-xl leading-relaxed text-white/90 mb-8 font-display italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white text-sm font-bold shadow-lg`}>
                    {t.initials}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{t.name}</p>
                    <p className="text-sm text-white/50">{t.origin}</p>
                  </div>
                </div>
              </div>
            ))}

            {/* Side testimonials */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              {TESTIMONIALS.filter((t) => !t.featured).map((t) => (
                <div key={t.name} className="testimonial-card bg-white rounded-2xl p-7 border border-stone-200/70 shadow-sm flex-1">
                  <svg className="w-8 h-8 text-teal-200 mb-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H14.017zM0 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H0z" />
                  </svg>
                  <p className="text-slate-600 leading-relaxed mb-5 italic text-[15px]">&ldquo;{t.quote}&rdquo;</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-stone-100">
                    <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white text-xs font-bold`}>
                      {t.initials}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{t.name}</p>
                      <p className="text-xs text-slate-400">{t.origin}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────── FAQ ────────────────── */}
      <section id="faq" className="py-24 sm:py-32 bg-stone-50/60">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="grid lg:grid-cols-5 gap-12 lg:gap-16">
            {/* Left – Header */}
            <div className="lg:col-span-2 reveal">
              <p className="text-sm font-semibold text-teal-600 tracking-widest uppercase mb-3">FAQ</p>
              <h2 className="font-display text-3xl sm:text-4xl text-slate-900 mb-5">
                Preguntas frecuentes
              </h2>
              <p className="text-slate-500 leading-relaxed mb-6">
                Resolvemos las dudas mas comunes de nuestros clientes. Si no encuentras tu respuesta, no dudes en contactarnos.
              </p>
              <a href="#reservar" className="inline-flex items-center gap-2 text-teal-600 font-semibold text-sm hover:text-teal-700 transition-colors">
                Consulta con nosotras
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              </a>
            </div>

            {/* Right – Accordion */}
            <div className="lg:col-span-3 space-y-3 reveal">
              {FAQS.map((faq, i) => (
                <div key={i} className="bg-white rounded-xl border border-stone-200/70 overflow-hidden">
                  <button type="button" onClick={() => setFaqOpen(faqOpen === i ? null : i)} className="w-full flex items-center justify-between px-6 py-5 text-left group">
                    <span className="text-[15px] font-medium text-slate-800 pr-4 group-hover:text-teal-700 transition-colors">{faq.q}</span>
                    <div className={`w-7 h-7 rounded-full bg-stone-100 group-hover:bg-teal-50 flex items-center justify-center shrink-0 transition-all ${faqOpen === i ? 'bg-teal-50 rotate-180' : ''}`}>
                      <svg className="w-4 h-4 text-slate-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    </div>
                  </button>
                  <div className={`faq-answer ${faqOpen === i ? 'open' : ''}`}>
                    <div><p className="px-6 pb-5 text-slate-500 leading-relaxed text-[15px]">{faq.a}</p></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────── CTA ────────────────── */}
      <section className="relative py-24 sm:py-32 overflow-hidden" style={{ background: 'linear-gradient(135deg, #020617 0%, #042f2e 50%, #0c4a6e 100%)' }}>
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
        <div className="absolute w-[500px] h-[500px] -top-[200px] right-[10%] bg-teal-500/[0.08] rounded-full blur-[120px]" />
        <div className="absolute w-[400px] h-[400px] -bottom-[150px] left-[5%] bg-cyan-500/[0.06] rounded-full blur-[100px]" />

        <div className="relative max-w-3xl mx-auto px-5 sm:px-8 text-center reveal">
          <p className="text-sm font-semibold text-teal-400 tracking-widest uppercase mb-4">Da el primer paso</p>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-white mb-6 leading-tight">
            Tu tranquilidad esta a{' '}
            <span className="text-gradient-teal">una consulta</span>
            {' '}de distancia
          </h2>
          <p className="text-lg text-slate-400 mb-10 max-w-xl mx-auto">
            No dejes tu futuro al azar. Reserva tu consulta con nuestras abogadas y empieza a construir la solucion que necesitas.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#reservar" className="w-full sm:w-auto px-9 py-4 rounded-full bg-teal-500 text-white font-semibold text-lg hover:bg-teal-400 transition-all hover:shadow-xl hover:shadow-teal-500/20">
              Reserva tu cita ahora
            </a>
            <a href="tel:+34600000000" className="w-full sm:w-auto px-9 py-4 rounded-full glass text-white font-medium text-lg hover:bg-white/10 transition-all flex items-center justify-center gap-2">
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
              Llamanos
            </a>
          </div>
        </div>
      </section>

      {/* ────────────────── BOOKING ────────────────── */}
      <section id="reservar" className="py-24 sm:py-32 bg-white">
        <div className="max-w-3xl mx-auto px-5 sm:px-8">
          <div className="text-center mb-12 reveal">
            <p className="text-sm font-semibold text-teal-600 tracking-widest uppercase mb-3">Reserva Online</p>
            <h2 className="font-display text-3xl sm:text-4xl text-slate-900 mb-4">Agenda tu cita en minutos</h2>
            <p className="max-w-md mx-auto text-slate-500">Selecciona el servicio, elige fecha y horario, y confirma tu reserva.</p>
          </div>
          <div className="reveal"><BookingWizard /></div>
          <div className="reveal mt-14 border-t border-stone-200 pt-10">
            <div className="rounded-2xl border border-teal-100 bg-teal-50/60 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Ya eres cliente?</h3>
                <p className="text-sm text-slate-500">Entra a Mi Portal para consultar citas, pagos, documentos y estado de tu tramite.</p>
              </div>
              <a href="/portal" className="shrink-0 px-6 py-3 rounded-full bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition-colors text-center">
                Entrar a Mi Portal
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────── FOOTER ────────────────── */}
      <footer className="bg-slate-950 text-slate-400">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-16 sm:py-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-lg bg-teal-600 flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
                </div>
                <span className="font-display text-lg text-white">Consultorio de Extranjeria</span>
              </div>
              <p className="text-sm leading-relaxed mb-5">Abogadas especializadas en derecho de extranjeria. Tu confianza es nuestra responsabilidad.</p>
              <div className="flex gap-2.5">
                {[
                  <path key="fb" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />,
                  <path key="ig" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />,
                  <path key="li" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />,
                ].map((icon, i) => (
                  <a key={i} href="#" className="w-9 h-9 rounded-lg bg-white/5 hover:bg-teal-600 flex items-center justify-center transition-colors">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">{icon}</svg>
                  </a>
                ))}
              </div>
            </div>

            {/* Services */}
            <div>
              <h4 className="text-xs font-semibold text-white uppercase tracking-widest mb-4">Servicios</h4>
              <ul className="space-y-2.5">
                {SERVICES.map((s) => (
                  <li key={s.name}><a href="#servicios" className="text-sm hover:text-teal-400 transition-colors">{s.name}</a></li>
                ))}
              </ul>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-xs font-semibold text-white uppercase tracking-widest mb-4">Enlaces</h4>
              <ul className="space-y-2.5">
                {[
                  ['Reservar cita', '#reservar'],
                  ['Blog', '/blog'],
                  ['Preguntas frecuentes', '#faq'],
                  ['Sobre nosotras', '#nosotras'],
                  ['Administracion', '/admin/login'],
                  ['Facturacion', '/facturador'],
                ].map(([label, href]) => (
                  <li key={label}><a href={href} className="text-sm hover:text-teal-400 transition-colors">{label}</a></li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-xs font-semibold text-white uppercase tracking-widest mb-4">Contacto</h4>
              <ul className="space-y-3">
                {[
                  [<svg key="loc" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>, 'Madrid, Espana'],
                  [<svg key="mail" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg>, 'info@consultorioextranjeria.es'],
                  [<svg key="phone" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>, '+34 600 000 000'],
                  [<svg key="clock" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>, 'Lun - Vie: 9:00 - 18:00'],
                ].map(([icon, text], i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="text-teal-500 mt-0.5 shrink-0">{icon}</span>
                    <span className="text-sm">{text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
            <p>&copy; {new Date().getFullYear()} Consultorio de Abogadas de Extranjeria. Todos los derechos reservados.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-slate-400 transition-colors">Aviso legal</a>
              <a href="#" className="hover:text-slate-400 transition-colors">Privacidad</a>
              <a href="#" className="hover:text-slate-400 transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>

      {/* ────────────────── MOBILE LOOKUP MODAL ────────────────── */}
      {showLookup && (
        <div className="sm:hidden fixed inset-0 z-50 bg-black/50 flex items-end animate-fade-in" onClick={() => setShowLookup(false)}>
          <div className="bg-white w-full rounded-t-2xl p-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-slate-900">Consultar tu cita</h3>
                <p className="text-sm text-slate-500">Usa tu email y telefono.</p>
              </div>
              <button type="button" onClick={() => setShowLookup(false)} className="text-sm text-slate-500 hover:text-slate-700">Cerrar</button>
            </div>
            <AppointmentLookup />
          </div>
        </div>
      )}
    </div>
  );
}
