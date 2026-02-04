'use client';

import { useState, useEffect } from 'react';
import { TimeSlot } from '@/types/booking';
import { DAYS_OF_WEEK, MONTHS } from '@/lib/constants';

interface Props {
  serviceId: string;
  selectedDate: string | null;
  selectedTime: string | null;
  onDateSelect: (date: string) => void;
  onTimeSelect: (time: string) => void;
}

export function DateTimePicker({ serviceId, selectedDate, selectedTime, onDateSelect, onTimeSelect }: Props) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    if (!selectedDate || !serviceId) return;
    setLoadingSlots(true);
    fetch(`/api/available-slots?date=${selectedDate}&serviceId=${serviceId}`)
      .then((r) => r.json())
      .then((data) => setSlots(data))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [selectedDate, serviceId]);

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
    const date = new Date(currentYear, currentMonth, day);
    // Disable past dates only. Availability is validated by API.
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
  // Adjust for Monday start (0=Sun -> shift to end)
  const adjustedFirst = firstDay === 0 ? 6 : firstDay - 1;
  for (let i = 0; i < adjustedFirst; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  const weekDaysMonFirst = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

  return (
    <div>
      <h2 className="text-base sm:text-lg font-semibold mb-1">Seleccione fecha y hora</h2>
      <p className="text-xs sm:text-sm text-stone-500 mb-3 sm:mb-5">Elija el dia y horario que prefiera</p>

      {/* Calendar */}
      <div className="bg-white border border-stone-200 rounded-xl p-3 sm:p-4 mb-3 sm:mb-4">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <button
            onClick={goToPrevMonth}
            disabled={!canGoPrev}
            className="p-1.5 sm:p-2 rounded-lg hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
          <span className="font-semibold text-xs sm:text-sm">
            {MONTHS[currentMonth]} {currentYear}
          </span>
          <button onClick={goToNextMonth} className="p-1.5 sm:p-2 rounded-lg hover:bg-stone-100">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {weekDaysMonFirst.map((d) => (
            <div key={d} className="text-center text-[10px] sm:text-xs font-medium text-stone-400 py-0.5 sm:py-1">{d}</div>
          ))}
          {calendarDays.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} />;
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
                className={`text-center py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg transition-all ${
                  disabled
                    ? 'text-stone-300 cursor-not-allowed'
                    : isSelected
                    ? 'bg-teal-600 text-white font-semibold'
                    : 'hover:bg-teal-50 text-stone-700'
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time Slots */}
      {selectedDate && (
        <div>
          <h3 className="font-medium text-xs sm:text-sm mb-2 sm:mb-3">Horarios disponibles</h3>
          {loadingSlots ? (
            <div className="text-center py-6 sm:py-8">
              <div className="inline-block w-5 h-5 sm:w-6 sm:h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs sm:text-sm text-stone-500 mt-2">Cargando horarios...</p>
            </div>
          ) : slots.length === 0 ? (
            <p className="text-xs sm:text-sm text-stone-500 text-center py-3 sm:py-4">No hay horarios disponibles para este dia.</p>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 gap-1 sm:gap-1.5">
              {slots.map((slot) => (
                <button
                  key={slot.time}
                  disabled={!slot.available}
                  onClick={() => onTimeSelect(slot.time)}
                  className={`py-1.5 px-1 text-[11px] sm:text-xs rounded-lg border transition-all text-center ${
                    !slot.available
                      ? 'border-stone-100 text-stone-300 cursor-not-allowed bg-stone-50'
                      : selectedTime === slot.time
                      ? 'border-teal-500 bg-teal-600 text-white font-medium'
                      : 'border-stone-200 hover:border-teal-300 hover:bg-teal-50'
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
  );
}
