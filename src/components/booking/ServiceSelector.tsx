'use client';

import { useState, useEffect } from 'react';
import { ServiceType } from '@/types/booking';
import { Clock, Euro, CheckCircle2, Globe, Briefcase, Heart, FileText } from 'lucide-react';

interface Props {
  services: ServiceType[];
  selected: string | null;
  onSelect: (id: string) => void;
}

function getMark(name: string): string {
  return name.substring(0, 2).toUpperCase();
}

const CAT_ICONS: Record<string, any> = {
  'Extranjería': Globe,
  'Laboral': Briefcase,
  'Familia': Heart,
  'Otros': FileText,
};

export function ServiceSelector({ services, selected, onSelect }: Props) {
  const getCategoryName = (id: string) => {
    if (id.startsWith('extranjeria')) return 'Extranjería';
    if (id.startsWith('laboral')) return 'Laboral';
    if (id.startsWith('familia')) return 'Familia';
    return 'Otros';
  };

  const groupedServices = services.reduce((acc, service) => {
    const cat = getCategoryName(service.id);
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(service);
    return acc;
  }, {} as Record<string, ServiceType[]>);

  const categoryOrder = ['Extranjería', 'Laboral', 'Familia', 'Otros'].filter(cat => groupedServices[cat] && groupedServices[cat].length > 0);

  // Default to the category of the selected service, or the first available category
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (selected) {
      const srv = services.find(s => s.id === selected);
      if (srv) return getCategoryName(srv.id);
    }
    return categoryOrder[0] || 'Extranjería';
  });

  // Ensure activeTab syncs if selected changes externally
  useEffect(() => {
    if (selected) {
      const srv = services.find(s => s.id === selected);
      if (srv) setActiveTab(getCategoryName(srv.id));
    }
  }, [selected, services]);

  const activeServices = groupedServices[activeTab] || [];

  return (
    <div className="animate-fade-in">
      <h2 className="text-lg sm:text-2xl font-bold font-roman uppercase text-[var(--pv-ink)] mb-1 tracking-tighter">
        Tipo de trámite
      </h2>
      <p className="text-xs sm:text-sm text-[var(--pv-navy)] opacity-60 mb-4 sm:mb-5 leading-relaxed font-medium max-w-3xl">
        Identifica la naturaleza de tu caso. Selecciona el área legal y luego el trámite específico.
      </p>

      {/* Tabs / Pillars */}
      <div className="flex flex-wrap gap-2 sm:gap-4 mb-6 sm:mb-8">
        {categoryOrder.map((cat) => {
          const Icon = CAT_ICONS[cat] || FileText;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveTab(cat)}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] sm:text-xs transition-all duration-300 ${
                activeTab === cat 
                  ? 'bg-[var(--pv-gold)] text-[var(--pv-navy)] shadow-lg shadow-[var(--pv-gold)]/20 border-2 border-[var(--pv-gold)]'
                  : 'bg-white text-[var(--pv-navy)]/70 border-2 border-[var(--pv-navy)]/5 hover:border-[var(--pv-gold)]/30 hover:bg-[var(--pv-marble)] hover:text-[var(--pv-navy)]'
              }`}
            >
              <Icon size={16} className={activeTab === cat ? 'text-[var(--pv-navy)]' : 'text-[var(--pv-gold)]'} />
              {cat}
            </button>
          );
        })}
      </div>

      {/* Services Grid for Active Tab */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-3 animate-fade-in key-change" key={activeTab}>
        {activeServices.map((service) => (
          <button
            key={service.id}
            type="button"
            onClick={() => onSelect(service.id)}
            className={`group text-left p-2.5 sm:p-3 lg:p-4 rounded-2xl border-2 transition-all duration-500 relative overflow-hidden ${
              selected === service.id
                ? 'border-[var(--pv-gold)] bg-[var(--pv-navy)] shadow-2xl md:scale-[1.01]'
                : 'border-[var(--pv-navy)]/10 bg-white hover:border-[var(--pv-gold)]/50 hover:shadow-lg'
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
                  selected === service.id ? 'bg-[var(--pv-gold)] text-[var(--pv-navy)] scale-110' : 'bg-[var(--pv-marble)] text-[var(--pv-gold)]'
                }`}
              >
                {getMark(service.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className={`font-roman font-bold text-sm sm:text-base leading-tight uppercase tracking-tight transition-colors pr-7 ${
                    selected === service.id ? 'text-white' : 'text-[var(--pv-ink)]'
                  }`}
                >
                  {service.name}
                </div>
                {service.description && (
                  <div className={`hidden sm:block text-[10px] mt-1.5 font-medium leading-relaxed line-clamp-2 transition-colors ${selected === service.id ? 'text-white opacity-80' : 'text-[var(--pv-navy)] opacity-60'}`}>
                    {service.description}
                  </div>
                )}
                <div className={`hidden sm:flex flex-wrap items-center gap-3 mt-3 pt-3 border-t transition-colors ${selected === service.id ? 'border-white/10' : 'border-[var(--pv-marble)]'}`}>
                  <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase transition-colors ${selected === service.id ? 'text-white opacity-60' : 'text-[var(--pv-navy)] opacity-40'}`}>
                    <Clock size={12} className={selected === service.id ? 'text-[var(--pv-gold)]' : 'text-[var(--pv-navy)]/40'} />
                    {service.durationMin} min
                  </div>
                  {service.price && (
                    <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase sm:ml-auto transition-colors ${selected === service.id ? 'text-white opacity-60' : 'text-[var(--pv-navy)] opacity-40'}`}>
                      <Euro size={12} className={selected === service.id ? 'text-[var(--pv-gold)]' : 'text-[var(--pv-navy)]/40'} />
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
