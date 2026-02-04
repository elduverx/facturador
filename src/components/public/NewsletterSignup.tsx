'use client';

import { useState } from 'react';
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
    <div className="card">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">Recibe novedades por email</h3>
          <p className="text-xs text-stone-500">Te enviaremos las nuevas publicaciones del blog.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
        <input
          type="email"
          placeholder="tu@email.com"
          className="form-input text-sm"
          value={email}
          onChange={(e) => setEmail(normalizeEmail(e.target.value))}
          required
        />
        <button type="submit" className="btn btn-primary text-sm" disabled={loading}>
          {loading ? 'Enviando...' : 'Suscribirme'}
        </button>
      </form>

      <label className="flex items-start gap-2 text-[11px] text-stone-500 mt-3">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5"
        />
        <span>
          Acepto recibir comunicaciones y la politica de privacidad.
        </span>
      </label>

      {error && <div className="mt-2 text-xs text-red-600">{error}</div>}
      {!error && message && <div className="mt-2 text-xs text-stone-500">{message}</div>}
    </div>
  );
}
