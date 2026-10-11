'use client';

import { useState } from 'react';
import { Mail } from 'lucide-react';
import { isValidEmail, normalizeEmail } from '@/lib/validation';

export function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');
    setError('');

    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      setError('Email no valido');
      return;
    }
    if (!consent) {
      setError('Debes aceptar la politica de privacidad');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, consent: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'No se pudo completar la suscripcion');
      }
      setMessage(data?.message || 'Suscripcion confirmada.');
      setEmail('');
      setConsent(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al suscribirse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[var(--pv-gold)]/30 bg-white p-6 sm:p-8 shadow-sm">
      <div className="flex items-start gap-4">
        <span className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--pv-marble)] text-[var(--pv-gold)]">
          <Mail size={20} />
        </span>
        <div>
          <h3 className="font-roman text-lg font-bold uppercase text-[var(--pv-navy)]">Novedades de extranjería</h3>
          <p className="text-sm text-stone-500 mt-1">Reciba en su email los nuevos artículos y cambios normativos que le afectan.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
        <input
          type="email"
          placeholder="su@email.com"
          className="neo-input text-sm"
          value={email}
          onChange={(e) => setEmail(normalizeEmail(e.target.value))}
          required
        />
        <button type="submit" className="btn-roman text-sm" disabled={loading}>
          {loading ? 'Enviando...' : 'Suscribirme'}
        </button>
      </form>

      <label className="flex items-start gap-2 text-xs text-stone-500 mt-4">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 accent-[var(--pv-gold)]"
        />
        <span>
          Acepto recibir comunicaciones y la{' '}
          <a href="/politica-privacidad" className="underline hover:text-[var(--pv-navy)]">
            política de privacidad
          </a>
          .
        </span>
      </label>

      {error && <div className="mt-3 text-xs text-red-600">{error}</div>}
      {!error && message && <div className="mt-3 text-xs text-emerald-700">{message}</div>}
    </div>
  );
}
