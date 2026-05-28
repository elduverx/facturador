'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Servicios', href: '#servicios' },
  { label: 'Nosotras', href: '#nosotras' },
  { label: 'Proceso', href: '#proceso' },
  { label: 'Reservar', href: '/reservar' },
  { label: 'Mi Portal', href: '/portal' },
];

export function HomeNavbar() {
  const [open, setOpen] = useState(false);

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
          href="/admin/login" 
          className="btn-roman !px-5 !py-2 !text-[10px]"
        >
          Login
        </Link>
      </div>

      {/* Mobile Menu Button */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`md:hidden p-2.5 rounded-xl border shadow-sm transition-all ${
          open
            ? 'bg-[var(--pv-gold)] border-[var(--pv-gold)] text-white'
            : 'bg-white/85 border-white/70 text-[var(--pv-navy)] hover:text-[var(--pv-gold)]'
        }`}
        aria-label={open ? 'Cerrar menu' : 'Abrir menu'}
      >
        {open ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Menu Overlay */}
      {open && (
        <div className="md:hidden fixed inset-0 top-16 bg-[var(--glass-bg)] backdrop-blur-xl z-50 border-t border-[var(--glass-border)] animate-fade-in">
          <div className="flex flex-col p-8 space-y-6">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-lg font-bold font-roman uppercase tracking-widest text-[var(--pv-ink)] border-b border-[var(--glass-border)] pb-4"
              >
                {link.label}
              </a>
            ))}
            <Link 
              href="/admin/login" 
              onClick={() => setOpen(false)}
              className="btn-roman w-full py-4 text-center"
            >
              Login
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
