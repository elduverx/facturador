'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { HomeNavbar } from './HomeNavbar';

export function PublicHeader() {
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

  return (
    <header className={`fixed w-full z-50 bg-[var(--glass-bg)] backdrop-blur-md border-b border-[var(--glass-border)] shadow-sm transition-transform duration-500 ease-in-out ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full'}`}>
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
  );
}
