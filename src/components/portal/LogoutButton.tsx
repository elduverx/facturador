'use client';

import { LogOut } from 'lucide-react';

export function LogoutButton() {
  const handleLogout = async () => {
    try {
      await fetch('/api/portal/session', { method: 'DELETE' });
      window.location.reload();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl bg-transparent hover:bg-red-50 border border-transparent hover:border-red-100 px-6 py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--pv-navy)]/60 hover:text-red-600 transition-all duration-300"
    >
      <LogOut size={14} />
      Cerrar Sesión
    </button>
  );
}
