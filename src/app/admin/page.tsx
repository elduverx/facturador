'use client';

import {
  Calendar,
  ChevronRight,
  FileText,
  FolderKanban,
  Settings,
  Sparkles,
  Users,
} from 'lucide-react';
import Link from 'next/link';

const primaryActions = [
  {
    href: '/admin/calendario',
    label: 'Revisar agenda',
    description: 'Ver citas del día, confirmar asistencia y actualizar estados.',
    icon: Calendar,
  },
  {
    href: '/admin/clientes',
    label: 'Gestionar clientes',
    description: 'Buscar una cuenta, publicar notificaciones y revisar documentos.',
    icon: Users,
  },
  {
    href: '/admin/expedientes',
    label: 'Actualizar expedientes',
    description: 'Registrar avances, pagos del caso, vencimientos y próximos pasos.',
    icon: FolderKanban,
  },
];

const secondaryActions = [
  { href: '/admin/ai', label: 'IA asistente', icon: Sparkles },
  { href: '/admin/blog', label: 'Blog', icon: FileText },
  { href: '/admin/configuracion', label: 'Ajustes', icon: Settings },
];

const checks = [
  'Publica en el perfil del cliente solo las notas que deba ver en Mi Portal.',
  'Marca pagos y citas después de cada cambio para que el portal quede actualizado.',
  'Usa expedientes para el estado del caso; usa clientes para mensajes, documentos e historial.',
];

export default function AdminDashboard() {
  return (
    <div className="space-y-5 lg:space-y-6 animate-fade-in">
      <section className="neo-card !p-5 lg:!p-6 border-l-4 border-l-[var(--pv-gold)] bg-white">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.25em] text-[var(--pv-gold)]">Panel de trabajo</p>
            <h1 className="font-roman text-2xl font-bold uppercase tracking-tight text-[var(--pv-ink)] lg:text-3xl">
              Qué necesitas revisar ahora
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[var(--pv-navy)]/65">
              El admin está organizado para tres tareas: agenda, clientes y expedientes. Desde ahí se actualiza lo que el cliente ve en Mi Portal.
            </p>
          </div>
          <Link href="/admin/calendario" className="btn-roman w-full !py-3 !text-xs !uppercase !tracking-widest lg:w-auto">
            Abrir agenda
            <ChevronRight size={16} />
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {primaryActions.map((item) => (
          <Link key={item.href} href={item.href} className="neo-card !p-5 group block bg-white hover:bg-white">
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--pv-gold)]/10 text-[var(--pv-gold)]">
              <item.icon size={22} />
            </div>
            <h2 className="font-roman text-lg font-bold uppercase tracking-tight text-[var(--pv-ink)]">{item.label}</h2>
            <p className="mt-2 min-h-[48px] text-sm leading-relaxed text-[var(--pv-navy)]/60">{item.description}</p>
            <div className="mt-5 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-[var(--pv-gold)]">
              Entrar <ChevronRight size={14} />
            </div>
          </Link>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_360px]">
        <div className="neo-card !p-5 bg-white">
          <h2 className="font-roman text-lg font-bold uppercase tracking-tight text-[var(--pv-ink)]">Cómo mantener el portal claro</h2>
          <div className="mt-4 space-y-3">
            {checks.map((check, index) => (
              <div key={check} className="flex gap-3 rounded-2xl bg-[var(--pv-marble)] p-4">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white font-roman text-xs font-black text-[var(--pv-gold)]">
                  {index + 1}
                </div>
                <p className="text-sm leading-relaxed text-[var(--pv-navy)]/70">{check}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="neo-card !p-5 bg-white">
          <h2 className="font-roman text-sm font-bold uppercase tracking-widest text-[var(--pv-ink)]">Otras áreas</h2>
          <div className="mt-4 space-y-2">
            {secondaryActions.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between rounded-xl bg-[var(--pv-marble)] px-4 py-3 text-sm font-bold text-[var(--pv-navy)] transition hover:bg-white hover:text-[var(--pv-gold)]"
              >
                <span className="flex items-center gap-3">
                  <item.icon size={17} className="text-[var(--pv-gold)]" />
                  {item.label}
                </span>
                <ChevronRight size={15} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.45s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
