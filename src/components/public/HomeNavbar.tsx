'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Menu, X, BookOpen, Users, Calendar, HelpCircle, ArrowRight, UserCircle } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Servicios', href: '#servicios', icon: BookOpen },
  { label: 'Testimonios', href: '#testimonios', icon: Users },
  { label: 'Reserva', href: '#reservar', icon: Calendar },
  { label: 'FAQ', href: '#faq', icon: HelpCircle },
];

export function HomeNavbar() {
  const [open, setOpen] = useState(false);

  // Prevenir scroll cuando el menu esta abierto
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const mobileOverlay = (
    <div 
      className={`md:hidden fixed inset-0 bg-[var(--pv-navy)] z-[100] flex flex-col justify-center transition-all duration-700 ease-in-out ${
        open ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'
      }`}
    >
      {/* Decoracion de fondo */}
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none rotate-12 scale-150 transform translate-x-1/4 -translate-y-1/4">
         <BookOpen size={400} className="text-white" />
      </div>

      <div className="px-8 flex flex-col space-y-8 mt-12 relative z-10">
        {NAV_LINKS.map((link, index) => (
          <a
            key={link.href}
            href={link.href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-6 group transition-all duration-500 ease-out ${
              open ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`}
            style={{ transitionDelay: `${100 + index * 50}ms` }}
          >
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[var(--pv-gold)] group-hover:scale-110 group-hover:bg-[var(--pv-gold)] group-hover:text-white transition-all shadow-lg">
              <link.icon size={20} />
            </div>
            <span className="text-2xl sm:text-3xl font-bold font-roman uppercase tracking-widest text-white group-hover:text-[var(--pv-gold)] transition-colors">
              {link.label}
            </span>
          </a>
        ))}
        
        <div 
          className={`w-full h-px bg-gradient-to-r from-[var(--pv-gold)]/0 via-[var(--pv-gold)]/30 to-[var(--pv-gold)]/0 my-4 transition-all duration-500 delay-300 ${open ? 'opacity-100' : 'opacity-0'}`} 
        />

        <Link 
          href="/reservar" 
          onClick={() => setOpen(false)}
          className={`btn-roman w-full py-5 text-center flex items-center justify-center gap-3 transition-all duration-500 ease-out shadow-2xl shadow-[var(--pv-gold)]/20 ${
            open ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
          style={{ transitionDelay: '350ms' }}
        >
          Agendar Asesoría <ArrowRight size={20} />
        </Link>

        <Link 
          href="/portal" 
          onClick={() => setOpen(false)}
          className={`w-full py-4 text-center flex items-center justify-center gap-3 transition-all duration-500 ease-out text-white/70 hover:text-white uppercase tracking-widest text-xs font-bold ${
            open ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
          style={{ transitionDelay: '400ms' }}
        >
          <UserCircle size={18} /> Acceder a Mi Portal
        </Link>
      </div>
    </div>
  );

  return (
    <div className="relative">
      {/* Desktop Menu */}
      <div className="hidden md:flex items-center gap-8 text-[10px] uppercase tracking-[0.3em] font-bold text-[var(--pv-navy)]">
        {NAV_LINKS.map((link) => (
          <a 
            key={link.href} 
            href={link.href} 
            className="hover:text-[var(--pv-gold)] transition-colors relative group"
          >
            {link.label}
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[var(--pv-gold)] transition-all group-hover:w-full"></span>
          </a>
        ))}
        <Link 
          href="/portal" 
          className="btn-roman !px-5 !py-2 !text-[10px]"
        >
          Mi Portal
        </Link>
      </div>

      {/* Mobile Menu Button */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`md:hidden p-3 rounded-2xl border transition-all z-[110] relative overflow-hidden ${
          open
            ? 'bg-transparent border-transparent text-white'
            : 'bg-[var(--pv-marble)]/80 backdrop-blur-md border-[var(--glass-border)] text-[var(--pv-navy)] hover:text-[var(--pv-gold)] hover:border-[var(--pv-gold)]/50'
        }`}
        aria-label={open ? 'Cerrar menu' : 'Abrir menu'}
      >
        {open ? <X size={28} className="animate-spin-slow" /> : <Menu size={24} />}
      </button>

      {/* Mobile Menu Overlay */}
      {mounted && createPortal(mobileOverlay, document.body)}
    </div>
  );
}
