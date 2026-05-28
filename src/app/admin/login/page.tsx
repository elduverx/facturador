'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error de autenticacion');
      }

      router.replace('/admin');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error de conexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--pv-marble)] relative overflow-hidden">
      {/* Decorative ambient lights */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[var(--pv-gold)]/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--pv-navy)]/5 rounded-full blur-[120px]" />

      <div className="w-full max-w-md relative z-10">
        <div className="neo-card p-8 sm:p-12 relative overflow-hidden">
          {/* Decorative Corner */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--pv-gold)]/5 -mr-12 -mt-12 rounded-full" />
          
          <div className="text-center mb-10">
            <div className="w-20 h-20 rounded-full bg-[var(--pv-gold)] flex items-center justify-center mx-auto mb-6 font-roman text-2xl font-bold text-white shadow-lg rotate-12 ring-4 ring-white/50">
              PV
            </div>
            <p className="font-roman text-[10px] uppercase tracking-[0.3em] text-[var(--pv-gold)] font-bold mb-2">Acceso privado</p>
            <h1 className="font-roman text-3xl text-[var(--pv-navy)] leading-tight">Panel de Administracion</h1>
            <div className="h-px w-12 bg-[var(--pv-gold)]/30 mx-auto my-4" />
            <p className="text-xs uppercase tracking-[0.15em] text-[var(--pv-navy)] opacity-60 font-medium">PV Abogadas</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[var(--pv-navy)] font-bold text-[10px] uppercase tracking-widest mb-3 px-1">
                Codigo de acceso
              </label>
              <input
                type="password"
                className="neo-input text-center text-2xl tracking-[0.5em] font-bold py-4"
                placeholder="------"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                autoFocus
                maxLength={20}
              />
            </div>

            {error && (
              <div className="bg-red-50/50 border border-red-100 text-red-600 text-[11px] font-bold uppercase tracking-wide rounded-xl p-4 text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!pin || loading}
              className="btn-roman w-full py-4 text-xs font-bold uppercase tracking-[0.2em] disabled:opacity-50"
            >
              {loading ? 'Verificando...' : 'Acceder'}
            </button>
          </form>

          <div className="text-center mt-10 pt-6 border-t border-[var(--pv-marble)]">
            <a 
              href="/" 
              className="text-[10px] uppercase tracking-[0.2em] font-bold text-[var(--pv-navy)] opacity-40 hover:opacity-100 transition-opacity flex items-center justify-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Volver a la pagina principal
            </a>
          </div>
        </div>

        <p className="text-center mt-8 text-[9px] uppercase tracking-widest text-[var(--pv-navy)] opacity-30 font-bold">
          &copy; {new Date().getFullYear()} PV ABOGADAS · LEGAL MANAGEMENT SYSTEM
        </p>
      </div>
    </div>
  );
}
