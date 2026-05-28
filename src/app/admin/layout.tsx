'use client';

import React, { useState } from 'react';
import {
  Calendar,
  FileText,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  Sparkles,
  UserCog,
  Users,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const menuItems = [
  { href: '/admin', label: 'Panel', icon: LayoutDashboard, mobile: true },
  { href: '/admin/clientes', label: 'Clientes', icon: Users, mobile: true },
  { href: '/admin/expedientes', label: 'Expedientes', icon: FolderKanban, mobile: true },
  { href: '/admin/calendario', label: 'Agenda', icon: Calendar, mobile: true },
  { href: '/admin/ai', label: 'IA', icon: Sparkles },
  { href: '/admin/equipo', label: 'Equipo', icon: UserCog },
  { href: '/admin/blog', label: 'Blog', icon: FileText },
];

const secondaryItems = [
  { href: '/admin/configuracion', label: 'Ajustes', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const allItems = [...menuItems, ...secondaryItems];
  const pageLabel = allItems.find((item) => item.href === pathname)?.label || 'Administrador';
  const mainMobileItems = menuItems.filter((item) => item.mobile);
  const moreMobileItems = [...menuItems.filter((item) => !item.mobile), ...secondaryItems];

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      window.location.href = '/admin/login';
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--pv-marble)] flex flex-col lg:flex-row">
      <aside className="hidden lg:flex w-72 bg-[var(--glass-bg)] backdrop-blur-xl border-r border-[var(--glass-border)] flex-col fixed h-full z-20 shadow-xl">
        <div className="p-8 border-b border-[var(--glass-border)]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[var(--pv-gold)] rounded-full flex items-center justify-center shadow-lg rotate-12">
              <ShieldCheck className="text-white w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tighter text-[var(--pv-ink)] font-roman">PV ABOGADAS</h1>
              <p className="text-[10px] uppercase tracking-widest text-[var(--pv-gold)] font-bold">Administración</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <Link key={item.href} href={item.href} className={`nav-item-roman ${pathname === item.href ? 'active' : ''}`}>
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}

          <div className="pt-4 pb-2">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--pv-navy)] opacity-40 font-bold px-4">Sistema</p>
          </div>
          {secondaryItems.map((item) => (
            <Link key={item.href} href={item.href} className={`nav-item-roman ${pathname === item.href ? 'active' : ''}`}>
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-6 border-t border-[var(--glass-border)] bg-white/30">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 text-red-600 hover:text-red-700 font-medium px-4 py-2 transition-colors w-full"
          >
            <LogOut size={20} />
            <span>Salir</span>
          </button>
        </div>
      </aside>

      <header className="lg:hidden h-16 bg-[var(--glass-bg)] backdrop-blur-md border-b border-[var(--glass-border)] sticky top-0 z-30 flex items-center justify-between px-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[var(--pv-gold)] rounded-full flex items-center justify-center shadow-md rotate-12">
            <ShieldCheck className="text-white w-5 h-5" />
          </div>
          <span className="font-roman font-bold text-sm tracking-tight text-[var(--pv-ink)] uppercase">PV Admin</span>
        </div>
        <div className="w-8 h-8 rounded-full bg-[var(--pv-gold)] border border-white shadow-sm flex items-center justify-center text-white text-xs font-bold">
          A
        </div>
      </header>

      <main className="flex-1 lg:ml-72 min-h-screen relative pb-16 lg:pb-0 flex flex-col">
        <header className="hidden lg:flex h-16 bg-[var(--glass-bg)] backdrop-blur-md border-b border-[var(--glass-border)] sticky top-0 z-20 items-center justify-between px-8 shadow-sm shrink-0">
          <h2 className="text-lg font-bold text-[var(--pv-ink)] font-roman uppercase tracking-tight">{pageLabel}</h2>
          <div className="flex items-center gap-2 text-xs font-medium text-[var(--pv-navy)]">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            Online
          </div>
        </header>

        <div className="lg:hidden px-5 pt-4 shrink-0">
          <h2 className="text-base font-bold text-[var(--pv-ink)] font-roman uppercase tracking-tight">{pageLabel}</h2>
        </div>

        <div className="p-4 lg:p-6 relative z-10 flex-1 overflow-auto">{children}</div>
      </main>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-[var(--glass-bg)] backdrop-blur-xl border-t border-[var(--glass-border)] z-40 flex items-center justify-around px-2 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        {mainMobileItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center gap-1 min-w-[64px] transition-all duration-300 ${pathname === item.href ? 'text-[var(--pv-gold)]' : 'text-[var(--pv-navy)] opacity-45'}`}
          >
            <item.icon size={20} />
            <span className="text-[9px] font-black uppercase tracking-tighter">{item.label}</span>
          </Link>
        ))}

        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center gap-1 min-w-[64px] text-[var(--pv-navy)] opacity-45"
        >
          <Menu size={20} />
          <span className="text-[9px] font-black uppercase tracking-tighter">Más</span>
        </button>
      </nav>

      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-[var(--pv-navy)] z-50 flex flex-col">
          <div className="p-6 flex items-center justify-between border-b border-white/10">
            <span className="font-roman font-bold text-lg tracking-tight text-white uppercase">Más opciones</span>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="p-3 rounded-2xl bg-white/10 text-white hover:bg-white/20 transition-all"
            >
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 gap-4">
            {moreMobileItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex flex-col items-center justify-center p-5 rounded-2xl border transition-all duration-300 gap-3 ${
                  pathname === item.href
                    ? 'bg-[var(--pv-gold)] border-[var(--pv-gold)] text-white'
                    : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                }`}
              >
                <item.icon size={26} />
                <span className="text-[10px] font-black uppercase tracking-widest text-center">{item.label}</span>
              </Link>
            ))}
          </div>

          <div className="p-6 border-t border-white/10 bg-black/20">
            <button 
              onClick={handleLogout}
              className="flex items-center justify-center gap-3 text-red-400 font-bold uppercase tracking-widest text-xs w-full p-4 rounded-2xl border border-red-400/20 hover:bg-red-400/10 transition-all"
            >
              <LogOut size={20} />
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
