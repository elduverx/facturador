'use client';

import { useState, useEffect } from 'react';
import { AppointmentData } from '@/types/booking';
import { MONTHS, DAYS_OF_WEEK, STATUS_LABELS, STATUS_COLORS } from '@/lib/constants';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Check, X, AlertCircle, MapPin, UserSquare, CalendarPlus } from 'lucide-react';
import Link from 'next/link';
import { AdminBookingModal } from '@/components/admin/AdminBookingModal';

export default function CalendarPage() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [selectedDay, setSelectedDay] = useState<string | null>(today.toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

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
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold font-roman uppercase text-[var(--pv-ink)] tracking-tight">Agenda</h1>
          <p className="text-sm text-[var(--pv-navy)] opacity-60">Revisa citas, pagos y estados del día.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
           <button 
            onClick={() => setIsBookingModalOpen(true)}
            className="p-3 px-4 flex items-center gap-2 rounded-xl bg-[var(--pv-gold)] text-white hover:brightness-110 font-bold text-xs uppercase tracking-widest transition-all shadow-md mr-2"
           >
             <CalendarPlus size={18} /> Nueva Cita
           </button>
           <button
            onClick={() => {
              if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
              else setCurrentMonth(currentMonth - 1);
            }}
            className="p-3 rounded-xl bg-white border border-[var(--pv-gold)]/20 text-[var(--pv-gold)] hover:bg-[var(--pv-gold)] hover:text-white transition-all shadow-sm"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="neo-card !p-3 !px-4 sm:!px-8 flex items-center justify-center min-w-[140px] sm:min-w-[200px]">
             <h2 className="font-roman font-bold uppercase tracking-widest text-xs sm:text-base text-[var(--pv-ink)]">{MONTHS[currentMonth]} {currentYear}</h2>
          </div>
          <button
            onClick={() => {
              if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
              else setCurrentMonth(currentMonth + 1);
            }}
            className="p-3 rounded-xl bg-white border border-[var(--pv-gold)]/20 text-[var(--pv-gold)] hover:bg-[var(--pv-gold)] hover:text-white transition-all shadow-sm"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {isBookingModalOpen ? (
        <div className="w-full">
          <AdminBookingModal 
            isOpen={true} 
            onClose={() => setIsBookingModalOpen(false)} 
            onSuccess={() => {
              setIsBookingModalOpen(false);
              loadMonth();
            }}
          />
        </div>
      ) : (
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-8 items-start">
        {/* Calendar Grid */}
        <div className="neo-card !p-4 lg:!p-6 shadow-2xl">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-48 gap-4">
              <div className="w-12 h-12 border-4 border-[var(--pv-gold)] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-bold text-[var(--pv-gold)] uppercase tracking-[0.2em] animate-pulse">Sincronizando Calendario...</p>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-3">
              {weekDays.map((d) => (
                <div key={d} className="text-center text-[10px] font-black text-[var(--pv-gold)] uppercase tracking-[0.3em] py-4 border-b border-[var(--pv-marble)] mb-4">{d}</div>
              ))}
              {cells.map((day, i) => {
                if (!day) return <div key={`e-${i}`} className="aspect-square opacity-20 bg-[var(--pv-marble)] rounded-2xl" />;
                
                const dayAppts = getAppointmentsForDay(day);
                const active = dayAppts.filter((a) => a.status !== 'CANCELLED');
                const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                const isToday = dateStr === today.toISOString().split('T')[0];
                const isSelected = selectedDay === dateStr;

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(dateStr)}
                    className={`aspect-square p-4 rounded-3xl text-sm relative transition-all duration-500 group border flex flex-col items-center justify-center ${
                      isSelected
                        ? 'bg-[var(--pv-gold)] text-white border-[var(--pv-gold)] shadow-xl shadow-[var(--pv-gold)]/30 scale-[1.05] z-10'
                        : isToday
                        ? 'bg-[var(--pv-gold)]/10 border-[var(--pv-gold)]/40 font-black text-[var(--pv-gold)]'
                        : 'bg-white border-white/50 hover:border-[var(--pv-gold)] hover:shadow-lg'
                    }`}
                  >
                    <span className={`text-xl font-roman ${isSelected ? 'text-white' : 'text-[var(--pv-ink)]'}`}>{day}</span>
                    
                    <div className="flex gap-1 mt-2 min-h-[6px]">
                      {active.slice(0, 3).map((_, idx) => (
                        <div key={idx} className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-[var(--pv-gold)]'}`}></div>
                      ))}
                      {active.length > 3 && (
                        <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white/50' : 'bg-[var(--pv-gold)]/30'}`}></div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Day Agenda */}
        <div className="space-y-6">
           <div className="neo-card !p-4 lg:!p-6 border-t-8 border-t-[var(--pv-gold)] xl:sticky xl:top-8 shadow-2xl">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-[var(--pv-navy)] text-white rounded-2xl shadow-lg">
                   <CalendarIcon size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-roman uppercase text-[var(--pv-ink)]">
                    {selectedDay ? selectedDay.split('-').reverse().join('/') : 'Seleccione Fecha'}
                  </h3>
                  <p className="text-[10px] font-bold text-[var(--pv-gold)] uppercase tracking-widest">Agenda Diaria</p>
                </div>
              </div>

              {!selectedDay ? (
                <div className="py-24 text-center bg-[var(--pv-marble)] rounded-3xl border-2 border-dashed border-[var(--pv-gold)]/20 px-10">
                  <p className="text-sm text-[var(--pv-navy)] opacity-40 italic">Invoque un día del calendario para visualizar las citas programadas.</p>
                </div>
              ) : selectedDayAppointments.length === 0 ? (
                <div className="py-24 text-center bg-[var(--pv-marble)] rounded-3xl border border-white shadow-inner px-10">
                  <AlertCircle size={40} className="mx-auto text-[var(--pv-gold)] opacity-20 mb-4" />
                  <p className="text-sm text-[var(--pv-navy)] opacity-40 font-bold uppercase tracking-widest">Sin Citas Programadas</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-3 custom-scrollbar">
                  {selectedDayAppointments.sort((a,b) => a.startTime.localeCompare(b.startTime)).map((appt) => (
                    <div key={appt.id} className="p-6 rounded-2xl bg-white border border-white/50 shadow-sm hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-[var(--pv-gold)]/20 group-hover:bg-[var(--pv-gold)] transition-all"></div>
                      
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-[var(--pv-gold)] font-black text-xs">
                           <Clock size={14} />
                           {appt.startTime} - {appt.endTime}
                        </div>
                        <span className={`text-[9px] font-bold px-2.5 py-1 rounded-lg border shadow-sm uppercase tracking-widest ${STATUS_COLORS[appt.status] || ''}`}>
                          {STATUS_LABELS[appt.status] || appt.status}
                        </span>
                      </div>
                      
                      <div className="mb-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-base font-bold text-[var(--pv-ink)] group-hover:text-[var(--pv-gold)] transition-colors">{appt.clientName}</h4>
                          <Link href={`/admin/clientes?email=${encodeURIComponent(appt.clientEmail)}`} className="text-[10px] font-bold text-[var(--pv-gold)] hover:underline uppercase tracking-widest flex items-center gap-1 bg-[var(--pv-marble)] px-2 py-1 rounded-md transition-colors hover:bg-[var(--pv-gold)] hover:text-white">
                             <UserSquare size={12} /> Ver Ficha
                          </Link>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-[var(--pv-navy)] opacity-60 font-medium mt-1 uppercase tracking-tighter">
                          <MapPin size={12} className="text-[var(--pv-gold)]" />
                          {appt.service?.name || 'Consulta General'}
                          {appt.modality && (
                             <span className="ml-2 font-bold px-1.5 py-0.5 rounded border border-[var(--pv-gold)] text-[var(--pv-gold)] text-[8px] uppercase">
                               {appt.modality === 'VIDEO_CALL' ? 'VIDEO LLAMADA' : 'EN DESPACHO'}
                             </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-6 pt-4 border-t border-[var(--pv-marble)]">
                        {appt.status === 'PENDING' && (
                          <>
                            <button onClick={() => updateStatus(appt.id, 'CONFIRMED')} className="flex-1 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest py-3 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-200 transition-all">
                              <Check size={14} /> Confirmar
                            </button>
                            <button onClick={() => updateStatus(appt.id, 'CANCELLED')} className="flex-1 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest py-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-all">
                              <X size={14} /> Anular
                            </button>
                          </>
                        )}
                        {appt.status === 'CONFIRMED' && (
                          <>
                            <button onClick={() => updateStatus(appt.id, 'COMPLETED')} className="flex-1 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest py-3 rounded-xl bg-[var(--pv-gold)] text-white hover:brightness-110 shadow-md shadow-[var(--pv-gold)]/20 transition-all">
                               Finalizar
                            </button>
                            <button onClick={() => updateStatus(appt.id, 'NO_SHOW')} className="flex-1 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest py-3 rounded-xl bg-[var(--pv-marble)] text-[var(--pv-navy)] hover:bg-stone-200 transition-all">
                               No Asistió
                            </button>
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
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--pv-gold);
          border-radius: 10px;
          opacity: 0.3;
        }
      `}</style>
    </div>
  );
}
