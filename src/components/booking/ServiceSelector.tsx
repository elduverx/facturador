'use client';

import { ServiceType } from '@/types/booking';
import { Clock, Euro, CheckCircle2 } from 'lucide-react';

interface Props {
  services: ServiceType[];
  selected: string | null;
  onSelect: (id: string) => void;
}

const SERVICE_MARKS: Record<string, string> = {
  Arraigo: 'AR',
  NIE: 'NI',
  Renovacion: 'RE',
  Nacionalidad: 'NA',
  Reagrupacion: 'RF',
  Asilo: 'AS',
  Consulta: 'CO',
};

function getMark(name: string): string {
  for (const [key, mark] of Object.entries(SERVICE_MARKS)) {
    if (name.includes(key)) return mark;
  }
  return 'PV';
}

export function ServiceSelector({ services, selected, onSelect }: Props) {
  return (
    <div className="animate-fade-in">
      <h2 className="text-xl sm:text-3xl font-bold font-roman uppercase text-[var(--pv-ink)] mb-2 sm:mb-3 tracking-tighter">
        Tipo de tramite
      </h2>
      <p className="text-xs sm:text-sm text-[var(--pv-navy)] opacity-60 mb-4 sm:mb-8 lg:mb-10 leading-relaxed font-medium max-w-3xl">
        Identifica la naturaleza de tu caso. Aplicaremos la estrategia adecuada para avanzar con orden y claridad.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {services.map((service) => (
          <button
            key={service.id}
            type="button"
            onClick={() => onSelect(service.id)}
            className={`group text-left p-2.5 sm:p-5 lg:p-6 rounded-2xl border-2 transition-all duration-500 relative overflow-hidden ${
              selected === service.id
                ? 'border-[var(--pv-gold)] bg-white shadow-2xl md:scale-[1.01]'
                : 'border-white/50 bg-[var(--pv-marble)]/50 hover:bg-white hover:border-[var(--pv-gold)]/30'
            }`}
          >
            {selected === service.id && (
              <div className="absolute top-0 right-0 p-4">
                <CheckCircle2 className="text-[var(--pv-gold)]" size={20} />
              </div>
            )}

            <div className="flex items-start gap-3 sm:gap-4 relative z-10">
              <div
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-roman font-black text-xs shadow-lg transition-all duration-500 shrink-0 ${
                  selected === service.id ? 'bg-[var(--pv-gold)] text-white scale-110' : 'bg-white text-[var(--pv-gold)]'
                }`}
              >
                {getMark(service.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className={`font-roman font-bold text-sm sm:text-base leading-tight uppercase tracking-tight transition-colors pr-7 ${
                    selected === service.id ? 'text-[var(--pv-gold)]' : 'text-[var(--pv-ink)]'
                  }`}
                >
                  {service.name}
                </div>
                {service.description && (
                  <div className="hidden sm:block text-[11px] text-[var(--pv-navy)] opacity-50 mt-2 font-medium leading-relaxed line-clamp-3 italic">
                    "{service.description}"
                  </div>
                )}
                <div className="hidden sm:flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-[var(--pv-marble)]">
                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-[var(--pv-navy)] opacity-40">
                    <Clock size={12} className="text-[var(--pv-gold)]" />
                    {service.durationMin} min
                  </div>
                  {service.price && (
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-[var(--pv-navy)] opacity-40 sm:ml-auto">
                      <Euro size={12} className="text-[var(--pv-gold)]" />
                      {service.price} EUR
                    </div>
                  )}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
