'use client';

import { useState, useEffect, useRef } from 'react';
import { AppointmentData } from '@/types/booking';
import { STATUS_LABELS, STATUS_COLORS, formatDateShort } from '@/lib/constants';
import { StatCard } from '@/components/admin/StatCard';
import { AppointmentListItem } from '@/components/admin/AppointmentListItem';
import { UrgentSection } from '@/components/admin/UrgentSection';
import { MetricsGrid } from '@/components/admin/MetricsGrid';
import { AdminAiPanel } from '@/components/admin/AdminAiPanel';

const SUMMARY_STATUSES = ['PENDING', 'CONFIRMED', 'CANCELLED'] as const;

const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const TODAY_COLLAPSED = 6;
const WEEK_COLLAPSED = 8;
const UPCOMING_COLLAPSED = 6;
const UPCOMING_PAGE = 12;

const toDateOnly = (value: AppointmentData['date']) => {
  if (typeof value === 'string') {
    return value.split('T')[0];
  }
  return new Date(value).toISOString().split('T')[0];
};

const getAppointmentDateTime = (appointment: AppointmentData) => {
  const dateStr = toDateOnly(appointment.date);
  return new Date(`${dateStr}T${appointment.startTime}:00`);
};

const countStatuses = (list: AppointmentData[]): Record<string, number> & { total: number } => {
  return list.reduce(
    (acc, appt) => {
      acc.total += 1;
      acc[appt.status] = (acc[appt.status] || 0) + 1;
      return acc;
    },
    { total: 0 } as Record<string, number> & { total: number }
  );
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);

export default function AdminDashboardPage() {
  const [todayAppointments, setTodayAppointments] = useState<AppointmentData[]>([]);
  const [weekAppointments, setWeekAppointments] = useState<AppointmentData[]>([]);
  const [recentByDate, setRecentByDate] = useState<AppointmentData[]>([]);
  const [recentByCreated, setRecentByCreated] = useState<AppointmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState<'today' | 'week' | 'upcoming' | null>(null);
  const [upcomingLimit, setUpcomingLimit] = useState(UPCOMING_PAGE);
  const todayRef = useRef<HTMLDivElement>(null);
  const weekRef = useRef<HTMLDivElement>(null);
  const upcomingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const nextWeek = new Date(now.getTime() + SEVEN_DAYS_MS).toISOString().split('T')[0];
      const past30 = new Date(now.getTime() - THIRTY_DAYS_MS).toISOString().split('T')[0];

      const [todayRes, weekRes, byDateRes, byCreatedRes] = await Promise.all([
        fetch(`/api/appointments?date=${today}`),
        fetch(`/api/appointments?from=${today}&to=${nextWeek}`),
        fetch(`/api/appointments?from=${past30}&to=${today}`),
        fetch(`/api/appointments?createdFrom=${past30}&createdTo=${today}`),
      ]);

      const [todayData, weekData, byDateData, byCreatedData] = await Promise.all([
        todayRes.json(),
        weekRes.json(),
        byDateRes.json(),
        byCreatedRes.json(),
      ]);

      setTodayAppointments(Array.isArray(todayData) ? todayData : []);
      setWeekAppointments(Array.isArray(weekData) ? weekData : []);
      setRecentByDate(Array.isArray(byDateData) ? byDateData : []);
      setRecentByCreated(Array.isArray(byCreatedData) ? byCreatedData : []);
    } catch (error) {
      console.error('Error cargando dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      loadDashboard();
    } catch (error) {
      console.error('Error actualizando cita:', error);
    }
  };

  const focusSection = (section: 'today' | 'week' | 'upcoming') => {
    setExpandedSection((prev) => {
      const next = prev === section ? null : section;
      if (next) {
        const targetRef = section === 'today' ? todayRef : section === 'week' ? weekRef : upcomingRef;
        requestAnimationFrame(() => {
          targetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        if (section === 'upcoming') {
          setUpcomingLimit((prevLimit) => Math.max(prevLimit, UPCOMING_PAGE));
        }
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-stone-500 text-sm animate-pulse">Cargando panel de control...</p>
      </div>
    );
  }

  const now = new Date();
  const urgentThreshold = new Date(now.getTime() + TWO_DAYS_MS);
  const leadThreshold = new Date(now.getTime() - SEVEN_DAYS_MS);

  const todayCounts = countStatuses(todayAppointments);
  const weekCounts = countStatuses(weekAppointments);

  const upcomingAppointmentsAll = weekAppointments
    .filter((appt) => appt.status !== 'CANCELLED')
    .filter((appt) => getAppointmentDateTime(appt) >= now)
    .sort((a, b) => getAppointmentDateTime(a).getTime() - getAppointmentDateTime(b).getTime());

  const weekAppointmentsSorted = [...weekAppointments].sort(
    (a, b) => getAppointmentDateTime(a).getTime() - getAppointmentDateTime(b).getTime()
  );

  const todayVisible = expandedSection === 'today'
    ? todayAppointments
    : todayAppointments.slice(0, TODAY_COLLAPSED);
  const weekVisible = expandedSection === 'week'
    ? weekAppointmentsSorted
    : weekAppointmentsSorted.slice(0, WEEK_COLLAPSED);
  const upcomingVisible = upcomingAppointmentsAll.slice(
    0,
    expandedSection === 'upcoming' ? upcomingLimit : UPCOMING_COLLAPSED
  );

  const overdueAppointments = recentByDate
    .filter((appt) => ['PENDING', 'CONFIRMED'].includes(appt.status))
    .filter((appt) => getAppointmentDateTime(appt) < now)
    .sort((a, b) => getAppointmentDateTime(a).getTime() - getAppointmentDateTime(b).getTime());

  const soonAppointments = weekAppointments
    .filter((appt) => ['PENDING', 'CONFIRMED'].includes(appt.status))
    .filter((appt) => {
      const dt = getAppointmentDateTime(appt);
      return dt >= now && dt <= urgentThreshold;
    })
    .sort((a, b) => getAppointmentDateTime(a).getTime() - getAppointmentDateTime(b).getTime());

  const urgentCount = overdueAppointments.length + soonAppointments.length;
  const urgentItems = [
    ...overdueAppointments.map((appointment) => ({ appointment, label: 'Pendiente pasada' })),
    ...soonAppointments.map((appointment) => ({ appointment, label: 'Plazo próximo' })),
  ].slice(0, 10);

  const leadItemsAll = recentByCreated
    .filter((appt) => appt.status === 'PENDING')
    .filter((appt) => new Date(appt.createdAt) >= leadThreshold)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const leadCount = leadItemsAll.length;
  const leadItems = leadItemsAll.slice(0, 8);

  const completedRecent = recentByDate.filter((appt) => appt.status === 'COMPLETED');
  const noShowRecent = recentByDate.filter((appt) => appt.status === 'NO_SHOW');
  const attendedTotal = completedRecent.length + noShowRecent.length;
  const noShowRate = attendedTotal > 0 ? (noShowRecent.length / attendedTotal) * 100 : null;

  const totalCreated = recentByCreated.length;
  const converted = recentByCreated.filter((appt) => ['CONFIRMED', 'COMPLETED'].includes(appt.status)).length;
  const conversionRate = totalCreated > 0 ? (converted / totalCreated) * 100 : null;

  const revenueAppointments = completedRecent.filter((appt) => appt.service?.price != null);
  const revenue = revenueAppointments.reduce((sum, appt) => sum + (appt.service?.price ?? 0), 0);
  const revenueLabel = revenueAppointments.length > 0 ? formatCurrency(revenue) : '—';

  return (
    <div className="max-w-[1600px] mx-auto">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-800">Panel Principal</h1>
          <p className="text-sm text-stone-500 mt-1">Gestión general del despacho y citas</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={loadDashboard} className="btn btn-secondary text-xs flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6"></path><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
            Actualizar
          </button>
          <a href="/admin/calendario" className="btn btn-secondary text-xs">Calendario</a>
          <a href="/admin/configuracion" className="btn btn-primary text-xs">Configuración</a>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Citas de Hoy"
          counts={todayCounts}
          total={todayCounts.total}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-teal-600"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>}
          color="teal"
          onClick={() => focusSection('today')}
          isActive={expandedSection === 'today'}
          statusLabels={STATUS_LABELS}
          statusColors={STATUS_COLORS}
        />
        
        <StatCard
          title="Esta Semana"
          counts={weekCounts}
          total={weekCounts.total}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>}
          color="blue"
          onClick={() => focusSection('week')}
          isActive={expandedSection === 'week'}
          statusLabels={STATUS_LABELS}
          statusColors={STATUS_COLORS}
        />

        <div className="card bg-teal-600 text-white shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm">Resumen de Facturación</h2>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold">{revenueLabel}</div>
            <div className="text-[10px] text-teal-100 mt-1 uppercase tracking-wider">Últimos 30 días · {completedRecent.length} citas</div>
          </div>
          <a href="/admin/clientes" className="mt-4 text-xs font-medium text-teal-100 hover:text-white flex items-center gap-1 transition-colors">
            Gestionar clientes y cobros
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-8">
        <div className="space-y-8">
          {/* Main Content Area */}
          <div ref={todayRef} className="card shadow-sm border-stone-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-stone-800 flex items-center gap-3">
                <span className="w-2 h-8 bg-teal-500 rounded-full"></span>
                Citas de Hoy
                <span className="text-sm font-normal text-stone-400 ml-1">({todayAppointments.length})</span>
              </h2>
              {todayAppointments.length > TODAY_COLLAPSED && (
                <button
                  onClick={() => focusSection('today')}
                  className="text-xs font-semibold text-teal-700 hover:text-teal-800"
                >
                  {expandedSection === 'today' ? 'Ver menos' : 'Expandir todo'}
                </button>
              )}
            </div>

            {todayAppointments.length === 0 ? (
              <div className="py-12 text-center bg-stone-50 rounded-xl border border-dashed border-stone-300">
                <p className="text-stone-400 text-sm italic">No hay citas programadas para hoy</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {todayVisible.map((appt) => (
                  <AppointmentListItem key={appt.id} appt={appt} onUpdateStatus={updateStatus} />
                ))}
              </div>
            )}
          </div>

          <div ref={weekRef} className="card shadow-sm border-stone-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-stone-800 flex items-center gap-3">
                <span className="w-2 h-8 bg-blue-500 rounded-full"></span>
                Próximos 7 días
                <span className="text-sm font-normal text-stone-400 ml-1">({weekAppointmentsSorted.length})</span>
              </h2>
              <button
                onClick={() => focusSection('week')}
                className="text-xs font-semibold text-blue-700 hover:text-blue-800"
              >
                {expandedSection === 'week' ? 'Ver menos' : 'Ver todas'}
              </button>
            </div>

            <div className="space-y-3">
              {weekVisible.map((appt) => (
                <AppointmentListItem key={appt.id} appt={appt} onUpdateStatus={updateStatus} showDate />
              ))}
            </div>
          </div>

          <MetricsGrid
            noShowRate={noShowRate}
            noShowCount={noShowRecent.length}
            attendedTotal={attendedTotal}
            conversionRate={conversionRate}
            convertedCount={converted}
            totalCreated={totalCreated}
            revenueLabel={revenueLabel}
            completedCount={completedRecent.length}
          />
        </div>

        <div className="space-y-8">
          <AdminAiPanel />

          <UrgentSection
            urgentItems={urgentItems}
            urgentCount={urgentCount}
            onUpdateStatus={updateStatus}
          />

          <div className="card shadow-sm border-stone-200">
            <h2 className="font-bold text-sm mb-6 flex items-center gap-3 text-stone-800">
              <span className="w-1.5 h-6 bg-teal-400 rounded-full"></span>
              Nuevas Solicitudes Web
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-teal-100 text-teal-700">{leadCount}</span>
            </h2>

            {leadItems.length === 0 ? (
              <p className="text-sm text-stone-400 py-8 text-center bg-stone-50 rounded-xl">Sin solicitudes nuevas</p>
            ) : (
              <div className="space-y-4">
                {leadItems.map((appt) => {
                  const createdStr = new Date(appt.createdAt).toISOString().split('T')[0];
                  return (
                    <div key={appt.id} className="p-4 rounded-xl border border-stone-200 bg-white hover:shadow-md transition-shadow group">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm font-bold text-stone-800 group-hover:text-teal-700 transition-colors">{appt.clientName}</div>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full border ${STATUS_COLORS[appt.status] || ''}`}>
                          {STATUS_LABELS[appt.status] || appt.status}
                        </span>
                      </div>
                      <div className="text-xs text-stone-600 font-medium mb-1">{appt.service?.name || 'Servicio'}</div>
                      <div className="text-[11px] text-stone-400 flex flex-col gap-0.5">
                        <span>{appt.clientEmail}</span>
                        <span>{appt.clientPhone}</span>
                      </div>
                      <div className="text-[10px] text-stone-400 mt-3 pt-3 border-t border-stone-100 italic">
                        Recibida el {formatDateShort(createdStr)}
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button onClick={() => updateStatus(appt.id, 'CONFIRMED')} className="flex-1 text-[10px] font-bold py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 shadow-sm">Confirmar</button>
                        <button onClick={() => updateStatus(appt.id, 'CANCELLED')} className="flex-1 text-[10px] font-bold py-2 rounded-lg bg-stone-50 text-stone-600 border border-stone-200 hover:bg-stone-100">Descartar</button>
                      </div>
                    </div>
                  );
                })}
                <a href="/admin/calendario" className="block text-center py-2 text-xs font-semibold text-teal-700 hover:underline">Ver todas las solicitudes</a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
