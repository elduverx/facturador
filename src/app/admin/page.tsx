'use client';

import { useState, useEffect, useRef } from 'react';
import { AppointmentData } from '@/types/booking';
import { STATUS_LABELS, STATUS_COLORS, formatDateShort } from '@/lib/constants';

const SUMMARY_STATUSES = ['PENDING', 'CONFIRMED', 'CANCELLED'] as const;

type StatusCounts = Record<string, number> & { total: number };

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

const countStatuses = (list: AppointmentData[]): StatusCounts => {
  return list.reduce(
    (acc, appt) => {
      acc.total += 1;
      acc[appt.status] = (acc[appt.status] || 0) + 1;
      return acc;
    },
    { total: 0 } as StatusCounts
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
      setTodayAppointments([]);
      setWeekAppointments([]);
      setRecentByDate([]);
      setRecentByCreated([]);
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
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
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
    ...overdueAppointments.map((appointment) => ({ appointment, label: 'Sin cerrar' })),
    ...soonAppointments.map((appointment) => ({ appointment, label: 'Plazo cercano' })),
  ].slice(0, 6);

  const leadItemsAll = recentByCreated
    .filter((appt) => appt.status === 'PENDING')
    .filter((appt) => new Date(appt.createdAt) >= leadThreshold)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const leadCount = leadItemsAll.length;
  const leadItems = leadItemsAll.slice(0, 6);

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
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-stone-500">Resumen del consultorio</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href="/admin/calendario" className="btn btn-secondary text-xs">Ver calendario</a>
          <a href="/admin/configuracion" className="btn btn-secondary text-xs">Ajustes</a>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <button
          type="button"
          onClick={() => focusSection('today')}
          className={`card text-left w-full transition-all ${expandedSection === 'today' ? 'ring-2 ring-teal-200' : 'hover:border-teal-200'}`}
          aria-pressed={expandedSection === 'today'}
        >
          <h2 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-teal-600">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            Citas de hoy
          </h2>
          <div className="flex flex-wrap gap-2">
            {SUMMARY_STATUSES.map((status) => (
              <span key={status} className={`text-xs px-2 py-1 rounded-full border ${STATUS_COLORS[status] || ''}`}>
                {STATUS_LABELS[status] || status}: <span className="font-semibold">{todayCounts[status] || 0}</span>
              </span>
            ))}
          </div>
          <div className="text-xs text-stone-400 mt-3">Total: {todayCounts.total}</div>
          <div className="text-xs text-teal-700 mt-3">Ver detalle</div>
        </button>

        <button
          type="button"
          onClick={() => focusSection('week')}
          className={`card text-left w-full transition-all ${expandedSection === 'week' ? 'ring-2 ring-blue-200' : 'hover:border-blue-200'}`}
          aria-pressed={expandedSection === 'week'}
        >
          <h2 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            Citas de la semana
          </h2>
          <div className="flex flex-wrap gap-2">
            {SUMMARY_STATUSES.map((status) => (
              <span key={status} className={`text-xs px-2 py-1 rounded-full border ${STATUS_COLORS[status] || ''}`}>
                {STATUS_LABELS[status] || status}: <span className="font-semibold">{weekCounts[status] || 0}</span>
              </span>
            ))}
          </div>
          <div className="text-xs text-stone-400 mt-3">Total: {weekCounts.total}</div>
          <div className="text-xs text-blue-700 mt-3">Ver detalle</div>
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-6">
          {/* Today's appointments */}
          <div ref={todayRef} className="card">
            <div className="flex items-start justify-between gap-3 mb-4">
              <h2 className="font-semibold text-sm flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-teal-600">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                Citas de hoy
                <span className="text-xs text-stone-400 ml-1">({todayAppointments.length})</span>
              </h2>
              {todayAppointments.length > TODAY_COLLAPSED && (
                <button
                  onClick={() => focusSection('today')}
                  className="text-xs text-teal-700 hover:text-teal-800"
                >
                  {expandedSection === 'today' ? 'Mostrar menos' : `Ver todas (${todayAppointments.length})`}
                </button>
              )}
            </div>

            {todayAppointments.length === 0 ? (
              <p className="text-sm text-stone-400 py-4 text-center">No hay citas para hoy</p>
            ) : (
              <div className={`space-y-2 ${expandedSection === 'today' && todayAppointments.length > TODAY_COLLAPSED ? 'max-h-[60vh] overflow-y-auto pr-1' : ''}`}>
                {todayVisible.map((appt) => (
                  <div key={appt.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border border-stone-200 hover:border-stone-300 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="text-center bg-stone-100 rounded-lg px-3 py-1 min-w-[60px]">
                        <div className="text-sm font-bold">{appt.startTime}</div>
                        <div className="text-[10px] text-stone-400">{appt.endTime}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">{appt.clientName}</div>
                        <div className="text-xs text-stone-500">{appt.service?.name || 'Servicio'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full border ${STATUS_COLORS[appt.status] || ''}`}>
                        {STATUS_LABELS[appt.status] || appt.status}
                      </span>
                      {appt.status === 'PENDING' && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => updateStatus(appt.id, 'CONFIRMED')}
                            className="text-xs px-2 py-1 rounded bg-teal-600 text-white hover:bg-teal-700"
                            title="Confirmar"
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={() => updateStatus(appt.id, 'CANCELLED')}
                            className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
                            title="Cancelar"
                          >
                            Cancelar
                          </button>
                        </div>
                      )}
                      {appt.status === 'CONFIRMED' && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => updateStatus(appt.id, 'COMPLETED')}
                            className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200"
                          >
                            Completar
                          </button>
                          <button
                            onClick={() => updateStatus(appt.id, 'NO_SHOW')}
                            className="text-xs px-2 py-1 rounded bg-stone-100 text-stone-600 hover:bg-stone-200"
                          >
                            No presentado
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Week appointments */}
          <div ref={weekRef} className="card">
            <div className="flex items-start justify-between gap-3 mb-4">
              <h2 className="font-semibold text-sm flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                Citas de la semana
                <span className="text-xs text-stone-400 ml-1">({weekAppointmentsSorted.length})</span>
              </h2>
              {weekAppointmentsSorted.length > WEEK_COLLAPSED && (
                <button
                  onClick={() => focusSection('week')}
                  className="text-xs text-blue-700 hover:text-blue-800"
                >
                  {expandedSection === 'week' ? 'Mostrar menos' : `Ver todas (${weekAppointmentsSorted.length})`}
                </button>
              )}
            </div>

            {weekAppointmentsSorted.length === 0 ? (
              <p className="text-sm text-stone-400 py-4 text-center">No hay citas esta semana</p>
            ) : (
              <div className={`space-y-2 ${expandedSection === 'week' && weekAppointmentsSorted.length > WEEK_COLLAPSED ? 'max-h-[60vh] overflow-y-auto pr-1' : ''}`}>
                {weekVisible.map((appt) => {
                  const dateStr = toDateOnly(appt.date);
                  return (
                    <div key={appt.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border border-stone-100 hover:border-stone-200 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="text-center bg-stone-50 rounded-lg px-2 py-1 min-w-[70px]">
                          <div className="text-xs text-stone-400">{formatDateShort(dateStr)}</div>
                          <div className="text-sm font-bold">{appt.startTime}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium">{appt.clientName}</div>
                          <div className="text-xs text-stone-500">{appt.service?.name || 'Servicio'} - {appt.clientPhone}</div>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full border self-start sm:self-center ${STATUS_COLORS[appt.status] || ''}`}>
                        {STATUS_LABELS[appt.status] || appt.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Upcoming */}
          <div ref={upcomingRef} className="card">
            <div className="flex items-start justify-between gap-3 mb-4">
              <h2 className="font-semibold text-sm flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                Proximas citas (7 dias)
                <span className="text-xs text-stone-400 ml-1">({upcomingAppointmentsAll.length})</span>
              </h2>
              {upcomingAppointmentsAll.length > UPCOMING_COLLAPSED && (
                <button
                  onClick={() => focusSection('upcoming')}
                  className="text-xs text-blue-700 hover:text-blue-800"
                >
                  {expandedSection === 'upcoming' ? 'Mostrar menos' : `Ver todas (${upcomingAppointmentsAll.length})`}
                </button>
              )}
            </div>

            {upcomingAppointmentsAll.length === 0 ? (
              <p className="text-sm text-stone-400 py-4 text-center">No hay citas programadas</p>
            ) : (
              <>
                <div className={`space-y-2 ${expandedSection === 'upcoming' && upcomingAppointmentsAll.length > UPCOMING_COLLAPSED ? 'max-h-[60vh] overflow-y-auto pr-1' : ''}`}>
                  {upcomingVisible.map((appt) => {
                    const dateStr = toDateOnly(appt.date);
                    return (
                      <div key={appt.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border border-stone-100 hover:border-stone-200 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="text-center bg-stone-50 rounded-lg px-2 py-1 min-w-[70px]">
                            <div className="text-xs text-stone-400">{formatDateShort(dateStr)}</div>
                            <div className="text-sm font-bold">{appt.startTime}</div>
                          </div>
                          <div>
                            <div className="text-sm font-medium">{appt.clientName}</div>
                            <div className="text-xs text-stone-500">{appt.service?.name || 'Servicio'} - {appt.clientPhone}</div>
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full border self-start sm:self-center ${STATUS_COLORS[appt.status] || ''}`}>
                          {STATUS_LABELS[appt.status] || appt.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {expandedSection === 'upcoming' && upcomingVisible.length < upcomingAppointmentsAll.length && (
                  <div className="mt-3 flex justify-center">
                    <button
                      onClick={() => setUpcomingLimit((prev) => prev + UPCOMING_PAGE)}
                      className="btn btn-secondary text-xs"
                    >
                      Mostrar {UPCOMING_PAGE} mas
                    </button>
                  </div>
                )}
                {expandedSection === 'upcoming' && (
                  <div className="text-[10px] text-stone-400 mt-3 text-center">
                    Mostrando {upcomingVisible.length} de {upcomingAppointmentsAll.length}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Urgents */}
          <div className="card">
            <h2 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-600">
                <path d="M12 9v4"></path>
                <path d="M12 17h.01"></path>
                <path d="M10.29 3.86l-8.13 14a2 2 0 0 0 1.71 3h16.26a2 2 0 0 0 1.71-3l-8.13-14a2 2 0 0 0-3.42 0z"></path>
              </svg>
              Urgentes
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">{urgentCount}</span>
            </h2>

            {urgentItems.length === 0 ? (
              <p className="text-sm text-stone-400 py-4 text-center">No hay pendientes urgentes</p>
            ) : (
              <div className="space-y-2">
                {urgentItems.map(({ appointment, label }) => {
                  const dateStr = toDateOnly(appointment.date);
                  return (
                    <div key={appointment.id} className="p-3 rounded-lg border border-stone-200">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] uppercase tracking-wide text-red-600 font-semibold">{label}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${STATUS_COLORS[appointment.status] || ''}`}>
                          {STATUS_LABELS[appointment.status] || appointment.status}
                        </span>
                      </div>
                      <div className="text-sm font-medium mt-1">{appointment.clientName}</div>
                      <div className="text-xs text-stone-500">{formatDateShort(dateStr)} · {appointment.startTime} · {appointment.service?.name || 'Servicio'}</div>
                      <div className="text-xs text-stone-400">{appointment.clientPhone}</div>
                      {appointment.status === 'PENDING' && (
                        <div className="flex gap-1 mt-2">
                          <button onClick={() => updateStatus(appointment.id, 'CONFIRMED')} className="text-xs px-2 py-1 rounded bg-teal-600 text-white hover:bg-teal-700">Confirmar</button>
                          <button onClick={() => updateStatus(appointment.id, 'CANCELLED')} className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200">Cancelar</button>
                        </div>
                      )}
                      {appointment.status === 'CONFIRMED' && (
                        <div className="flex gap-1 mt-2">
                          <button onClick={() => updateStatus(appointment.id, 'COMPLETED')} className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200">Completar</button>
                          <button onClick={() => updateStatus(appointment.id, 'NO_SHOW')} className="text-xs px-2 py-1 rounded bg-stone-100 text-stone-600 hover:bg-stone-200">No presentado</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Leads */}
          <div className="card">
            <h2 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-teal-600">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z"></path>
              </svg>
              Solicitudes web (7 dias)
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-teal-100 text-teal-700">{leadCount}</span>
            </h2>

            {leadItems.length === 0 ? (
              <p className="text-sm text-stone-400 py-4 text-center">No hay solicitudes nuevas</p>
            ) : (
              <div className="space-y-2">
                {leadItems.map((appt) => {
                  const createdStr = new Date(appt.createdAt).toISOString().split('T')[0];
                  return (
                    <div key={appt.id} className="p-3 rounded-lg border border-stone-200">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-medium">{appt.clientName}</div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${STATUS_COLORS[appt.status] || ''}`}>
                          {STATUS_LABELS[appt.status] || appt.status}
                        </span>
                      </div>
                      <div className="text-xs text-stone-500 mt-1">{appt.service?.name || 'Servicio'}</div>
                      <div className="text-xs text-stone-400">{appt.clientEmail} · {appt.clientPhone}</div>
                      <div className="text-xs text-stone-400">Recibida: {formatDateShort(createdStr)}</div>
                      <div className="flex gap-1 mt-2">
                        <button onClick={() => updateStatus(appt.id, 'CONFIRMED')} className="text-xs px-2 py-1 rounded bg-teal-600 text-white hover:bg-teal-700">Confirmar</button>
                        <button onClick={() => updateStatus(appt.id, 'CANCELLED')} className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200">Cancelar</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Metrics */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-sm flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-600">
                  <line x1="12" y1="20" x2="12" y2="10"></line>
                  <line x1="18" y1="20" x2="18" y2="4"></line>
                  <line x1="6" y1="20" x2="6" y2="16"></line>
                </svg>
                Metricas rapidas
              </h2>
              <span className="text-xs text-stone-400">Ultimos 30 dias</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-lg border border-stone-200 p-3">
                <div className="text-xs text-stone-500">Tasa no-show</div>
                <div className="text-lg font-semibold">{noShowRate !== null ? `${noShowRate.toFixed(1)}%` : '—'}</div>
                <div className="text-[10px] text-stone-400">{noShowRecent.length}/{attendedTotal || 0} citas</div>
              </div>
              <div className="rounded-lg border border-stone-200 p-3">
                <div className="text-xs text-stone-500">Conversiones</div>
                <div className="text-lg font-semibold">{conversionRate !== null ? `${conversionRate.toFixed(1)}%` : '—'}</div>
                <div className="text-[10px] text-stone-400">{converted}/{totalCreated || 0} solicitudes</div>
              </div>
              <div className="rounded-lg border border-stone-200 p-3">
                <div className="text-xs text-stone-500">Facturacion (estimada)</div>
                <div className="text-lg font-semibold">{revenueLabel}</div>
                <div className="text-[10px] text-stone-400">{completedRecent.length} citas completadas</div>
              </div>
            </div>
            <div className="text-[10px] text-stone-400 mt-3">
              Basado en citas completadas y solicitudes creadas en el periodo.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
