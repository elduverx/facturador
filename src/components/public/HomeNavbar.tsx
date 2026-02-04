'use client';

import { useState } from 'react';

type NavLink = {
  label: string;
  href: string;
};

const NAV_LINKS: NavLink[] = [
  { label: 'Pagina principal', href: '/frontend' },
  { label: 'Reservar', href: '#reservar' },
  { label: 'Mis citas', href: '#consultar' },
  { label: 'Blog', href: '/blog' },
  { label: 'Admin', href: '/admin/login' },
  { label: 'Facturacion', href: '/facturador' },
];

interface HomeNavbarProps {
  onOpenConsult?: () => void;
}

export function HomeNavbar({ onOpenConsult }: HomeNavbarProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <div className="hidden sm:flex items-center gap-3 text-xs text-teal-100">
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
        className="sm:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-white/30 text-white hover:bg-white/10 transition-colors"
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
        <div className="sm:hidden absolute right-0 mt-2 w-48 rounded-xl border border-stone-200 bg-white shadow-lg overflow-hidden z-40">
          {NAV_LINKS.map((link) => {
            const isConsult = link.href === '#consultar';
            if (isConsult && onOpenConsult) {
              return (
                <button
                  key={link.href}
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onOpenConsult();
                  }}
                  className="block w-full text-left px-4 py-3 text-sm text-stone-700 hover:bg-stone-50"
                >
                  {link.label}
                </button>
              );
            }
            return (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="block px-4 py-3 text-sm text-stone-700 hover:bg-stone-50"
              >
                {link.label}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
