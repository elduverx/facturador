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

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-8">
        {/* Calendar */}
        <div className="card shadow-sm border-stone-200 !p-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-bold text-stone-800">{MONTHS[currentMonth]} {currentYear}</h2>
            <div className="flex gap-1">
              <button
                onClick={() => {
                  if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
                  else setCurrentMonth(currentMonth - 1);
                }}
                className="p-2 rounded-xl hover:bg-stone-100 transition-colors border border-stone-200"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
              </button>
              <button
                onClick={() => {
                  if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
                  else setCurrentMonth(currentMonth + 1);
                }}
                className="p-2 rounded-xl hover:bg-stone-100 transition-colors border border-stone-200"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-stone-400 mt-4">Cargando agenda...</p>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((d) => (
                <div key={d} className="text-center text-[10px] font-bold text-stone-400 uppercase tracking-widest py-4 border-b border-stone-100 mb-2">{d}</div>
              ))}
              {cells.map((day, i) => {
                if (!day) return <div key={`e-${i}`} className="aspect-square opacity-20 bg-stone-50 rounded-xl" />;
                const dayAppts = getAppointmentsForDay(day);
                const active = dayAppts.filter((a) => a.status !== 'CANCELLED');
                const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                const isToday = dateStr === today.toISOString().split('T')[0];
                const isSelected = selectedDay === dateStr;

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(dateStr)}
                    className={`aspect-square p-2 rounded-2xl text-sm relative transition-all duration-200 group border ${
                      isSelected
                        ? 'bg-teal-600 text-white border-teal-700 shadow-lg shadow-teal-600/30'
                        : isToday
                        ? 'bg-teal-50 border-teal-200 font-bold text-teal-700'
                        : 'bg-white border-stone-100 hover:border-teal-300 hover:shadow-md'
                    }`}
                  >
                    <span className="text-sm">{day}</span>
                    {active.length > 0 && (
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                        {active.slice(0, 3).map((_, idx) => (
                          <div key={idx} className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-teal-500'}`}></div>
                        ))}
                      </div>
                    )}
                    {active.length > 3 && (
                      <span className={`absolute top-1 right-2 text-[8px] font-bold ${isSelected ? 'text-teal-200' : 'text-stone-400'}`}>+{active.length - 3}</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Day detail */}
        <div className="space-y-6">
           <div className="card shadow-sm border-stone-200 !p-6 xl:sticky xl:top-8">
              <h3 className="text-lg font-bold text-stone-800 mb-6 flex items-center gap-3">
                <span className="w-2 h-6 bg-teal-500 rounded-full"></span>
                {selectedDay ? `${selectedDay.split('-').reverse().join('/')}` : 'Agenda Diaria'}
              </h3>

              {!selectedDay ? (
                <div className="py-12 text-center bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                  <p className="text-xs text-stone-400 italic px-8">Selecciona un día del calendario para gestionar sus citas.</p>
                </div>
              ) : selectedDayAppointments.length === 0 ? (
                <div className="py-12 text-center bg-stone-50 rounded-2xl border border-stone-100">
                  <p className="text-xs text-stone-400 font-medium">No hay citas para este día</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                  {selectedDayAppointments.sort((a,b) => a.startTime.localeCompare(b.startTime)).map((appt) => (
                    <div key={appt.id} className="p-4 rounded-xl border border-stone-200 bg-white hover:border-teal-200 transition-all shadow-sm group">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-stone-900 bg-stone-100 px-2 py-1 rounded-lg">{appt.startTime} - {appt.endTime}</span>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${STATUS_COLORS[appt.status] || ''}`}>
                          {STATUS_LABELS[appt.status] || appt.status}
                        </span>
                      </div>
                      <div className="text-sm font-bold text-stone-800 mb-1">{appt.clientName}</div>
                      <div className="text-xs text-teal-600 font-medium">{appt.service?.name || ''}</div>
                      
                      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-stone-50">
                        {appt.status === 'PENDING' && (
                          <>
                            <button onClick={() => updateStatus(appt.id, 'CONFIRMED')} className="flex-1 text-[10px] font-bold py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700">Confirmar</button>
                            <button onClick={() => updateStatus(appt.id, 'CANCELLED')} className="flex-1 text-[10px] font-bold py-2 rounded-lg bg-stone-50 text-red-600 hover:bg-red-50">Cancelar</button>
                          </>
                        )}
                        {appt.status === 'CONFIRMED' && (
                          <>
                            <button onClick={() => updateStatus(appt.id, 'COMPLETED')} className="flex-1 text-[10px] font-bold py-2 rounded-lg bg-green-600 text-white hover:bg-green-700">Completar</button>
                            <button onClick={() => updateStatus(appt.id, 'NO_SHOW')} className="flex-1 text-[10px] font-bold py-2 rounded-lg bg-stone-50 text-stone-600 hover:bg-stone-100">Faltó</button>
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
    </div>
  );
}
