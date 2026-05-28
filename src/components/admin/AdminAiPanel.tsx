'use client';

import { useState } from 'react';
import { Sparkles, Activity, AlertTriangle, ArrowRight, CheckCircle2, Cpu } from 'lucide-react';

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
        throw new Error(data?.error || 'No se pudo ejecutar la automatización.');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo conectar con la IA.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="neo-card !p-8 shadow-2xl relative overflow-hidden">
      {/* Background Icon */}
      <div className="absolute -right-10 -bottom-10 opacity-[0.03] text-[var(--pv-navy)] pointer-events-none">
         <Cpu size={200} />
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-[var(--pv-navy)] flex items-center justify-center text-[var(--pv-gold)] shadow-xl shrink-0">
             <Sparkles size={32} className={loading ? 'animate-pulse' : ''} />
          </div>
          <div>
            <h2 className="text-xl font-bold font-roman uppercase tracking-tight text-[var(--pv-ink)]">Revisión automática</h2>
            <p className="text-sm text-[var(--pv-navy)] opacity-60 mt-1">Revisa agenda, pagos y expedientes para detectar pendientes.</p>
          </div>
        </div>

        <button
          onClick={runAutomation}
          disabled={loading}
          className="btn-roman px-8 py-4 text-sm font-black uppercase tracking-[0.2em] shadow-xl shadow-[var(--pv-gold)]/20 min-w-[240px]"
        >
          {loading ? 'Consultando...' : <><Activity size={18} /> Iniciar Análisis</>}
        </button>
      </div>

      {error && (
        <div className="mt-8 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-xs font-bold flex items-center gap-2 animate-shake">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {result && (
        <div className="mt-10 space-y-8 animate-fade-in relative z-10">
          <div className="flex flex-wrap items-center gap-4 border-b border-[var(--pv-marble)] pb-6">
            <div className={`px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${PRIORITY_CLASS[result.plan.prioridad]}`}>
              Prioridad {result.plan.prioridad}
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--pv-navy)] opacity-60">
              <CheckCircle2 size={14} className="text-emerald-500" />
              {result.createdCount} Seguimientos Creados
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[var(--pv-marble)] shadow-inner border border-white/50">
             <p className="text-sm text-[var(--pv-navy)] leading-relaxed font-medium">"{result.plan.resumen}"</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             {result.plan.alertas.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-[var(--pv-gold)] uppercase tracking-[0.2em] flex items-center gap-2">
                    <AlertTriangle size={14} /> Alertas de Control
                  </h3>
                  <div className="space-y-3">
                    {result.plan.alertas.map((alerta, index) => (
                      <div key={index} className="p-4 rounded-xl bg-white border border-red-100 shadow-sm hover:shadow-md transition-all">
                        <div className="text-xs font-bold text-[var(--pv-ink)]">{alerta.titulo}</div>
                        <div className="text-[11px] text-[var(--pv-navy)] opacity-60 mt-1">{alerta.detalle}</div>
                        {alerta.clientEmail && (
                          <div className="text-[9px] font-black text-[var(--pv-gold)] uppercase mt-3 tracking-widest">{alerta.clientEmail}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
             )}

             {result.plan.proximas_acciones.length > 0 && (
                <div className="space-y-4">
                   <h3 className="text-xs font-black text-emerald-600 uppercase tracking-[0.2em] flex items-center gap-2">
                    <ArrowRight size={14} /> Acciones Sugeridas
                  </h3>
                  <div className="space-y-3">
                    {result.plan.proximas_acciones.map((item, index) => (
                      <div key={index} className="p-4 rounded-xl bg-white border border-emerald-100 shadow-sm hover:shadow-md transition-all">
                        <div className="text-xs font-bold text-[var(--pv-ink)]">{item.accion}</div>
                        <div className="text-[11px] text-[var(--pv-navy)] opacity-60 mt-1">{item.motivo}</div>
                        {item.clientEmail && (
                          <a 
                            href={`/admin/clientes?search=${encodeURIComponent(item.clientEmail)}`} 
                            className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-600 uppercase mt-3 tracking-widest hover:underline"
                          >
                             Ver Cliente <ArrowRight size={10} />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
             )}
          </div>
        </div>
      )}

      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.4s ease-in-out; }
      `}</style>
    </section>
  );
}
