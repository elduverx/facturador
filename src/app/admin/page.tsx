'use client';

import { useEffect, useState } from 'react';
import {
  Calendar,
  ChevronRight,
  FileText,
  FolderKanban,
  Settings,
  Sparkles,
  Users,
  Clock,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { formatDateShort } from '@/lib/constants';

const secondaryActions = [
  { href: '/admin/ai', label: 'IA asistente', icon: Sparkles },
  { href: '/admin/blog', label: 'Blog', icon: FileText },
  { href: '/admin/configuracion', label: 'Ajustes', icon: Settings },
];

export default function AdminDashboard() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [matters, setMatters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [apptsRes, mattersRes] = await Promise.all([
          fetch('/api/appointments'),
          fetch('/api/admin/matters')
        ]);
        
        const apptsData = await apptsRes.json();
        const mattersData = await mattersRes.json();

        if (Array.isArray(apptsData)) {
          // Filter for upcoming or today
          const today = new Date().toISOString().split('T')[0];
          const upcoming = apptsData
            .filter(a => {
               const aDate = a.date.split('T')[0];
               return aDate >= today && a.status !== 'CANCELLED';
            })
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(0, 5); // Take next 5
          setAppointments(upcoming);
        }

        if (Array.isArray(mattersData)) {
          const active = mattersData
            .filter(m => m.status !== 'RESOLVED' && m.status !== 'ARCHIVED')
            .slice(0, 5); // Take top 5 active
          setMatters(active);
        }

      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  return (
    <div className="space-y-5 lg:space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Hero Section */}
      <section className="neo-card !p-5 lg:!p-6 border-l-4 border-l-[var(--pv-gold)] bg-white shadow-md">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.25em] text-[var(--pv-gold)]">Panel de control</p>
            <h1 className="font-roman text-2xl font-bold uppercase tracking-tight text-[var(--pv-ink)] lg:text-3xl">
              Resumen del despacho
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[var(--pv-navy)]/65">
              Desde aquí tienes una vista de pájaro de las próximas citas, los expedientes activos y accesos rápidos. Recuerda que al actualizar expedientes y clientes, sus Portales se actualizan en tiempo real.
            </p>
          </div>
          <div className="flex gap-3 flex-col sm:flex-row w-full lg:w-auto">
             <Link href="/admin/clientes" className="btn-roman !bg-white !text-[var(--pv-ink)] !border-[var(--pv-marble)] hover:!border-[var(--pv-gold)] w-full !py-3 !text-xs !uppercase !tracking-widest lg:w-auto shadow-sm">
               Directorio de Clientes
             </Link>
             <Link href="/admin/calendario" className="btn-roman w-full !py-3 !text-xs !uppercase !tracking-widest lg:w-auto shadow-sm">
               Agenda Completa
               <ChevronRight size={16} />
             </Link>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6">
        
        {/* Próximas Citas */}
        <section className="neo-card !p-0 bg-white overflow-hidden shadow-sm flex flex-col h-full">
          <div className="p-5 border-b border-[var(--pv-marble)] bg-[var(--pv-marble)]/30 flex items-center justify-between">
            <div>
               <h2 className="font-roman text-base font-bold uppercase tracking-tight text-[var(--pv-ink)] flex items-center gap-2">
                 <Calendar size={18} className="text-[var(--pv-gold)]" />
                 Próximas Citas
               </h2>
               <p className="text-xs text-[var(--pv-navy)]/60 mt-1">Citas agendadas para hoy o los próximos días.</p>
            </div>
            <Link href="/admin/calendario" className="text-[10px] font-bold text-[var(--pv-gold)] uppercase tracking-widest hover:underline">
               Ver todas
            </Link>
          </div>
          
          <div className="p-5 flex-1">
            {loading ? (
               <div className="h-full flex items-center justify-center text-xs text-[var(--pv-navy)]/40 font-bold uppercase tracking-widest animate-pulse py-10">
                 Cargando agenda...
               </div>
            ) : appointments.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-center py-10">
                 <Calendar size={32} className="text-[var(--pv-navy)]/20 mb-3" />
                 <p className="text-xs font-bold text-[var(--pv-ink)] uppercase tracking-widest">No hay citas próximas</p>
               </div>
            ) : (
               <div className="space-y-3">
                 {appointments.map((appt, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 rounded-xl border border-[var(--pv-marble)] hover:border-[var(--pv-gold)]/30 transition-colors">
                       <div className="shrink-0 flex flex-col items-center justify-center w-12 h-12 bg-[var(--pv-marble)]/50 rounded-lg text-[var(--pv-navy)]">
                         <span className="text-xs font-bold uppercase">{new Date(appt.date).toLocaleDateString('es-ES', { month: 'short' })}</span>
                         <span className="text-lg font-black font-roman leading-none">{new Date(appt.date).getDate()}</span>
                       </div>
                       <div className="min-w-0 flex-1">
                         <h3 className="font-bold text-[var(--pv-ink)] text-sm truncate">{appt.clientName}</h3>
                         <div className="flex items-center gap-2 mt-1 text-[10px] font-bold text-[var(--pv-navy)]/60 uppercase tracking-widest">
                            <span className="flex items-center gap-1"><Clock size={10}/> {appt.time}</span>
                            <span>&bull;</span>
                            <span>{appt.modality === 'VIDEO_CALL' ? 'Videollamada' : 'Presencial'}</span>
                         </div>
                       </div>
                       <Link href="/admin/clientes" className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-[var(--pv-marble)] text-[var(--pv-gold)] hover:bg-[var(--pv-gold)] hover:text-white transition-colors">
                         <ArrowRight size={14} />
                       </Link>
                    </div>
                 ))}
               </div>
            )}
          </div>
        </section>

        {/* Expedientes Activos */}
        <section className="neo-card !p-0 bg-white overflow-hidden shadow-sm flex flex-col h-full">
          <div className="p-5 border-b border-[var(--pv-marble)] bg-[var(--pv-marble)]/30 flex items-center justify-between">
            <div>
               <h2 className="font-roman text-base font-bold uppercase tracking-tight text-[var(--pv-ink)] flex items-center gap-2">
                 <FolderKanban size={18} className="text-[var(--pv-gold)]" />
                 Expedientes Recientes
               </h2>
               <p className="text-xs text-[var(--pv-navy)]/60 mt-1">Trámites legales que requieren atención.</p>
            </div>
            <Link href="/admin/clientes" className="text-[10px] font-bold text-[var(--pv-gold)] uppercase tracking-widest hover:underline">
               Ver en clientes
            </Link>
          </div>
          
          <div className="p-5 flex-1">
            {loading ? (
               <div className="h-full flex items-center justify-center text-xs text-[var(--pv-navy)]/40 font-bold uppercase tracking-widest animate-pulse py-10">
                 Cargando expedientes...
               </div>
            ) : matters.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-center py-10">
                 <FolderKanban size={32} className="text-[var(--pv-navy)]/20 mb-3" />
                 <p className="text-xs font-bold text-[var(--pv-ink)] uppercase tracking-widest">No hay expedientes activos</p>
               </div>
            ) : (
               <div className="space-y-3">
                 {matters.map((matter, i) => (
                    <Link href={`/admin/clientes?email=${encodeURIComponent(matter.clientEmail)}`} key={i} className="block p-4 rounded-xl border border-[var(--pv-marble)] hover:border-[var(--pv-gold)]/30 transition-all bg-white group hover:shadow-md cursor-pointer">
                       <div className="flex justify-between items-start gap-4 mb-2">
                         <div className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--pv-gold)]">
                           {matter.reference}
                         </div>
                         <span className="px-2 py-0.5 bg-[var(--pv-marble)] rounded text-[9px] font-bold text-[var(--pv-navy)] uppercase tracking-widest group-hover:bg-[var(--pv-gold)]/10 transition-colors">
                           {matter.status}
                         </span>
                       </div>
                       <h3 className="font-bold text-[var(--pv-ink)] text-sm mb-1 group-hover:text-[var(--pv-gold)] transition-colors">{matter.title}</h3>
                       <div className="text-[10px] font-medium text-[var(--pv-navy)]/70 flex justify-between items-center">
                         <span>Cliente: <span className="font-bold">{matter.clientName}</span></span>
                         <span className="text-[8px] font-black uppercase tracking-widest text-[var(--pv-gold)] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                           <FolderKanban size={10} /> Abrir Ficha
                         </span>
                       </div>
                    </Link>
                 ))}
               </div>
            )}
          </div>
        </section>
      </div>

      {/* Footer Acciones */}
      <section className="neo-card !p-5 bg-white shadow-sm">
        <h2 className="font-roman text-sm font-bold uppercase tracking-widest text-[var(--pv-ink)] mb-4">Otras áreas del sistema</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {secondaryActions.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center justify-between rounded-xl bg-[var(--pv-marble)] px-4 py-3 text-sm font-bold text-[var(--pv-navy)] transition hover:bg-white hover:text-[var(--pv-gold)] border border-transparent hover:border-[var(--pv-gold)]/30 shadow-sm"
            >
              <span className="flex items-center gap-3">
                <item.icon size={17} className="text-[var(--pv-gold)]" />
                {item.label}
              </span>
              <ChevronRight size={15} className="opacity-50" />
            </Link>
          ))}
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
