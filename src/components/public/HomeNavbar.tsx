'use client';

import { useState } from 'react';

type NavLink = {
  label: string;
  href: string;
};

const NAV_LINKS: NavLink[] = [
  { label: 'Servicios', href: '#servicios' },
  { label: 'Nosotras', href: '#nosotras' },
  { label: 'Proceso', href: '#proceso' },
  { label: 'Reservar', href: '#reservar' },
  { label: 'Mi Portal', href: '/portal' },
  { label: 'Blog', href: '/blog' },
];

export function HomeNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <div className="hidden sm:flex items-center gap-4 text-xs uppercase tracking-[0.18em] text-[#ead9ad]">
        {NAV_LINKS.map((link) => (
          <a key={link.href} href={link.href} className="hover:text-white transition-colors">
            {link.label}
          </a>
        ))}
      </div>

      <button
        type="button"
        aria-label="Abrir menu"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="sm:hidden inline-flex items-center justify-center w-10 h-10 rounded-md border border-[#c8aa6a]/60 text-[#ead9ad] hover:bg-white/10 transition-colors"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {open ? (
            <path d="M6 6l12 12M6 18L18 6" />
          ) : (
            <path d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {open && (
        <div className="sm:hidden absolute right-0 mt-2 w-56 rounded-md border border-[#c8aa6a]/60 bg-[#f8f1df] shadow-lg overflow-hidden z-40">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block px-4 py-3 text-sm font-semibold text-[#0b1f2d] hover:bg-[#efe6d0]"
            >
              {link.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
