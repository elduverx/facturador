'use client';

import { useState, useEffect } from 'react';
import { AppointmentData } from '@/types/booking';
import { MONTHS, DAYS_OF_WEEK, STATUS_LABELS, STATUS_COLORS } from '@/lib/constants';

export default function CalendarPage() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMonth();
  }, [currentMonth, currentYear]);

  const loadMonth = async () => {
    setLoading(true);
    const from = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-01`;
    const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
    const to = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${lastDay}`;

    try {
      const res = await fetch(`/api/appointments?from=${from}&to=${to}`);
      const data = await res.json();
      setAppointments(Array.isArray(data) ? data : []);
    } catch {
      setAppointments([]);
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
      loadMonth();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const getAppointmentsForDay = (day: number) => {
    const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    return appointments.filter((a) => {
      const aDate = typeof a.date === 'string' ? a.date.split('T')[0] : new Date(a.date).toISOString().split('T')[0];
      return aDate === dateStr;
    });
  };

  const getDaysInMonth = () => new Date(currentYear, currentMonth + 1, 0).getDate();
  const getFirstDay = () => {
    const d = new Date(currentYear, currentMonth, 1).getDay();
    return d === 0 ? 6 : d - 1; // Monday start
  };

  const daysInMonth = getDaysInMonth();
  const firstDay = getFirstDay();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const selectedDayAppointments = selectedDay
    ? appointments.filter((a) => {
        const aDate = typeof a.date === 'string' ? a.date.split('T')[0] : new Date(a.date).toISOString().split('T')[0];
        return aDate === selectedDay;
      })
    : [];

  const weekDays = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold">Calendario</h1>
        <p className="text-sm text-stone-500">Vista mensual de citas</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_350px] gap-6">
        {/* Calendar */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => {
                if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
                else setCurrentMonth(currentMonth - 1);
              }}
              className="p-2 rounded-lg hover:bg-stone-100"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <h2 className="font-semibold">{MONTHS[currentMonth]} {currentYear}</h2>
            <button
              onClick={() => {
                if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
                else setCurrentMonth(currentMonth + 1);
              }}
              className="p-2 rounded-lg hover:bg-stone-100"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map((d) => (
                <div key={d} className="text-center text-xs font-medium text-stone-400 py-2">{d}</div>
              ))}
              {cells.map((day, i) => {
                if (!day) return <div key={`e-${i}`} className="aspect-square" />;
                const dayAppts = getAppointmentsForDay(day);
                const active = dayAppts.filter((a) => a.status !== 'CANCELLED');
                const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                const isToday = dateStr === today.toISOString().split('T')[0];
                const isSelected = selectedDay === dateStr;

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(dateStr)}
                    className={`aspect-square p-1 rounded-lg text-sm relative transition-colors ${
                      isSelected
                        ? 'bg-teal-600 text-white'
                        : isToday
                        ? 'bg-teal-50 font-semibold text-teal-700'
                        : 'hover:bg-stone-100'
                    }`}
                  >
                    <span className="text-xs">{day}</span>
                    {active.length > 0 && (
                      <div className={`absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-teal-500'}`}></div>
                        {active.length > 1 && <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white/60' : 'bg-teal-300'}`}></div>}
                        {active.length > 2 && <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white/40' : 'bg-teal-200'}`}></div>}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Day detail */}
        <div className="card xl:sticky xl:top-4 xl:self-start">
          <h3 className="font-semibold text-sm mb-3">
            {selectedDay ? `Citas del ${selectedDay.split('-').reverse().join('/')}` : 'Seleccione un dia'}
          </h3>

          {!selectedDay ? (
            <p className="text-sm text-stone-400 py-4 text-center">Haga clic en un dia del calendario</p>
          ) : selectedDayAppointments.length === 0 ? (
            <p className="text-sm text-stone-400 py-4 text-center">No hay citas este dia</p>
          ) : (
            <div className="space-y-3">
              {selectedDayAppointments.map((appt) => (
                <div key={appt.id} className="p-3 rounded-lg border border-stone-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold">{appt.startTime} - {appt.endTime}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${STATUS_COLORS[appt.status] || ''}`}>
                      {STATUS_LABELS[appt.status] || appt.status}
                    </span>
                  </div>
                  <div className="text-sm font-medium">{appt.clientName}</div>
                  <div className="text-xs text-stone-500">{appt.service?.name || ''}</div>
                  <div className="text-xs text-stone-400 mt-1">{appt.clientPhone} - {appt.clientEmail}</div>
                  {appt.notes && <div className="text-xs text-stone-500 mt-2 bg-stone-50 p-2 rounded">{appt.notes}</div>}
                  <div className="flex gap-1 mt-2">
                    {appt.status === 'PENDING' && (
                      <>
                        <button onClick={() => updateStatus(appt.id, 'CONFIRMED')} className="text-xs px-2 py-1 rounded bg-teal-600 text-white hover:bg-teal-700">Confirmar</button>
                        <button onClick={() => updateStatus(appt.id, 'CANCELLED')} className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200">Cancelar</button>
                      </>
                    )}
                    {appt.status === 'CONFIRMED' && (
                      <>
                        <button onClick={() => updateStatus(appt.id, 'COMPLETED')} className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200">Completar</button>
                        <button onClick={() => updateStatus(appt.id, 'NO_SHOW')} className="text-xs px-2 py-1 rounded bg-stone-100 text-stone-600 hover:bg-stone-200">No presentado</button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
