'use client';

import { ExternalLink, Globe, Sparkles } from 'lucide-react';

interface TipsonBadgeProps {
  variant?: 'navbar' | 'hero';
}

export function TipsonBadge({ variant = 'hero' }: TipsonBadgeProps) {
  if (variant === 'navbar') {
    return (
      <a
        href="https://tipson.es"
        target="_blank"
        rel="noopener noreferrer"
        title="Tipson.es — Nuestro partner tecnológico: webs, gestoría y creación de SL"
        className="group hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-purple-400/30 bg-gradient-to-r from-purple-600/10 to-blue-500/10 hover:from-purple-600/20 hover:to-blue-500/20 transition-all duration-300 hover:border-purple-400/60 hover:shadow-lg hover:shadow-purple-500/20 hover:-translate-y-0.5"
      >
        {/* Tipson "T" logo icon */}
        <div className="w-5 h-5 rounded-md flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-500 shadow-sm group-hover:shadow-purple-500/40 transition-all shrink-0">
          <span className="text-white font-black text-[11px] leading-none">T</span>
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-[8px] uppercase tracking-[0.15em] font-bold text-purple-400/80 group-hover:text-purple-300 transition-colors">Partner</span>
          <span className="text-[10px] font-black tracking-tight bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Tipson</span>
        </div>
        <ExternalLink size={8} className="text-purple-400/60 group-hover:text-purple-300 transition-colors" />
      </a>
    );
  }

  // Hero variant — banner completo
  return (
    <a
      href="https://tipson.es"
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full max-w-2xl mx-auto p-5 sm:p-6 rounded-2xl border border-purple-400/20 overflow-hidden transition-all duration-500 hover:border-purple-400/50 hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-500/20"
      style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(59,130,246,0.12) 100%)' }}
    >
      {/* Glow de fondo */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.15) 0%, transparent 70%)' }} />
      
      {/* Etiqueta "Partner Tecnológico" */}
      <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-blue-500 shadow-lg">
        <Sparkles size={8} className="text-white" />
        <span className="text-[8px] uppercase tracking-widest font-bold text-white">Partner Tecnológico</span>
      </div>

      {/* Logo Tipson */}
      <div className="relative shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-500"
        style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #3B82F6 100%)' }}>
        <span className="text-white font-black text-3xl sm:text-4xl leading-none">T</span>
        {/* Brillo interior */}
        <div className="absolute inset-0 rounded-2xl"
          style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 60%)' }} />
      </div>

      {/* Texto */}
      <div className="flex flex-col gap-1 text-center sm:text-left relative z-10">
        <div className="flex items-center justify-center sm:justify-start gap-2">
          <span className="text-xl sm:text-2xl font-black tracking-tight"
            style={{ background: 'linear-gradient(90deg, #a78bfa, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            tipson.es
          </span>
          <ExternalLink size={14} className="text-purple-400 group-hover:text-purple-300 transition-colors mt-0.5" />
        </div>
        <p className="text-white/70 text-[11px] sm:text-xs leading-relaxed max-w-sm group-hover:text-white/90 transition-colors">
          Webs profesionales · Gestoría online · Autónomos y creación de SL.<br className="hidden sm:block" />
          La tecnología detrás de tu negocio.
        </p>
      </div>

      {/* CTA pill */}
      <div className="shrink-0 mt-2 sm:mt-0 sm:ml-auto">
        <div className="flex items-center gap-1.5 px-4 py-2 rounded-full text-white text-[10px] sm:text-xs font-bold uppercase tracking-widest shadow-lg transition-all duration-300 group-hover:shadow-purple-500/40"
          style={{ background: 'linear-gradient(135deg, #7C3AED, #3B82F6)' }}>
          <Globe size={12} />
          Visitar
        </div>
      </div>
    </a>
  );
}
