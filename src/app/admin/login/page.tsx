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

      router.push('/admin');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error de conexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pv-page min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="pv-frame pv-paper p-6 sm:p-8">
          <div className="text-center mb-7">
            <div className="pv-seal w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 font-legal text-xl font-bold">
              PV
            </div>
            <p className="font-legal text-xs uppercase tracking-[0.24em] text-[var(--pv-muted)]">Acceso privado</p>
            <h1 className="font-legal text-3xl text-[var(--pv-navy)] mt-2">Panel de Administracion</h1>
            <p className="text-sm text-[var(--pv-muted)] mt-2">PV Abogadas</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="form-label block text-sm mb-2">Codigo de acceso</label>
              <input
                type="password"
                className="form-input text-center text-lg tracking-widest"
                placeholder="------"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                autoFocus
                maxLength={20}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md p-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!pin || loading}
              className="btn btn-primary w-full justify-center disabled:opacity-50"
            >
              {loading ? 'Verificando...' : 'Acceder'}
            </button>
          </form>

          <div className="text-center mt-6">
            <a href="/" className="text-xs text-[var(--pv-muted)] hover:text-[var(--pv-navy)] transition-colors">
              Volver a la pagina principal
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
