'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', mobileLabel: 'Inicio', icon: 'M4 4h6v6H4zM14 4h6v6h-6zM14 14h6v6h-6zM4 14h6v6H4z' },
  { href: '/admin/calendario', label: 'Calendario', mobileLabel: 'Agenda', icon: 'M4 5h16v15H4zM16 3v4M8 3v4M4 10h16' },
  { href: '/admin/clientes', label: 'Clientes', mobileLabel: 'Clientes', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75' },
  { href: '/admin/configuracion', label: 'Configuracion', mobileLabel: 'Ajustes', icon: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M19.4 15a1.7 1.7 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09A1.7 1.7 0 0 0 19.4 15z' },
  { href: '/admin/blog', label: 'Blog', mobileLabel: 'Blog', icon: 'M4 4h16v16H4zM8 8h8M8 12h8M8 16h5' },
  { href: '/admin/ai', label: 'IA Asistente', mobileLabel: 'IA', icon: 'M12 2v4M12 18v4m-7.07-17.07 2.83 2.83m8.48 8.48 2.83 2.83M2 12h4m12 0h4m-17.07 7.07 2.83-2.83m8.48-8.48 2.83-2.83' },
];

const MOBILE_NAV_ITEMS = [
  NAV_ITEMS[0],
  NAV_ITEMS[1],
  NAV_ITEMS[5],
  NAV_ITEMS[2],
  NAV_ITEMS[3],
];

const EXTRA_ITEMS = [
  { href: '/facturador', label: 'Facturacion' },
  { href: '/frontend', label: 'Pagina publica' },
  { href: '/', label: 'Inicio publico' },
];

const NavIcon = ({ path }: { path: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d={path} />
  </svg>
);

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    document.cookie = 'admin_session=; Max-Age=0; path=/';
    router.push('/admin/login');
  };

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <div className="admin-skin min-h-screen bg-[var(--pv-ink)]">
      <div className="lg:hidden flex items-center justify-between pv-dark-panel border-b border-[rgba(200,170,106,0.42)] px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="pv-seal w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold">PV</div>
          <span className="font-legal text-sm text-[#f8f1df]">Admin</span>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-md border border-[#c8aa6a]/40 text-[#ead9ad] hover:bg-white/10">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      <div className="flex">
        <aside className={`fixed inset-y-0 left-0 z-50 w-64 pv-dark-panel border-r border-[rgba(200,170,106,0.42)] transform transition-transform lg:translate-x-0 lg:static lg:z-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-[rgba(200,170,106,0.28)] hidden lg:block">
              <div className="flex items-center gap-3">
                <div className="pv-seal w-10 h-10 rounded-full flex items-center justify-center font-legal font-bold">PV</div>
                <div>
                  <div className="font-legal text-sm text-[#f8f1df] tracking-wide">PV Abogadas</div>
                  <div className="text-[10px] text-[#c8aa6a] uppercase font-bold tracking-widest">Panel control</div>
                </div>
              </div>
            </div>

            <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto mt-14 lg:mt-0">
              <div className="text-[10px] uppercase tracking-[0.16em] text-[#c8aa6a] font-bold px-3 py-2 mb-1">Gestion</div>
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-md text-sm transition-all duration-200 ${
                    isActive(item.href)
                      ? 'bg-[#f8f1df] text-[var(--pv-navy)] font-semibold shadow-md translate-x-1'
                      : 'text-[#d8c7a0] hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className={isActive(item.href) ? 'text-[var(--pv-navy)]' : 'text-[#c8aa6a]'}>
                    <NavIcon path={item.icon} />
                  </span>
                  {item.label}
                </a>
              ))}

              <div className="text-[10px] uppercase tracking-[0.16em] text-[#c8aa6a] font-bold px-3 py-2 mt-6 mb-1">Acceso rapido</div>
              {EXTRA_ITEMS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-md text-sm text-[#d8c7a0] hover:bg-white/10 hover:text-white transition-all"
                >
                  <span className="text-[#c8aa6a]">PV</span>
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="p-4 border-t border-[rgba(200,170,106,0.28)]">
              <div className="px-3 py-3 mb-2 flex items-center gap-3">
                <div className="pv-seal w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold">AD</div>
                <div className="text-xs">
                  <div className="font-bold text-[#f8f1df]">Administrador</div>
                  <div className="text-[10px] text-[#c8aa6a]">Sesion activa</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-md text-sm text-red-200 hover:bg-red-500/20 w-full transition-all font-medium"
              >
                Cerrar sesion
              </button>
            </div>
          </div>
        </aside>

        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        <main className="flex-1 min-h-screen pv-page">
          <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-8">
            {children}
          </div>
        </main>
      </div>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 pv-dark-panel border-t border-[rgba(200,170,106,0.42)] pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-5">
          {MOBILE_NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors ${
                isActive(item.href) ? 'text-[#f8f1df]' : 'text-[#d8c7a0] hover:text-white'
              }`}
            >
              <span className={`p-1.5 rounded-md ${isActive(item.href) ? 'bg-[#f8f1df] text-[var(--pv-navy)]' : 'text-[#d8c7a0]'}`}>
                <NavIcon path={item.icon} />
              </span>
              <span className="whitespace-nowrap leading-none">{item.mobileLabel || item.label}</span>
            </a>
          ))}
        </div>
        <div className="h-2" />
      </nav>
    </div>
  );
}
