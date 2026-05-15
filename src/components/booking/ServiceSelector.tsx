'use client';

import { ServiceType } from '@/types/booking';

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
    <div>
      <h2 className="font-legal text-lg text-[var(--pv-navy)] mb-0.5">Seleccione el servicio</h2>
      <p className="text-xs text-[var(--pv-muted)] mb-3">Elija el tipo de tramite que necesita</p>
      <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
        {services.map((service) => (
          <button
            key={service.id}
            type="button"
            onClick={() => onSelect(service.id)}
            className={`service-card text-left p-2 sm:p-3 rounded-md border transition-all ${
              selected === service.id
                ? 'border-[var(--pv-gold)] bg-[#fff8e8] shadow-sm'
                : 'border-[var(--pv-line)] bg-[#fffdf5]/80 hover:border-[var(--pv-gold)] hover:shadow-sm'
            }`}
          >
            <div className="flex items-start gap-2">
              <span className="pv-seal w-8 h-8 rounded-full flex items-center justify-center font-legal text-[10px] font-bold shrink-0">
                {getMark(service.name)}
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-xs sm:text-sm leading-tight text-[var(--pv-navy)]">{service.name}</div>
                {service.description && (
                  <div className="text-[10px] sm:text-[11px] text-[var(--pv-muted)] mt-0.5 line-clamp-1">{service.description}</div>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] sm:text-[11px] text-[var(--pv-muted)]">{service.durationMin} min</span>
                  {service.price && (
                    <span className="text-[10px] sm:text-[11px] font-semibold text-[var(--pv-navy)]">{service.price} EUR</span>
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
