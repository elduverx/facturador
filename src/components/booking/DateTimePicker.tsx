'use client';

import { useState, useEffect } from 'react';
import { TimeSlot } from '@/types/booking';
import { DAYS_OF_WEEK, MONTHS } from '@/lib/constants';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';

interface Props {
  serviceId: string;
  lawyerId?: string | null;
  selectedDate: string | null;
  selectedTime: string | null;
  onDateSelect: (date: string) => void;
  onTimeSelect: (time: string) => void;
  onModalityFetched?: (modality: string | null) => void;
}

export function DateTimePicker({ serviceId, lawyerId, selectedDate, selectedTime, onDateSelect, onTimeSelect, onModalityFetched }: Props) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    if (!selectedDate || !serviceId) return;
    setLoadingSlots(true);
    fetch(`/api/available-slots?date=${selectedDate}&serviceId=${serviceId}${lawyerId ? `&lawyerId=${encodeURIComponent(lawyerId)}` : ''}`)
      .then((r) => r.json())
      .then((data) => {
        if (data && typeof data === 'object' && 'slots' in data) {
          setSlots(data.slots);
          if (onModalityFetched) onModalityFetched(data.allowedModality);
        } else {
          setSlots(Array.isArray(data) ? data : []);
          if (onModalityFetched) onModalityFetched(null);
        }
      })
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [selectedDate, serviceId, lawyerId]);

  const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const isDateDisabled = (day: number) => {
    const todayStr = today.toISOString().split('T')[0];
    const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    return dateStr < todayStr;
  };

  const formatDayDate = (day: number) => {
    return `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  };

  const canGoPrev = currentYear > today.getFullYear() || (currentYear === today.getFullYear() && currentMonth > today.getMonth());
  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);

  const calendarDays: (number | null)[] = [];
  const adjustedFirst = firstDay === 0 ? 6 : firstDay - 1;
  for (let i = 0; i < adjustedFirst; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  const weekDaysMonFirst = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

  return (
    <div className="animate-fade-in">
      <h2 className="text-xl sm:text-3xl font-bold font-roman uppercase text-[var(--pv-ink)] mb-2 sm:mb-3 tracking-tighter">Elige fecha y hora</h2>
      <p className="text-xs sm:text-sm text-[var(--pv-navy)] opacity-60 mb-4 sm:mb-10 leading-relaxed font-medium">
        Selecciona un día disponible y después el horario que mejor te venga para la consulta.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_240px] gap-4 sm:gap-6 lg:gap-8">
        {/* Calendar Card */}
        <div className="p-2.5 sm:p-5 lg:p-6 rounded-2xl sm:rounded-3xl bg-[var(--pv-marble)] shadow-inner border border-white space-y-3 sm:space-y-6 min-w-0">
          <div className="flex items-center justify-between">
            <button
              onClick={goToPrevMonth}
              disabled={!canGoPrev}
              className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white text-[var(--pv-gold)] hover:shadow-lg disabled:opacity-20 disabled:shadow-none transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="font-roman font-bold text-sm sm:text-lg uppercase tracking-wider sm:tracking-widest text-[var(--pv-ink)] text-center px-2">
              {MONTHS[currentMonth]} {currentYear}
            </span>
            <button onClick={goToNextMonth} className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white text-[var(--pv-gold)] hover:shadow-lg transition-all">
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {weekDaysMonFirst.map((d) => (
              <div key={d} className="text-center text-[10px] font-black text-[var(--pv-gold)] uppercase py-2 border-b border-[var(--pv-gold)]/10">{d}</div>
            ))}
            {calendarDays.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} className="aspect-square opacity-20 bg-stone-200/30 rounded-xl" />;
              const dateStr = formatDayDate(day);
              const disabled = isDateDisabled(day);
              const isSelected = selectedDate === dateStr;

              return (
                <button
                  key={day}
                  disabled={disabled}
                  onClick={() => {
                    onDateSelect(dateStr);
                    onTimeSelect('');
                  }}
                  className={`aspect-square min-h-8 sm:min-h-9 flex items-center justify-center text-xs sm:text-sm font-bold rounded-lg sm:rounded-2xl transition-all duration-300 ${
                    disabled
                      ? 'text-stone-300 cursor-not-allowed'
                      : isSelected
                      ? 'bg-[var(--pv-gold)] text-white shadow-xl scale-110'
                      : 'bg-white hover:bg-[var(--pv-gold)]/10 text-[var(--pv-navy)]'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Time Slots Area */}
        <div className="space-y-3 sm:space-y-6 min-w-0">
          <h3 className="font-roman text-sm font-bold uppercase tracking-[0.2em] text-[var(--pv-gold)] px-2">Horarios disponibles</h3>
          {!selectedDate ? (
             <div className="py-8 sm:py-12 lg:py-20 text-center bg-[var(--pv-marble)] rounded-2xl sm:rounded-3xl border-2 border-dashed border-[var(--pv-gold)]/20 px-6">
                <CalendarIcon size={32} className="mx-auto text-[var(--pv-gold)] opacity-20 mb-4" />
                <p className="text-[10px] font-black uppercase text-[var(--pv-navy)] opacity-40 leading-relaxed">Selecciona un día para ver horarios</p>
             </div>
          ) : (
            <div className="space-y-3">
              {loadingSlots ? (
                <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-white/50">
                  <div className="inline-block w-8 h-8 border-3 border-[var(--pv-gold)] border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-[10px] font-black uppercase text-[var(--pv-gold)] mt-4 animate-pulse">Cargando horarios...</p>
                </div>
              ) : slots.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-3xl border border-red-50">
                   <AlertCircle size={24} className="mx-auto text-red-400 mb-3" />
                   <p className="text-xs font-bold text-red-700">Sin disponibilidad para esta fecha.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2 max-h-[240px] sm:max-h-[320px] lg:max-h-[400px] overflow-y-auto pr-1 sm:pr-2 custom-scrollbar">
                  {slots.map((slot) => (
                    <button
                      key={slot.time}
                      disabled={!slot.available}
                      onClick={() => onTimeSelect(slot.time)}
                      className={`py-3 px-2 text-xs font-black rounded-xl border-2 transition-all duration-300 text-center ${
                        !slot.available
                          ? 'border-stone-100 text-stone-200 cursor-not-allowed bg-stone-50 grayscale'
                          : selectedTime === slot.time
                          ? 'border-[var(--pv-gold)] bg-[var(--pv-gold)] text-white shadow-lg'
                          : 'border-white bg-white hover:border-[var(--pv-gold)]/30 text-[var(--pv-navy)]'
                      }`}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

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
        }
      `}</style>
    </div>
  );
}
