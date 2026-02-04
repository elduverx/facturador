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
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-teal-700 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <h1 className="font-serif text-xl sm:text-2xl">Panel de Administracion</h1>
          <p className="text-sm text-stone-500 mt-1">Consultorio de Extranjeria</p>
        </div>

        <form onSubmit={handleSubmit} className="card">
          <div className="mb-4">
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
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!pin || loading}
            className="btn btn-primary w-full justify-center disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Verificando...
              </>
            ) : (
              'Acceder'
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <a href="/" className="text-xs text-stone-400 hover:text-teal-600 transition-colors">
            Volver a la pagina principal
          </a>
        </div>
      </div>
    </div>
  );
}
