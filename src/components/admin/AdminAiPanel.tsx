'use client';

import { useState } from 'react';

type AiPlan = {
  resumen: string;
  prioridad: 'BAJA' | 'MEDIA' | 'ALTA';
  alertas: Array<{
    titulo: string;
    detalle: string;
    clientEmail?: string;
    appointmentId?: string;
  }>;
  proximas_acciones: Array<{
    accion: string;
    motivo: string;
    clientEmail?: string;
    appointmentId?: string;
  }>;
};

type AiResponse = {
  success: boolean;
  plan: AiPlan;
  createdCount: number;
};

const PRIORITY_CLASS = {
  BAJA: 'bg-stone-100 text-stone-700 border-stone-200',
  MEDIA: 'bg-amber-100 text-amber-800 border-amber-200',
  ALTA: 'bg-red-100 text-red-700 border-red-200',
};

export function AdminAiPanel() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiResponse | null>(null);
  const [error, setError] = useState('');

  const runAutomation = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/ai/automation', { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || 'No se pudo ejecutar Claude.');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo ejecutar Claude.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card shadow-sm border-teal-200 bg-white">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v4"></path>
                <path d="M12 18v4"></path>
                <path d="m4.93 4.93 2.83 2.83"></path>
                <path d="m16.24 16.24 2.83 2.83"></path>
                <path d="M2 12h4"></path>
                <path d="M18 12h4"></path>
                <path d="m4.93 19.07 2.83-2.83"></path>
                <path d="m16.24 7.76 2.83-2.83"></path>
              </svg>
            </span>
            <div>
              <h2 className="text-sm font-bold text-stone-800">Automatizacion con Claude</h2>
              <p className="text-xs text-stone-500 mt-0.5">Revisa agenda, pagos y notas; crea seguimientos internos si procede.</p>
            </div>
          </div>
        </div>

        <button
          onClick={runAutomation}
          disabled={loading}
          className="btn btn-primary text-xs disabled:opacity-60 shrink-0"
        >
          {loading ? 'Analizando...' : 'Analizar y automatizar'}
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-[10px] px-2 py-1 rounded-full border font-bold ${PRIORITY_CLASS[result.plan.prioridad]}`}>
              Prioridad {result.plan.prioridad}
            </span>
            <span className="text-xs text-stone-500">
              {result.createdCount} notas internas creadas automaticamente
            </span>
          </div>

          <p className="text-sm text-stone-700 leading-relaxed">{result.plan.resumen}</p>

          {result.plan.alertas.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-stone-700 mb-2">Alertas</h3>
              <div className="space-y-2">
                {result.plan.alertas.map((alerta, index) => (
                  <div key={`${alerta.titulo}-${index}`} className="rounded-lg border border-stone-200 bg-stone-50 p-3">
                    <div className="text-xs font-bold text-stone-800">{alerta.titulo}</div>
                    <div className="text-xs text-stone-600 mt-1">{alerta.detalle}</div>
                    {alerta.clientEmail && (
                      <div className="text-[11px] text-stone-400 mt-2">{alerta.clientEmail}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.plan.proximas_acciones.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-stone-700 mb-2">Proximas acciones</h3>
              <div className="space-y-2">
                {result.plan.proximas_acciones.map((item, index) => (
                  <div key={`${item.accion}-${index}`} className="rounded-lg border border-teal-100 bg-teal-50/40 p-3">
                    <div className="text-xs font-bold text-stone-800">{item.accion}</div>
                    <div className="text-xs text-stone-600 mt-1">{item.motivo}</div>
                    {item.clientEmail && (
                      <a href={`/admin/clientes?search=${encodeURIComponent(item.clientEmail)}`} className="inline-block text-[11px] text-teal-700 mt-2 hover:underline">
                        {item.clientEmail}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
