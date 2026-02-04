'use client';

import { ServiceType } from '@/types/booking';

interface Props {
  services: ServiceType[];
  selected: string | null;
  onSelect: (id: string) => void;
}

const SERVICE_ICONS: Record<string, string> = {
  Arraigo: '🏠',
  NIE: '📋',
  Renovacion: '🔄',
  Nacionalidad: '🇪🇸',
  Reagrupacion: '👨‍👩‍👧‍👦',
  Asilo: '🛡️',
  Consulta: '💬',
};

function getIcon(name: string): string {
  for (const [key, icon] of Object.entries(SERVICE_ICONS)) {
    if (name.includes(key)) return icon;
  }
  return '📌';
}

export function ServiceSelector({ services, selected, onSelect }: Props) {
  return (
    <div>
      <h2 className="text-sm sm:text-base font-semibold mb-0.5">Seleccione el servicio</h2>
      <p className="text-[11px] sm:text-xs text-stone-500 mb-2 sm:mb-3">Elija el tipo de tramite que necesita</p>
      <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
        {services.map((service) => (
          <button
            key={service.id}
            type="button"
            onClick={() => onSelect(service.id)}
            className={`service-card text-left p-2 sm:p-3 rounded-lg border-2 transition-all ${
              selected === service.id
                ? 'border-teal-500 bg-teal-50 shadow-sm'
                : 'border-stone-200 bg-white hover:border-teal-300 hover:shadow-sm'
            }`}
          >
            <div className="flex items-start gap-2">
              <span className="text-base sm:text-lg leading-none">{getIcon(service.name)}</span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-xs sm:text-sm leading-tight">{service.name}</div>
                {service.description && (
                  <div className="text-[10px] sm:text-[11px] text-stone-500 mt-0.5 line-clamp-1">{service.description}</div>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] sm:text-[11px] text-stone-400">{service.durationMin} min</span>
                  {service.price && (
                    <span className="text-[10px] sm:text-[11px] font-medium text-teal-700">{service.price} €</span>
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
