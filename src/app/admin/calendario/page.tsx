'use client';

import { useState, useEffect } from 'react';
import { AppointmentData } from '@/types/booking';
import { MONTHS, STATUS_LABELS, STATUS_COLORS } from '@/lib/constants';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Check,
  X,
  AlertCircle,
  MapPin,
  UserSquare,
  CalendarPlus,
  Lock,
  Unlock,
  Sun,
  Sunset,
  RefreshCw,
  SlidersHorizontal,
  Trash2,
  Save,
  Sparkles,
  CheckCircle2,
  CalendarCheck,
  Info,
  Layers,
} from 'lucide-react';
import Link from 'next/link';
import { AdminBookingModal } from '@/components/admin/AdminBookingModal';

interface DaySchedule {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  lunchStartTime: string | null;
  lunchEndTime: string | null;
  slotDurationMin: number | null;
  maxAppointmentsPerDay: number | null;
  allowedModality: string | null;
}

interface GeneralSettings {
  startHour: number;
  endHour: number;
  lunchStartHour: number;
  lunchEndHour: number;
  slotDurationMin: number;
  maxAppointmentsPerDay: number;
}

export default function CalendarPage() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [blockedDates, setBlockedDates] = useState<any[]>([]);
  const [daySchedules, setDaySchedules] = useState<DaySchedule[]>([]);
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
    startHour: 9,
    endHour: 18,
    lunchStartHour: 14,
    lunchEndHour: 15,
    slotDurationMin: 30,
    maxAppointmentsPerDay: 0,
  });

  const [selectedDay, setSelectedDay] = useState<string | null>(today.toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState<'citas' | 'cierres' | 'jornada'>('citas');
  const [loading, setLoading] = useState(true);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  // Closure (BlockedDate) state
  const [togglingBlock, setTogglingBlock] = useState(false);
  const [closureStep, setClosureStep] = useState<'SECTIONS' | 'HOURS'>('SECTIONS');
  const [closureSection, setClosureSection] = useState<'MORNING' | 'AFTERNOON' | 'FULL'>('MORNING');
  const [preferredMorningStart, setPreferredMorningStart] = useState('09:00');
  const [preferredMorningEnd, setPreferredMorningEnd] = useState('14:00');
  const [preferredAfternoonStart, setPreferredAfternoonStart] = useState('15:00');
  const [preferredAfternoonEnd, setPreferredAfternoonEnd] = useState('18:00');
  const [blockStart, setBlockStart] = useState('09:00');
  const [blockEnd, setBlockEnd] = useState('14:00');
  const [blockReason, setBlockReason] = useState('');

  useEffect(() => {
    try {
      const ms = localStorage.getItem('pv_morning_closure_start');
      const me = localStorage.getItem('pv_morning_closure_end');
      if (ms) setPreferredMorningStart(ms);
      if (me) setPreferredMorningEnd(me);

      const as = localStorage.getItem('pv_afternoon_closure_start');
      const ae = localStorage.getItem('pv_afternoon_closure_end');
      if (as) setPreferredAfternoonStart(as);
      if (ae) setPreferredAfternoonEnd(ae);
    } catch {}
  }, []);

  const updateMorningClosureHours = (start: string, end: string) => {
    setPreferredMorningStart(start);
    setPreferredMorningEnd(end);
    setBlockStart(start);
    setBlockEnd(end);
    try {
      localStorage.setItem('pv_morning_closure_start', start);
      localStorage.setItem('pv_morning_closure_end', end);
    } catch {}
  };

  const updateAfternoonClosureHours = (start: string, end: string) => {
    setPreferredAfternoonStart(start);
    setPreferredAfternoonEnd(end);
    setBlockStart(start);
    setBlockEnd(end);
    try {
      localStorage.setItem('pv_afternoon_closure_start', start);
      localStorage.setItem('pv_afternoon_closure_end', end);
    } catch {}
  };

  // Excepción de Jornada (DaySchedule) state
  const [scheduleForm, setScheduleForm] = useState({
    startTime: '09:00',
    endTime: '18:00',
    lunchStartTime: '14:00',
    lunchEndTime: '15:00',
    maxAppointmentsPerDay: '',
    slotDurationMin: '',
    allowedModality: '',
  });
  const [slotsCount, setSlotsCount] = useState<number>(8);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleMessage, setScheduleMessage] = useState('');

  // Reschedule state
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleSlots, setRescheduleSlots] = useState<{ time: string; available: boolean }[]>([]);
  const [loadingRescheduleSlots, setLoadingRescheduleSlots] = useState(false);
  const [savingReschedule, setSavingReschedule] = useState(false);

  const [showCustomHours, setShowCustomHours] = useState(false);

  const pad2 = (value: number) => value.toString().padStart(2, '0');
  const hourToTime = (hour: number) => `${pad2(hour)}:00`;
  const timeToMinutes = (time: string): number => {
    if (!time) return 0;
    const [h, m] = time.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };
  const minutesToTime = (minutes: number): string => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${pad2(h)}:${pad2(m)}`;
  };

  const updateSlotsCount = (newCount: number, customForm?: {
    startTime: string;
    endTime: string;
    lunchStartTime: string;
    lunchEndTime: string;
  }) => {
    const validCount = Math.max(1, Math.min(96, newCount));
    setSlotsCount(validCount);

    const form = customForm || scheduleForm;
    const sMin = timeToMinutes(form.startTime || '09:00');
    const eMin = timeToMinutes(form.endTime || '18:00');
    const lStart = form.lunchStartTime && form.lunchEndTime ? timeToMinutes(form.lunchStartTime) : null;
    const lEnd = form.lunchStartTime && form.lunchEndTime ? timeToMinutes(form.lunchEndTime) : null;
    const lDuration = lStart !== null && lEnd !== null && lEnd > lStart ? lEnd - lStart : 0;
    const avail = Math.max(15, eMin - sMin - lDuration);

    const divMins = Math.max(5, Math.floor(avail / validCount));
    setScheduleForm((prev) => ({
      ...prev,
      maxAppointmentsPerDay: String(validCount),
      slotDurationMin: String(divMins),
    }));
  };

  const setSlotDurationDirect = (mins: number, customForm?: {
    startTime: string;
    endTime: string;
    lunchStartTime: string;
    lunchEndTime: string;
  }) => {
    const validMins = Math.max(5, mins);
    const form = customForm || scheduleForm;
    const sMin = timeToMinutes(form.startTime || '09:00');
    const eMin = timeToMinutes(form.endTime || '18:00');
    const lStart = form.lunchStartTime && form.lunchEndTime ? timeToMinutes(form.lunchStartTime) : null;
    const lEnd = form.lunchStartTime && form.lunchEndTime ? timeToMinutes(form.lunchEndTime) : null;
    const lDuration = lStart !== null && lEnd !== null && lEnd > lStart ? lEnd - lStart : 0;
    const avail = Math.max(15, eMin - sMin - lDuration);

    const calculatedSlots = Math.max(1, Math.floor(avail / validMins));
    setSlotsCount(calculatedSlots);
    setScheduleForm((prev) => ({
      ...prev,
      maxAppointmentsPerDay: String(calculatedSlots),
      slotDurationMin: String(validMins),
    }));
  };

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          setGeneralSettings({
            startHour: data.startHour ?? 9,
            endHour: data.endHour ?? 18,
            lunchStartHour: data.lunchStartHour ?? 14,
            lunchEndHour: data.lunchEndHour ?? 15,
            slotDurationMin: data.slotDurationMin ?? 30,
            maxAppointmentsPerDay: data.maxAppointmentsPerDay ?? 0,
          });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadMonth();
  }, [currentMonth, currentYear]);

  const loadMonth = async () => {
    setLoading(true);
    const from = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-01`;
    const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
    const to = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${lastDay}`;

    try {
      const [apptRes, blockedRes, schedulesRes] = await Promise.all([
        fetch(`/api/appointments?from=${from}&to=${to}`),
        fetch(`/api/admin/blocked-dates`),
        fetch(`/api/admin/day-schedules`),
      ]);
      const data = await apptRes.json();
      setAppointments(Array.isArray(data) ? data : []);
      const blocked = await blockedRes.json();
      setBlockedDates(Array.isArray(blocked) ? blocked : []);
      const schedules = await schedulesRes.json();
      setDaySchedules(Array.isArray(schedules) ? schedules : []);
    } catch {
      setAppointments([]);
      setBlockedDates([]);
      setDaySchedules([]);
    } finally {
      setLoading(false);
    }
  };

  const getScheduleForDate = (dateStr: string) =>
    daySchedules.find((schedule) => schedule.date.split('T')[0] === dateStr);

  // Sync Excepción de Jornada form whenever selectedDay or daySchedules changes
  useEffect(() => {
    if (!selectedDay) return;
    setScheduleMessage('');
    const schedule = getScheduleForDate(selectedDay);
    if (schedule) {
      const initSlots = schedule.maxAppointmentsPerDay || (schedule.slotDurationMin ? Math.max(1, Math.floor(480 / schedule.slotDurationMin)) : 8);
      setSlotsCount(initSlots);
      setScheduleForm({
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        lunchStartTime: schedule.lunchStartTime || '',
        lunchEndTime: schedule.lunchEndTime || '',
        maxAppointmentsPerDay: String(initSlots),
        slotDurationMin: schedule.slotDurationMin ? String(schedule.slotDurationMin) : '',
        allowedModality: schedule.allowedModality || '',
      });
    } else {
      const hasLunch = generalSettings.lunchStartHour < generalSettings.lunchEndHour;
      const initSlots = generalSettings.maxAppointmentsPerDay || 8;
      const initDuration = generalSettings.slotDurationMin || 30;
      setSlotsCount(initSlots);
      setScheduleForm({
        startTime: hourToTime(generalSettings.startHour),
        endTime: hourToTime(generalSettings.endHour),
        lunchStartTime: hasLunch ? hourToTime(generalSettings.lunchStartHour) : '14:00',
        lunchEndTime: hasLunch ? hourToTime(generalSettings.lunchEndHour) : '15:00',
        maxAppointmentsPerDay: String(initSlots),
        slotDurationMin: String(initDuration),
        allowedModality: '',
      });
    }
  }, [
    selectedDay,
    daySchedules,
    generalSettings.startHour,
    generalSettings.endHour,
    generalSettings.lunchStartHour,
    generalSettings.lunchEndHour,
  ]);

  const handleSaveSchedule = async () => {
    if (!selectedDay) return;
    setScheduleSaving(true);
    setScheduleMessage('');
    try {
      const payload = {
        date: selectedDay,
        startTime: scheduleForm.startTime,
        endTime: scheduleForm.endTime,
        lunchStartTime: scheduleForm.lunchStartTime || null,
        lunchEndTime: scheduleForm.lunchEndTime || null,
        maxAppointmentsPerDay: scheduleForm.maxAppointmentsPerDay,
        slotDurationMin: scheduleForm.slotDurationMin,
        allowedModality: scheduleForm.allowedModality || null,
      };

      const res = await fetch('/api/admin/day-schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      await loadMonth();
      setScheduleMessage('Excepción de jornada guardada correctamente.');
      setTimeout(() => setScheduleMessage(''), 3000);
    } catch {
      setScheduleMessage('No se pudo guardar la jornada.');
    } finally {
      setScheduleSaving(false);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm('¿Restaurar el horario general para este día?')) return;
    try {
      const res = await fetch(`/api/admin/day-schedules/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      await loadMonth();
      setScheduleMessage('Horario general restaurado.');
      setTimeout(() => setScheduleMessage(''), 3000);
    } catch {
      alert('Error al eliminar la excepción.');
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

  const openReschedule = (appt: AppointmentData) => {
    const aDate =
      typeof appt.date === 'string'
        ? appt.date.split('T')[0]
        : new Date(appt.date).toISOString().split('T')[0];
    setReschedulingId(appt.id);
    setRescheduleDate(aDate);
    setRescheduleTime(appt.startTime);
    fetchSlotsForReschedule(aDate, appt.serviceId);
  };

  const fetchSlotsForReschedule = async (dateStr: string, serviceId: string) => {
    if (!dateStr || !serviceId) return;
    setLoadingRescheduleSlots(true);
    try {
      const res = await fetch(`/api/available-slots?date=${dateStr}&serviceId=${serviceId}`);
      const data = await res.json();
      const slotsList =
        data && typeof data === 'object' && 'slots' in data
          ? data.slots
          : Array.isArray(data)
          ? data
          : [];
      setRescheduleSlots(slotsList);
    } catch {
      setRescheduleSlots([]);
    } finally {
      setLoadingRescheduleSlots(false);
    }
  };

  const handleSaveReschedule = async (appt: AppointmentData) => {
    if (!rescheduleDate || !rescheduleTime) return;
    setSavingReschedule(true);
    try {
      const res = await fetch(`/api/appointments/${appt.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: rescheduleDate,
          startTime: rescheduleTime,
        }),
      });
      if (res.ok) {
        setReschedulingId(null);
        const parts = rescheduleDate.split('-').map(Number);
        if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          setCurrentYear(parts[0]);
          setCurrentMonth(parts[1] - 1);
          setSelectedDay(rescheduleDate);
        }
        await loadMonth();
      }
    } catch (error) {
      console.error('Error reagendando cita:', error);
    } finally {
      setSavingReschedule(false);
    }
  };

  const handleBlockRange = async (startTime?: string, endTime?: string, reasonLabel?: string) => {
    if (!selectedDay) return;
    setTogglingBlock(true);
    try {
      if (startTime && endTime) {
        if (closureSection === 'MORNING') {
          updateMorningClosureHours(startTime, endTime);
        } else if (closureSection === 'AFTERNOON') {
          updateAfternoonClosureHours(startTime, endTime);
        }
      }

      await fetch('/api/admin/blocked-dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDay,
          startTime: startTime || undefined,
          endTime: endTime || undefined,
          reason:
            reasonLabel ||
            blockReason.trim() ||
            (startTime && endTime
              ? `Cerrado de ${startTime} a ${endTime}`
              : 'Día cerrado desde agenda'),
        }),
      });
      setBlockReason('');
      setClosureStep('SECTIONS');
      await loadMonth();
    } catch (error) {
      console.error('Error bloqueando horario:', error);
    } finally {
      setTogglingBlock(false);
    }
  };

  const handleUnblock = async (blockId: string) => {
    setTogglingBlock(true);
    try {
      await fetch(`/api/admin/blocked-dates?id=${blockId}`, { method: 'DELETE' });
      await loadMonth();
    } catch (error) {
      console.error('Error desbloqueando:', error);
    } finally {
      setTogglingBlock(false);
    }
  };

  const handleUnblockAll = async (blockIds: string[]) => {
    if (blockIds.length === 0) return;
    setTogglingBlock(true);
    try {
      await fetch(`/api/admin/blocked-dates?ids=${blockIds.join(',')}`, { method: 'DELETE' });
      await loadMonth();
    } catch (error) {
      console.error('Error desbloqueando todos:', error);
    } finally {
      setTogglingBlock(false);
    }
  };

  const getAppointmentsForDay = (day: number) => {
    const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day
      .toString()
      .padStart(2, '0')}`;
    return appointments.filter((a) => {
      const aDate =
        typeof a.date === 'string'
          ? a.date.split('T')[0]
          : new Date(a.date).toISOString().split('T')[0];
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
        const aDate =
          typeof a.date === 'string'
            ? a.date.split('T')[0]
            : new Date(a.date).toISOString().split('T')[0];
        return aDate === selectedDay;
      })
    : [];

  const selectedDayBlocks = selectedDay
    ? blockedDates.filter((b) => b.date.startsWith(selectedDay))
    : [];
  const selectedSchedule = selectedDay ? getScheduleForDate(selectedDay) : undefined;

  const updateSelectedDayForMonth = (year: number, month: number) => {
    const todayStr = today.toISOString().split('T')[0];
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();
    if (year === todayYear && month === todayMonth) {
      setSelectedDay(todayStr);
    } else {
      setSelectedDay(`${year}-${(month + 1).toString().padStart(2, '0')}-01`);
    }
  };

  const goToPrevMonth = () => {
    let newMonth = currentMonth - 1;
    let newYear = currentYear;
    if (currentMonth === 0) {
      newMonth = 11;
      newYear = currentYear - 1;
    }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
    updateSelectedDayForMonth(newYear, newMonth);
  };

  const goToNextMonth = () => {
    let newMonth = currentMonth + 1;
    let newYear = currentYear;
    if (currentMonth === 11) {
      newMonth = 0;
      newYear = currentYear + 1;
    }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
    updateSelectedDayForMonth(newYear, newMonth);
  };

  const weekDays = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

  return (
    <div className="space-y-8">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold font-roman uppercase text-[var(--pv-ink)] tracking-tight">
            Agenda y Disponibilidad
          </h1>
          <p className="text-sm text-[var(--pv-navy)] opacity-60">
            Gestiona citas, cierres por franja horaria y excepciones de jornada en un solo lugar.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsBookingModalOpen(true)}
            className="p-3 px-4 flex items-center gap-2 rounded-xl bg-[var(--pv-gold)] text-white hover:brightness-110 font-bold text-xs uppercase tracking-widest transition-all shadow-md mr-2"
          >
            <CalendarPlus size={18} /> Nueva Cita
          </button>
          <button
            onClick={goToPrevMonth}
            className="p-3 rounded-xl bg-white border border-[var(--pv-gold)]/20 text-[var(--pv-gold)] hover:bg-[var(--pv-gold)] hover:text-white transition-all shadow-sm"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="neo-card !p-3 !px-4 sm:!px-8 flex items-center justify-center min-w-[140px] sm:min-w-[200px]">
            <h2 className="font-roman font-bold uppercase tracking-widest text-xs sm:text-base text-[var(--pv-ink)]">
              {MONTHS[currentMonth]} {currentYear}
            </h2>
          </div>
          <button
            onClick={goToNextMonth}
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
            initialDate={selectedDay}
            onClose={() => setIsBookingModalOpen(false)}
            onSuccess={(bookedDate?: string) => {
              setIsBookingModalOpen(false);
              if (bookedDate) {
                const parts = bookedDate.split('-').map(Number);
                if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                  setCurrentYear(parts[0]);
                  setCurrentMonth(parts[1] - 1);
                  setSelectedDay(bookedDate);
                }
              }
              loadMonth();
            }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_460px] gap-8 items-start">
          {/* Calendar Grid */}
          <div className="neo-card !p-4 lg:!p-6 shadow-2xl space-y-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-48 gap-4">
                <div className="w-12 h-12 border-4 border-[var(--pv-gold)] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-bold text-[var(--pv-gold)] uppercase tracking-[0.2em] animate-pulse">
                  Sincronizando Calendario...
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-7 gap-2.5 sm:gap-3">
                  {weekDays.map((d) => (
                    <div
                      key={d}
                      className="text-center text-[10px] font-black text-[var(--pv-gold)] uppercase tracking-[0.3em] py-3 border-b border-[var(--pv-marble)] mb-2"
                    >
                      {d}
                    </div>
                  ))}
                  {cells.map((day, i) => {
                    if (!day)
                      return (
                        <div
                          key={`e-${i}`}
                          className="aspect-square opacity-20 bg-[var(--pv-marble)] rounded-2xl"
                        />
                      );

                    const dayAppts = getAppointmentsForDay(day);
                    const active = dayAppts.filter((a) => a.status !== 'CANCELLED');
                    const dateStr = `${currentYear}-${(currentMonth + 1)
                      .toString()
                      .padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                    const isToday = dateStr === today.toISOString().split('T')[0];
                    const isSelected = selectedDay === dateStr;
                    const dayBlocks = blockedDates.filter((b) => b.date.startsWith(dateStr));
                    const isFullBlocked = dayBlocks.some((b) => b.isFullDay !== false);
                    const isPartialBlocked = !isFullBlocked && dayBlocks.length > 0;
                    const hasCustomSchedule = !!getScheduleForDate(dateStr);

                    return (
                      <button
                        key={day}
                        onClick={() => setSelectedDay(dateStr)}
                        className={`aspect-square p-2 sm:p-4 rounded-2xl sm:rounded-3xl text-sm relative transition-all duration-300 group border flex flex-col items-center justify-center ${
                          isSelected
                            ? 'bg-[var(--pv-gold)] text-white border-[var(--pv-gold)] shadow-xl shadow-[var(--pv-gold)]/30 scale-[1.04] z-10'
                            : isFullBlocked
                            ? 'bg-red-50/60 border-red-200/80 text-red-300'
                            : isPartialBlocked
                            ? 'bg-amber-50/70 border-amber-200 text-[var(--pv-ink)]'
                            : hasCustomSchedule
                            ? 'bg-[var(--pv-navy)]/5 border-[var(--pv-navy)]/30 text-[var(--pv-ink)]'
                            : isToday
                            ? 'bg-[var(--pv-gold)]/10 border-[var(--pv-gold)]/40 font-black text-[var(--pv-gold)]'
                            : 'bg-white border-white/50 hover:border-[var(--pv-gold)] hover:shadow-lg'
                        }`}
                      >
                        {/* Top-left Custom Schedule Indicator */}
                        {hasCustomSchedule && (
                          <SlidersHorizontal
                            size={10}
                            className={`absolute top-2 left-2 ${
                              isSelected ? 'text-white' : 'text-[var(--pv-navy)] opacity-70'
                            }`}
                          />
                        )}

                        {/* Top-right Lock Indicator */}
                        {isFullBlocked && (
                          <Lock
                            size={10}
                            className={`absolute top-2 right-2 ${
                              isSelected ? 'text-white' : 'text-red-400 opacity-80'
                            }`}
                          />
                        )}
                        {isPartialBlocked && (
                          <Lock
                            size={10}
                            className={`absolute top-2 right-2 ${
                              isSelected ? 'text-white' : 'text-amber-500 opacity-90'
                            }`}
                          />
                        )}

                        <span
                          className={`text-lg sm:text-xl font-roman ${
                            isSelected ? 'text-white font-bold' : 'text-[var(--pv-ink)]'
                          }`}
                        >
                          {day}
                        </span>

                        <div className="flex gap-1 mt-1.5 min-h-[6px]">
                          {active.slice(0, 3).map((_, idx) => (
                            <div
                              key={idx}
                              className={`w-1.5 h-1.5 rounded-full ${
                                isSelected ? 'bg-white' : 'bg-[var(--pv-gold)]'
                              }`}
                            ></div>
                          ))}
                          {active.length > 3 && (
                            <div
                              className={`w-1.5 h-1.5 rounded-full ${
                                isSelected ? 'bg-white/50' : 'bg-[var(--pv-gold)]/30'
                              }`}
                            ></div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Visual Legend */}
                <div className="pt-4 border-t border-[var(--pv-marble)] flex flex-wrap items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-wider text-[var(--pv-navy)]/70">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[var(--pv-gold)] inline-block"></span>
                    <span>Citas activas</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <SlidersHorizontal size={12} className="text-[var(--pv-navy)]" />
                    <span>Excepción de Jornada</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Lock size={12} className="text-amber-500" />
                    <span>Franja Cerrada (ej. 10-14h)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Lock size={12} className="text-red-500" />
                    <span>Día Cerrado</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right Panel: Selected Day Management (Citas | Cierres | Excepción de Jornada) */}
          <div className="space-y-6">
            <div className="neo-card !p-4 lg:!p-6 border-t-8 border-t-[var(--pv-gold)] xl:sticky xl:top-8 shadow-2xl space-y-5">
              {/* Selected Day Header */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="p-3 bg-[var(--pv-navy)] text-white rounded-2xl shadow-lg">
                    <CalendarIcon size={22} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold font-roman uppercase text-[var(--pv-ink)]">
                      {selectedDay ? selectedDay.split('-').reverse().join('/') : 'Seleccione Fecha'}
                    </h3>
                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] font-bold text-[var(--pv-gold)] uppercase tracking-widest">
                        Gestión del Día
                      </span>
                      {selectedSchedule && (
                        <span className="px-2 py-0.5 rounded-md bg-[var(--pv-navy)]/10 text-[var(--pv-navy)] text-[8px] font-black uppercase tracking-wider">
                          Jornada Personalizada
                        </span>
                      )}
                      {selectedDayBlocks.length > 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-700 text-[8px] font-black uppercase tracking-wider">
                          {selectedDayBlocks.some((b) => b.isFullDay !== false)
                            ? 'Día Cerrado'
                            : `${selectedDayBlocks.length} Cierre(s)`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs for the Selected Day */}
              {selectedDay && (
                <div className="grid grid-cols-3 gap-1.5 p-1.5 rounded-2xl bg-[var(--pv-marble)] border border-white">
                  <button
                    type="button"
                    onClick={() => setActiveTab('citas')}
                    className={`py-2.5 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                      activeTab === 'citas'
                        ? 'bg-white text-[var(--pv-ink)] shadow-sm border border-[var(--pv-gold)]/20'
                        : 'text-[var(--pv-navy)]/60 hover:text-[var(--pv-ink)]'
                    }`}
                  >
                    <Clock size={12} className="text-[var(--pv-gold)]" />
                    <span>Citas</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-[var(--pv-gold)]/15 text-[var(--pv-gold)] text-[9px]">
                      {selectedDayAppointments.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('cierres')}
                    className={`py-2.5 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                      activeTab === 'cierres'
                        ? 'bg-white text-[var(--pv-ink)] shadow-sm border border-[var(--pv-gold)]/20'
                        : 'text-[var(--pv-navy)]/60 hover:text-[var(--pv-ink)]'
                    }`}
                  >
                    <Lock size={12} className="text-red-500" />
                    <span>Cierres</span>
                    {selectedDayBlocks.length > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-red-100 text-red-600 text-[9px]">
                        {selectedDayBlocks.length}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('jornada')}
                    className={`py-2.5 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                      activeTab === 'jornada'
                        ? 'bg-white text-[var(--pv-ink)] shadow-sm border border-[var(--pv-gold)]/20'
                        : 'text-[var(--pv-navy)]/60 hover:text-[var(--pv-ink)]'
                    }`}
                  >
                    <SlidersHorizontal size={12} className="text-[var(--pv-navy)]" />
                    <span>Cupos y Jornada</span>
                    {selectedSchedule && (
                      <span className="w-2 h-2 rounded-full bg-[var(--pv-gold)]"></span>
                    )}
                  </button>
                </div>
              )}

              {!selectedDay ? (
                <div className="py-24 text-center bg-[var(--pv-marble)] rounded-3xl border-2 border-dashed border-[var(--pv-gold)]/20 px-10">
                  <p className="text-sm text-[var(--pv-navy)] opacity-40 italic">
                    Seleccione un día del calendario para gestionar citas, cierres o jornada.
                  </p>
                </div>
              ) : activeTab === 'citas' ? (
                /* ================= TAB 1: CITAS DEL DÍA ================= */
                <div className="space-y-4">
                  {/* Compact summary of closures if any exist */}
                  {selectedDayBlocks.length > 0 && (
                    <div className="p-3 rounded-xl bg-red-50/80 border border-red-200 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-red-700 truncate">
                        <Lock size={13} className="shrink-0" />
                        <span className="truncate">
                          {selectedDayBlocks.some((b) => b.isFullDay !== false)
                            ? 'Día completo cerrado al público'
                            : `Horarios cerrados: ${selectedDayBlocks
                                .map((b) => `${b.startTime}-${b.endTime}`)
                                .join(', ')}`}
                        </span>
                      </div>
                      <button
                        onClick={() => setActiveTab('cierres')}
                        className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-white text-red-700 border border-red-200 shrink-0 hover:bg-red-100"
                      >
                        Gestionar
                      </button>
                    </div>
                  )}

                  {selectedDayAppointments.length === 0 ? (
                    <div className="py-20 text-center bg-[var(--pv-marble)] rounded-3xl border border-white shadow-inner px-8">
                      <AlertCircle size={36} className="mx-auto text-[var(--pv-gold)] opacity-25 mb-3" />
                      <p className="text-xs text-[var(--pv-navy)] opacity-50 font-bold uppercase tracking-widest">
                        Sin Citas Programadas
                      </p>
                      <div className="mt-4 flex flex-wrap justify-center gap-2">
                        <button
                          onClick={() => setActiveTab('cierres')}
                          className="px-3 py-1.5 rounded-xl bg-white border border-stone-200 text-[9px] font-black uppercase tracking-widest text-[var(--pv-navy)] hover:border-[var(--pv-gold)]"
                        >
                          Cerrar Horario
                        </button>
                        <button
                          onClick={() => setActiveTab('jornada')}
                          className="px-3 py-1.5 rounded-xl bg-white border border-stone-200 text-[9px] font-black uppercase tracking-widest text-[var(--pv-navy)] hover:border-[var(--pv-gold)]"
                        >
                          Personalizar Jornada
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6 max-h-[62vh] overflow-y-auto pr-2 custom-scrollbar">
                      {[
                        {
                          key: 'morning',
                          label: 'Mañana',
                          icon: Sun,
                          items: selectedDayAppointments
                            .filter((a) => a.startTime < '14:00')
                            .sort((a, b) => a.startTime.localeCompare(b.startTime)),
                        },
                        {
                          key: 'afternoon',
                          label: 'Tarde',
                          icon: Sunset,
                          items: selectedDayAppointments
                            .filter((a) => a.startTime >= '14:00')
                            .sort((a, b) => a.startTime.localeCompare(b.startTime)),
                        },
                      ]
                        .filter((section) => section.items.length > 0)
                        .map((section) => (
                          <div key={section.key} className="space-y-3">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--pv-marble)]/70 border border-white">
                              <section.icon size={13} className="text-[var(--pv-gold)]" />
                              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--pv-navy)]">
                                Sección {section.label} ({section.items.length})
                              </span>
                            </div>

                            {section.items.map((appt) => (
                              <div
                                key={appt.id}
                                className="p-5 rounded-2xl bg-white border border-white/50 shadow-sm hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
                              >
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-[var(--pv-gold)]/20 group-hover:bg-[var(--pv-gold)] transition-all"></div>

                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2 text-[var(--pv-gold)] font-black text-xs">
                                    <Clock size={14} />
                                    {appt.startTime} - {appt.endTime}
                                  </div>
                                  <span
                                    className={`text-[9px] font-bold px-2.5 py-1 rounded-lg border shadow-sm uppercase tracking-widest ${
                                      STATUS_COLORS[appt.status] || ''
                                    }`}
                                  >
                                    {STATUS_LABELS[appt.status] || appt.status}
                                  </span>
                                </div>

                                <div className="mb-3">
                                  <div className="flex items-center justify-between">
                                    <h4 className="text-base font-bold text-[var(--pv-ink)] group-hover:text-[var(--pv-gold)] transition-colors">
                                      {appt.clientName}
                                    </h4>
                                    <Link
                                      href={`/admin/clientes?email=${encodeURIComponent(appt.clientEmail)}`}
                                      className="text-[10px] font-bold text-[var(--pv-gold)] hover:underline uppercase tracking-widest flex items-center gap-1 bg-[var(--pv-marble)] px-2 py-1 rounded-md transition-colors hover:bg-[var(--pv-gold)] hover:text-white"
                                    >
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

                                {/* Inline Reschedule Editor */}
                                {reschedulingId === appt.id && (
                                  <div className="mb-4 p-4 rounded-xl bg-[var(--pv-marble)] border border-[var(--pv-gold)]/30 space-y-3 animate-fade-in">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-black uppercase tracking-widest text-[var(--pv-gold)]">
                                        Reagendar Día y Hora
                                      </span>
                                      <button
                                        onClick={() => setReschedulingId(null)}
                                        className="text-xs text-[var(--pv-navy)] opacity-50 hover:opacity-100"
                                      >
                                        <X size={14} />
                                      </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <label className="block text-[9px] font-bold uppercase text-[var(--pv-navy)] opacity-60 mb-1">
                                          Nueva Fecha
                                        </label>
                                        <input
                                          type="date"
                                          value={rescheduleDate}
                                          onChange={(e) => {
                                            setRescheduleDate(e.target.value);
                                            fetchSlotsForReschedule(e.target.value, appt.serviceId);
                                          }}
                                          className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-stone-200 text-xs font-bold text-[var(--pv-ink)]"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[9px] font-bold uppercase text-[var(--pv-navy)] opacity-60 mb-1">
                                          Nueva Hora
                                        </label>
                                        <input
                                          type="time"
                                          value={rescheduleTime}
                                          onChange={(e) => setRescheduleTime(e.target.value)}
                                          className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-stone-200 text-xs font-bold text-[var(--pv-ink)]"
                                        />
                                      </div>
                                    </div>

                                    {loadingRescheduleSlots ? (
                                      <p className="text-[9px] font-bold text-[var(--pv-gold)] uppercase tracking-widest animate-pulse">
                                        Consultando disponibilidad...
                                      </p>
                                    ) : (
                                      rescheduleSlots.length > 0 && (
                                        <div className="space-y-2">
                                          {rescheduleSlots.some((s) => s.time < '14:00') && (
                                            <div>
                                              <p className="text-[8px] font-black uppercase tracking-widest text-[var(--pv-navy)] opacity-50 mb-1">
                                                Mañana
                                              </p>
                                              <div className="flex flex-wrap gap-1">
                                                {rescheduleSlots
                                                  .filter((s) => s.time < '14:00')
                                                  .map((s) => (
                                                    <button
                                                      key={s.time}
                                                      type="button"
                                                      onClick={() => setRescheduleTime(s.time)}
                                                      className={`px-2 py-1 rounded-md text-[10px] font-bold border transition-all ${
                                                        rescheduleTime === s.time
                                                          ? 'bg-[var(--pv-gold)] text-white border-[var(--pv-gold)]'
                                                          : s.available
                                                          ? 'bg-white text-[var(--pv-navy)] border-stone-200 hover:border-[var(--pv-gold)]'
                                                          : 'bg-stone-100 text-stone-400 border-stone-200 line-through'
                                                      }`}
                                                    >
                                                      {s.time}
                                                    </button>
                                                  ))}
                                              </div>
                                            </div>
                                          )}
                                          {rescheduleSlots.some((s) => s.time >= '14:00') && (
                                            <div>
                                              <p className="text-[8px] font-black uppercase tracking-widest text-[var(--pv-navy)] opacity-50 mb-1">
                                                Tarde
                                              </p>
                                              <div className="flex flex-wrap gap-1">
                                                {rescheduleSlots
                                                  .filter((s) => s.time >= '14:00')
                                                  .map((s) => (
                                                    <button
                                                      key={s.time}
                                                      type="button"
                                                      onClick={() => setRescheduleTime(s.time)}
                                                      className={`px-2 py-1 rounded-md text-[10px] font-bold border transition-all ${
                                                        rescheduleTime === s.time
                                                          ? 'bg-[var(--pv-gold)] text-white border-[var(--pv-gold)]'
                                                          : s.available
                                                          ? 'bg-white text-[var(--pv-navy)] border-stone-200 hover:border-[var(--pv-gold)]'
                                                          : 'bg-stone-100 text-stone-400 border-stone-200 line-through'
                                                      }`}
                                                    >
                                                      {s.time}
                                                    </button>
                                                  ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )
                                    )}

                                    <button
                                      onClick={() => handleSaveReschedule(appt)}
                                      disabled={savingReschedule || !rescheduleDate || !rescheduleTime}
                                      className="w-full py-2 rounded-xl bg-[var(--pv-navy)] hover:bg-[var(--pv-gold)] text-white text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                                    >
                                      {savingReschedule ? 'Guardando...' : 'Guardar Nuevo Día y Hora'}
                                    </button>
                                  </div>
                                )}

                                <div className="flex flex-col gap-2 mt-4 pt-3 border-t border-[var(--pv-marble)]">
                                  <button
                                    onClick={() =>
                                      reschedulingId === appt.id
                                        ? setReschedulingId(null)
                                        : openReschedule(appt)
                                    }
                                    className="w-full flex items-center justify-center gap-1.5 text-[9px] font-black uppercase tracking-widest py-2 rounded-lg bg-[var(--pv-marble)] text-[var(--pv-navy)] hover:bg-[var(--pv-gold)] hover:text-white transition-all border border-[var(--pv-gold)]/20"
                                  >
                                    <RefreshCw size={12} />{' '}
                                    {reschedulingId === appt.id
                                      ? 'Cerrar Reagenda'
                                      : 'Reagendar Día y Hora'}
                                  </button>

                                  {appt.status === 'PENDING' && (
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => updateStatus(appt.id, 'CONFIRMED')}
                                        className="flex-1 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-200 transition-all"
                                      >
                                        <Check size={14} /> Confirmar
                                      </button>
                                      <button
                                        onClick={() => updateStatus(appt.id, 'CANCELLED')}
                                        className="flex-1 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest py-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-all"
                                      >
                                        <X size={14} /> Anular
                                      </button>
                                    </div>
                                  )}
                                  {appt.status === 'CONFIRMED' && (
                                    <div className="flex flex-col gap-2">
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={() => updateStatus(appt.id, 'COMPLETED')}
                                          className="flex-1 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest py-2.5 rounded-xl bg-[var(--pv-gold)] text-white hover:brightness-110 shadow-md shadow-[var(--pv-gold)]/20 transition-all"
                                        >
                                          Finalizar
                                        </button>
                                        <button
                                          onClick={() => updateStatus(appt.id, 'NO_SHOW')}
                                          className="flex-1 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest py-2.5 rounded-xl bg-[var(--pv-marble)] text-[var(--pv-navy)] hover:bg-stone-200 transition-all"
                                        >
                                          No Asistió
                                        </button>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={() => updateStatus(appt.id, 'PENDING')}
                                          className="flex-1 flex items-center justify-center gap-1.5 text-[9px] font-bold uppercase tracking-widest py-2 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 transition-all border border-orange-100"
                                        >
                                          <Clock size={12} /> A Pendiente
                                        </button>
                                        <button
                                          onClick={() => updateStatus(appt.id, 'CANCELLED')}
                                          className="flex-1 flex items-center justify-center gap-1.5 text-[9px] font-bold uppercase tracking-widest py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all border border-red-100"
                                        >
                                          <X size={12} /> Anular
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ) : activeTab === 'cierres' ? (
                /* ================= TAB 2: CIERRES DE HORARIO ================= */
                <div className="space-y-5 animate-fade-in">
                  {/* Active Closures List - Styled compactly like Espacios de Jornadas */}
                  <div>
                    {selectedDayBlocks.length === 0 ? (
                      <div className="p-4 rounded-2xl bg-[var(--pv-marble)]/60 border border-stone-200/70 text-center">
                        <p className="text-xs font-bold text-emerald-700">
                          Todos los horarios de este día están abiertos.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* 1. Full Day Block if present */}
                        {(() => {
                          const fullDayBlock = selectedDayBlocks.find((b) => b.isFullDay !== false);
                          if (!fullDayBlock) return null;
                          return (
                            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 shadow-sm">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                                  <Lock size={15} />
                                </div>
                                <div>
                                  <span className="text-xs font-bold block">Día Completo Cerrado</span>
                                  {fullDayBlock.label && (
                                    <span className="text-[10px] text-red-600/80 block mt-0.5">
                                      {fullDayBlock.label}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleUnblock(fullDayBlock.id)}
                                disabled={togglingBlock}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200 text-[10px] font-black uppercase tracking-wider shadow-sm transition-all active:scale-95 cursor-pointer"
                              >
                                <Unlock size={12} /> Abrir Día
                              </button>
                            </div>
                          );
                        })()}

                        {/* 2. Partial Closures - Styled like Espacios de Jornadas */}
                        {(() => {
                          const partialBlocks = selectedDayBlocks
                            .filter((b) => b.isFullDay === false)
                            .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

                          if (partialBlocks.length === 0) return null;

                          const morningBlocks = partialBlocks.filter(
                            (b) => (b.startTime || '00:00') < '14:30'
                          );
                          const afternoonBlocks = partialBlocks.filter(
                            (b) => (b.startTime || '00:00') >= '14:30'
                          );

                          return (
                            <div className="p-3.5 rounded-2xl bg-white border border-stone-200/80 shadow-sm space-y-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="text-[10px] font-black uppercase tracking-widest text-red-600 flex items-center gap-1.5">
                                    <Lock size={12} className="text-red-500" /> Franjas Cerradas ({partialBlocks.length})
                                  </span>
                                  <span className="block text-[8px] text-[var(--pv-navy)] opacity-60 mt-0.5">
                                    Pulsa en cualquier hora para volver a abrirla y permitir citas.
                                  </span>
                                </div>
                                {partialBlocks.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleUnblockAll(partialBlocks.map((b) => b.id))}
                                    disabled={togglingBlock}
                                    className="text-[9px] font-black uppercase tracking-wider text-emerald-700 hover:text-emerald-800 underline active:scale-95 transition-transform cursor-pointer"
                                  >
                                    Abrir todas ({partialBlocks.length})
                                  </button>
                                )}
                              </div>

                              <div className="space-y-2.5">
                                {morningBlocks.length > 0 && (
                                  <div>
                                    <div className="text-[9px] font-black uppercase tracking-wider text-[var(--pv-navy)]/60 mb-1.5 flex items-center gap-1">
                                      <Sun size={10} className="text-[var(--pv-gold)]" /> Mañana ({morningBlocks.length} franja{morningBlocks.length === 1 ? '' : 's'})
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                      {morningBlocks.map((b) => (
                                        <button
                                          key={b.id}
                                          type="button"
                                          disabled={togglingBlock}
                                          onClick={() => handleUnblock(b.id)}
                                          title={`${b.label || 'Franja cerrada'} (${b.startTime} - ${b.endTime}). Clic para volver a abrir`}
                                          className="group px-2 py-1 rounded-lg text-[10px] font-bold bg-red-50 text-red-600 line-through opacity-85 border border-red-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 hover:no-underline transition-all flex items-center gap-1 cursor-pointer active:scale-95 disabled:cursor-not-allowed"
                                        >
                                          <span>{b.startTime}{b.endTime ? ` - ${b.endTime}` : ''}</span>
                                          <X size={10} className="text-red-400 group-hover:hidden" />
                                          <Unlock size={10} className="text-emerald-600 hidden group-hover:inline" />
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {afternoonBlocks.length > 0 && (
                                  <div className={morningBlocks.length > 0 ? 'pt-2 border-t border-stone-100' : ''}>
                                    <div className="text-[9px] font-black uppercase tracking-wider text-[var(--pv-navy)]/60 mb-1.5 flex items-center gap-1">
                                      <Sunset size={10} className="text-[var(--pv-gold)]" /> Tarde ({afternoonBlocks.length} franja{afternoonBlocks.length === 1 ? '' : 's'})
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                      {afternoonBlocks.map((b) => (
                                        <button
                                          key={b.id}
                                          type="button"
                                          disabled={togglingBlock}
                                          onClick={() => handleUnblock(b.id)}
                                          title={`${b.label || 'Franja cerrada'} (${b.startTime} - ${b.endTime}). Clic para volver a abrir`}
                                          className="group px-2 py-1 rounded-lg text-[10px] font-bold bg-red-50 text-red-600 line-through opacity-85 border border-red-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 hover:no-underline transition-all flex items-center gap-1 cursor-pointer active:scale-95 disabled:cursor-not-allowed"
                                        >
                                          <span>{b.startTime}{b.endTime ? ` - ${b.endTime}` : ''}</span>
                                          <X size={10} className="text-red-400 group-hover:hidden" />
                                          <Unlock size={10} className="text-emerald-600 hidden group-hover:inline" />
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Modern Step-to-Step Closure Flow */}
                  {(() => {
                    const morningStart = hourToTime(generalSettings.startHour || 9);
                    const morningEnd = hourToTime(generalSettings.lunchStartHour || 14);
                    const afternoonStart = hourToTime(generalSettings.lunchEndHour || 15);
                    const afternoonEnd = hourToTime(generalSettings.endHour || 18);

                    const fullDayBlock = selectedDayBlocks.find((b) => b.isFullDay !== false);
                    const matchingRangeBlock = selectedDayBlocks.find(
                      (b) =>
                        b.isFullDay === false &&
                        b.startTime === blockStart &&
                        b.endTime === blockEnd
                    );

                    const morningPresets = [
                      { label: 'Toda la Mañana', start: morningStart, end: morningEnd },
                      { label: '10:00 a 14:00', start: '10:00', end: morningEnd },
                      { label: `${morningStart} a 12:00`, start: morningStart, end: '12:00' },
                      { label: `12:00 a ${morningEnd}`, start: '12:00', end: morningEnd },
                    ];

                    const afternoonPresets = [
                      { label: 'Toda la Tarde', start: afternoonStart, end: afternoonEnd },
                      { label: `${afternoonStart} a 17:00`, start: afternoonStart, end: '17:00' },
                      { label: `16:00 a ${afternoonEnd}`, start: '16:00', end: afternoonEnd },
                    ];

                    if (closureStep === 'SECTIONS') {
                      return (
                        <div className="p-4 rounded-2xl bg-[var(--pv-marble)] border border-white space-y-3 animate-fade-in">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--pv-navy)]">
                              Selecciona la sección a cerrar
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setClosureSection('MORNING');
                                setBlockStart(preferredMorningStart);
                                setBlockEnd(preferredMorningEnd);
                                setClosureStep('HOURS');
                              }}
                              className="flex flex-col items-center justify-center gap-1.5 py-4 px-2 rounded-2xl bg-white hover:bg-amber-50/70 border border-stone-200 hover:border-amber-300 transition-all shadow-sm hover:shadow-md group"
                            >
                              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Sun size={17} />
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-wider text-[var(--pv-ink)]">
                                Mañana
                              </span>
                              <span className="text-[9px] text-stone-400 font-bold">
                                {preferredMorningStart} - {preferredMorningEnd}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setClosureSection('AFTERNOON');
                                setBlockStart(preferredAfternoonStart);
                                setBlockEnd(preferredAfternoonEnd);
                                setClosureStep('HOURS');
                              }}
                              className="flex flex-col items-center justify-center gap-1.5 py-4 px-2 rounded-2xl bg-white hover:bg-amber-50/70 border border-stone-200 hover:border-amber-300 transition-all shadow-sm hover:shadow-md group"
                            >
                              <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Sunset size={17} />
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-wider text-[var(--pv-ink)]">
                                Tarde
                              </span>
                              <span className="text-[9px] text-stone-400 font-bold">
                                {preferredAfternoonStart} - {preferredAfternoonEnd}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setClosureSection('FULL');
                                setClosureStep('HOURS');
                              }}
                              className="flex flex-col items-center justify-center gap-1.5 py-4 px-2 rounded-2xl bg-white hover:bg-red-50 border border-stone-200 hover:border-red-300 transition-all shadow-sm hover:shadow-md group"
                            >
                              <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Lock size={17} />
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-wider text-[var(--pv-ink)]">
                                Todo el Día
                              </span>
                              <span className="text-[9px] text-stone-400 font-bold">
                                Completo
                              </span>
                            </button>
                          </div>
                        </div>
                      );
                    }

                    // STEP 2: Configure Entrada/Salida hours and Save
                    return (
                      <div className="p-4 rounded-2xl bg-[var(--pv-marble)] border border-white space-y-4 animate-fade-in">
                        {/* Header with Back button */}
                        <div className="flex items-center justify-between border-b border-stone-200/70 pb-3">
                          <button
                            type="button"
                            onClick={() => setClosureStep('SECTIONS')}
                            className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[var(--pv-navy)] hover:text-[var(--pv-gold)] transition-colors"
                          >
                            <ChevronLeft size={14} /> Volver a secciones
                          </button>
                          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--pv-gold)]">
                            {closureSection === 'MORNING'
                              ? 'Cierre de Mañana'
                              : closureSection === 'AFTERNOON'
                              ? 'Cierre de Tarde'
                              : 'Cierre de Día Completo'}
                          </span>
                        </div>

                        {closureSection === 'FULL' ? (
                          <div className="space-y-3">
                            <p className="text-xs text-[var(--pv-navy)]/80 font-medium leading-relaxed">
                              {fullDayBlock
                                ? 'El día seleccionado actualmente está cerrado por completo.'
                                : 'Se cerrarán todas las citas y horarios del día seleccionado.'}
                            </p>
                            {!fullDayBlock && (
                              <div>
                                <label className="block text-[9px] font-bold uppercase text-[var(--pv-navy)] opacity-60 mb-1">
                                  Motivo (Opcional)
                                </label>
                                <input
                                  type="text"
                                  placeholder="Ej. Festivo local, formación..."
                                  value={blockReason}
                                  onChange={(e) => setBlockReason(e.target.value)}
                                  className="neo-input !py-2 !bg-white !text-xs"
                                />
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                fullDayBlock
                                  ? handleUnblock(fullDayBlock.id)
                                  : handleBlockRange(undefined, undefined, 'Día completo cerrado')
                              }
                              disabled={togglingBlock}
                              className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2 ${
                                fullDayBlock
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                  : 'bg-red-600 hover:bg-red-700 text-white'
                              }`}
                            >
                              {fullDayBlock ? (
                                <>
                                  <Unlock size={14} /> Abrir Día Completo
                                </>
                              ) : (
                                <>
                                  <Lock size={14} /> Guardar Cambios
                                </>
                              )}
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {/* Quick Presets */}
                            <div>
                              <label className="block text-[8px] font-black uppercase tracking-widest text-[var(--pv-navy)] opacity-60 mb-1.5">
                                Atajos rápidos
                              </label>
                              <div className="flex flex-wrap gap-1.5">
                                {(closureSection === 'MORNING' ? morningPresets : afternoonPresets).map(
                                  (preset) => {
                                    const isSelected =
                                      blockStart === preset.start && blockEnd === preset.end;
                                    return (
                                      <button
                                        key={preset.label}
                                        type="button"
                                        onClick={() => {
                                          if (closureSection === 'MORNING') {
                                            updateMorningClosureHours(preset.start, preset.end);
                                          } else {
                                            updateAfternoonClosureHours(preset.start, preset.end);
                                          }
                                        }}
                                        className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider border transition-all ${
                                          isSelected
                                            ? 'bg-[var(--pv-gold)] text-white border-[var(--pv-gold)] shadow-sm'
                                            : 'bg-white text-[var(--pv-navy)] border-stone-200 hover:border-[var(--pv-gold)]'
                                        }`}
                                      >
                                        {preset.label}
                                      </button>
                                    );
                                  }
                                )}
                              </div>
                            </div>

                            {/* Exact Entrada & Salida Time Pickers */}
                            <div className="grid grid-cols-2 gap-3 pt-1">
                              <div>
                                <label className="block text-[9px] font-bold uppercase text-[var(--pv-navy)] opacity-70 mb-1">
                                  Hora de Entrada
                                </label>
                                <input
                                  type="time"
                                  value={blockStart}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (closureSection === 'MORNING') {
                                      updateMorningClosureHours(val, blockEnd);
                                    } else {
                                      updateAfternoonClosureHours(val, blockEnd);
                                    }
                                  }}
                                  className="neo-input !py-2 !bg-white !text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] font-bold uppercase text-[var(--pv-navy)] opacity-70 mb-1">
                                  Hora de Salida
                                </label>
                                <input
                                  type="time"
                                  value={blockEnd}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (closureSection === 'MORNING') {
                                      updateMorningClosureHours(blockStart, val);
                                    } else {
                                      updateAfternoonClosureHours(blockStart, val);
                                    }
                                  }}
                                  className="neo-input !py-2 !bg-white !text-xs"
                                />
                              </div>
                            </div>

                            {!matchingRangeBlock && (
                              <div>
                                <label className="block text-[9px] font-bold uppercase text-[var(--pv-navy)] opacity-60 mb-1">
                                  Motivo (Opcional)
                                </label>
                                <input
                                  type="text"
                                  placeholder="Ej. Juzgado, reunión externa..."
                                  value={blockReason}
                                  onChange={(e) => setBlockReason(e.target.value)}
                                  className="neo-input !py-2 !bg-white !text-xs"
                                />
                              </div>
                            )}

                            {/* Save Changes Button */}
                            <button
                              type="button"
                              onClick={() =>
                                matchingRangeBlock
                                  ? handleUnblock(matchingRangeBlock.id)
                                  : handleBlockRange(
                                      blockStart,
                                      blockEnd,
                                      closureSection === 'MORNING'
                                        ? `Cierre Mañana (${blockStart} - ${blockEnd})`
                                        : `Cierre Tarde (${blockStart} - ${blockEnd})`
                                    )
                              }
                              disabled={
                                togglingBlock ||
                                Boolean(fullDayBlock) ||
                                !blockStart ||
                                !blockEnd ||
                                blockEnd <= blockStart
                              }
                              className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40 shadow-md flex items-center justify-center gap-2 ${
                                matchingRangeBlock
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                  : 'bg-[var(--pv-navy)] hover:bg-[var(--pv-gold)] text-white'
                              }`}
                            >
                              {togglingBlock ? (
                                'Guardando...'
                              ) : matchingRangeBlock ? (
                                <>
                                  <Unlock size={14} /> Abrir Horario ({blockStart} a {blockEnd})
                                </>
                              ) : (
                                <>
                                  <Lock size={14} /> Guardar Cambios ({blockStart} a {blockEnd})
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                /* ================= TAB 3: GESTIÓN DIRECTA DE SLOTS ================= */
                <div className="space-y-3.5 animate-fade-in">
                  {(() => {
                    const fullDayBlock = selectedDayBlocks.find((b) => b.isFullDay !== false);
                    const morningBlock = selectedDayBlocks.find((b) => {
                      if (b.isFullDay !== false) return false;
                      return (b.startTime || '') <= '09:30' && (b.endTime || '') >= '13:30';
                    });
                    const afternoonBlock = selectedDayBlocks.find((b) => {
                      if (b.isFullDay !== false) return false;
                      return (b.startTime || '') <= '15:30' && (b.endTime || '') >= '17:30';
                    });
                    const otherBlocks = selectedDayBlocks.filter((b) => {
                      if (b.isFullDay !== false) return false;
                      if (morningBlock && b.id === morningBlock.id) return false;
                      if (afternoonBlock && b.id === afternoonBlock.id) return false;
                      return true;
                    });

                    const hasRestriction = Boolean(
                      fullDayBlock || morningBlock || afternoonBlock || otherBlocks.length > 0
                    );

                    let restrictionTitle = '';
                    let restrictionColor = 'bg-amber-50 text-amber-900 border-amber-200';
                    let restrictionIcon = AlertCircle;

                    if (fullDayBlock) {
                      restrictionTitle = 'Día cerrado por completo en Cierres';
                      restrictionColor = 'bg-red-50 text-red-800 border-red-200';
                      restrictionIcon = Lock;
                    } else if (morningBlock && afternoonBlock) {
                      restrictionTitle = 'Mañana y Tarde cerradas en Cierres';
                      restrictionColor = 'bg-red-50 text-red-800 border-red-200';
                      restrictionIcon = Lock;
                    } else if (morningBlock) {
                      restrictionTitle = `Mañana cerrada (${morningBlock.startTime} a ${morningBlock.endTime}) en Cierres`;
                      restrictionColor = 'bg-amber-50 text-amber-900 border-amber-200';
                      restrictionIcon = Sunset;
                    } else if (afternoonBlock) {
                      restrictionTitle = `Tarde cerrada (${afternoonBlock.startTime} a ${afternoonBlock.endTime}) en Cierres`;
                      restrictionColor = 'bg-amber-50 text-amber-900 border-amber-200';
                      restrictionIcon = Sun;
                    } else if (otherBlocks.length > 0) {
                      restrictionTitle = 'Tramos horarios cerrados en Cierres';
                      restrictionColor = 'bg-sky-50 text-sky-900 border-sky-200';
                      restrictionIcon = Clock;
                    }

                    // Schedule Times
                    const sMin = timeToMinutes(scheduleForm.startTime || '09:00');
                    const eMin = timeToMinutes(scheduleForm.endTime || '18:00');
                    const lStart =
                      scheduleForm.lunchStartTime && scheduleForm.lunchEndTime
                        ? timeToMinutes(scheduleForm.lunchStartTime)
                        : null;
                    const lEnd =
                      scheduleForm.lunchStartTime && scheduleForm.lunchEndTime
                        ? timeToMinutes(scheduleForm.lunchEndTime)
                        : null;
                    const lDuration = lStart !== null && lEnd !== null && lEnd > lStart ? lEnd - lStart : 0;
                    const totalAvailMinutes = Math.max(15, eMin - sMin - lDuration);

                    // Mode Detection
                    const isMorningOnly =
                      scheduleForm.startTime === '09:00' &&
                      scheduleForm.endTime === '14:00' &&
                      !scheduleForm.lunchStartTime &&
                      !scheduleForm.lunchEndTime;
                    const isAfternoonOnly =
                      scheduleForm.startTime === '15:00' &&
                      scheduleForm.endTime === '18:00' &&
                      !scheduleForm.lunchStartTime &&
                      !scheduleForm.lunchEndTime;
                    const isFullStandard =
                      scheduleForm.startTime === '09:00' &&
                      scheduleForm.endTime === '18:00' &&
                      scheduleForm.lunchStartTime === '14:00' &&
                      scheduleForm.lunchEndTime === '15:00';

                    // Automatic calculation of minutes per slot (supports down to 5 min)
                    const computedMins = Math.max(5, Math.floor(totalAvailMinutes / slotsCount));

                    // Generate slots for preview
                    const duration = Number(scheduleForm.slotDurationMin) || computedMins;
                    const slots: {
                      time: string;
                      endTime: string;
                      status: 'available' | 'booked' | 'blocked';
                      clientName?: string;
                      blockId?: string;
                      section: 'morning' | 'afternoon';
                    }[] = [];

                    if (!fullDayBlock && duration > 0 && eMin > sMin) {
                      if (lStart !== null && lEnd !== null && lEnd > lStart) {
                        // Morning slots
                        for (let t = sMin; t + duration <= lStart; t += duration) {
                          const timeStr = minutesToTime(t);
                          const slotEndStr = minutesToTime(t + duration);
                          const matchingBlock = selectedDayBlocks.find((b) => {
                            if (b.isFullDay !== false) return true;
                            if (!b.startTime || !b.endTime) return false;
                            return t < timeToMinutes(b.endTime) && (t + duration) > timeToMinutes(b.startTime);
                          });

                          if (matchingBlock) {
                            slots.push({
                              time: timeStr,
                              endTime: slotEndStr,
                              status: 'blocked',
                              blockId: matchingBlock.id,
                              section: 'morning',
                            });
                            continue;
                          }
                          const booked = selectedDayAppointments.find(
                            (a) => a.startTime === timeStr && a.status !== 'CANCELLED'
                          );
                          if (booked) {
                            slots.push({
                              time: timeStr,
                              endTime: slotEndStr,
                              status: 'booked',
                              clientName: booked.clientName,
                              section: 'morning',
                            });
                            continue;
                          }
                          slots.push({
                            time: timeStr,
                            endTime: slotEndStr,
                            status: 'available',
                            section: 'morning',
                          });
                        }
                        // Afternoon slots
                        for (let t = lEnd; t + duration <= eMin; t += duration) {
                          const timeStr = minutesToTime(t);
                          const slotEndStr = minutesToTime(t + duration);
                          const matchingBlock = selectedDayBlocks.find((b) => {
                            if (b.isFullDay !== false) return true;
                            if (!b.startTime || !b.endTime) return false;
                            return t < timeToMinutes(b.endTime) && (t + duration) > timeToMinutes(b.startTime);
                          });

                          if (matchingBlock) {
                            slots.push({
                              time: timeStr,
                              endTime: slotEndStr,
                              status: 'blocked',
                              blockId: matchingBlock.id,
                              section: 'afternoon',
                            });
                            continue;
                          }
                          const booked = selectedDayAppointments.find(
                            (a) => a.startTime === timeStr && a.status !== 'CANCELLED'
                          );
                          if (booked) {
                            slots.push({
                              time: timeStr,
                              endTime: slotEndStr,
                              status: 'booked',
                              clientName: booked.clientName,
                              section: 'afternoon',
                            });
                            continue;
                          }
                          slots.push({
                            time: timeStr,
                            endTime: slotEndStr,
                            status: 'available',
                            section: 'afternoon',
                          });
                        }
                      } else {
                        for (let t = sMin; t + duration <= eMin; t += duration) {
                          const timeStr = minutesToTime(t);
                          const slotEndStr = minutesToTime(t + duration);
                          const matchingBlock = selectedDayBlocks.find((b) => {
                            if (b.isFullDay !== false) return true;
                            if (!b.startTime || !b.endTime) return false;
                            return t < timeToMinutes(b.endTime) && (t + duration) > timeToMinutes(b.startTime);
                          });

                          if (matchingBlock) {
                            slots.push({
                              time: timeStr,
                              endTime: slotEndStr,
                              status: 'blocked',
                              blockId: matchingBlock.id,
                              section: 'morning',
                            });
                            continue;
                          }
                          const booked = selectedDayAppointments.find(
                            (a) => a.startTime === timeStr && a.status !== 'CANCELLED'
                          );
                          if (booked) {
                            slots.push({
                              time: timeStr,
                              endTime: slotEndStr,
                              status: 'booked',
                              clientName: booked.clientName,
                              section: 'morning',
                            });
                            continue;
                          }
                          slots.push({
                            time: timeStr,
                            endTime: slotEndStr,
                            status: 'available',
                            section: 'morning',
                          });
                        }
                      }
                    }

                    const morningSlots = slots.filter((s) => s.section === 'morning');
                    const afternoonSlots = slots.filter((s) => s.section === 'afternoon');
                    const availableSlotsCount = slots.filter((s) => s.status === 'available').length;
                    const bookedSlotsCount = slots.filter((s) => s.status === 'booked').length;
                    const blockedSlotsCount = slots.filter((s) => s.status === 'blocked').length;

                    const RestrictionIcon = restrictionIcon;

                    return (
                      <div className="space-y-3.5">
                        {/* Notice only if there is a real restriction in Cierres */}
                        {hasRestriction && (
                          <div
                            className={`p-3 rounded-2xl border flex items-center justify-between gap-3 shadow-sm ${restrictionColor}`}
                          >
                            <div className="flex items-center gap-2 text-[10px] font-bold">
                              <RestrictionIcon size={14} className="shrink-0" />
                              <span>{restrictionTitle}</span>
                            </div>
                            {fullDayBlock && (
                              <button
                                type="button"
                                onClick={() => setActiveTab('cierres')}
                                className="text-[9px] font-black uppercase tracking-wider underline hover:opacity-80 shrink-0"
                              >
                                Abrir en Cierres →
                              </button>
                            )}
                          </div>
                        )}

                        {/* 1. Turno del Día */}
                        <div className="p-3.5 rounded-2xl bg-[var(--pv-marble)] border border-white space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black uppercase tracking-widest text-[var(--pv-navy)]">
                              Turno del Día
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-bold text-stone-400">
                                {scheduleForm.startTime} - {scheduleForm.endTime} ({Math.round(totalAvailMinutes / 60)}h)
                              </span>
                              {selectedSchedule && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSchedule(selectedSchedule.id)}
                                  className="text-[9px] font-black uppercase tracking-wider text-red-600 hover:text-red-700 underline"
                                  title="Restaurar al horario base de la oficina"
                                >
                                  Restaurar
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                const newForm = {
                                  startTime: '09:00',
                                  lunchStartTime: '14:00',
                                  lunchEndTime: '15:00',
                                  endTime: '18:00',
                                };
                                updateSlotsCount(slotsCount, newForm);
                              }}
                              className={`py-2 px-2 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all text-center ${
                                isFullStandard
                                  ? 'bg-[var(--pv-gold)] text-white border-[var(--pv-gold)] shadow-sm'
                                  : 'bg-white text-[var(--pv-navy)] border-stone-200 hover:border-[var(--pv-gold)]'
                              }`}
                            >
                              Jornada Completa
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const newForm = {
                                  startTime: '09:00',
                                  lunchStartTime: '',
                                  lunchEndTime: '',
                                  endTime: '14:00',
                                };
                                updateSlotsCount(slotsCount, newForm);
                              }}
                              className={`py-2 px-2 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all text-center ${
                                isMorningOnly
                                  ? 'bg-[var(--pv-gold)] text-white border-[var(--pv-gold)] shadow-sm'
                                  : 'bg-white text-[var(--pv-navy)] border-stone-200 hover:border-[var(--pv-gold)]'
                              }`}
                            >
                              Solo Mañana
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const newForm = {
                                  startTime: '15:00',
                                  lunchStartTime: '',
                                  lunchEndTime: '',
                                  endTime: '18:00',
                                };
                                updateSlotsCount(slotsCount, newForm);
                              }}
                              className={`py-2 px-2 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all text-center ${
                                isAfternoonOnly
                                  ? 'bg-[var(--pv-gold)] text-white border-[var(--pv-gold)] shadow-sm'
                                  : 'bg-white text-[var(--pv-navy)] border-stone-200 hover:border-[var(--pv-gold)]'
                              }`}
                            >
                              Solo Tarde
                            </button>
                          </div>
                        </div>

                        {/* 2. CONTROLADOR DIRECTO DE SLOTS */}
                        <div className="p-4 rounded-2xl bg-[var(--pv-marble)] border border-white space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--pv-gold)]">
                              Slots de Citas
                            </span>
                            <span className="text-[10px] font-bold text-stone-600 bg-white px-2 py-0.5 rounded-md border border-stone-200 shadow-2xs">
                              {computedMins} min por cita
                            </span>
                          </div>

                          {/* Stepper Gigante e Intuitivo */}
                          <div className="flex items-center justify-center gap-5 py-1">
                            <button
                              type="button"
                              onClick={() => updateSlotsCount(slotsCount - 1)}
                              disabled={slotsCount <= 1}
                              className="w-12 h-12 rounded-2xl bg-white border border-stone-200 text-stone-700 text-2xl font-black hover:border-[var(--pv-gold)] hover:text-[var(--pv-gold)] shadow-sm active:scale-95 transition-all flex items-center justify-center disabled:opacity-30"
                            >
                              -
                            </button>

                            <div className="text-center min-w-[130px]">
                              <span className="text-4xl font-black text-[var(--pv-navy)] tracking-tight">
                                {slotsCount}
                              </span>
                              <span className="block text-[10px] font-black uppercase tracking-widest text-[var(--pv-gold)] mt-0.5">
                                {slotsCount === 1 ? 'Slot (Cita)' : 'Slots (Citas)'}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => updateSlotsCount(slotsCount + 1)}
                              disabled={slotsCount >= 96}
                              className="w-12 h-12 rounded-2xl bg-white border border-stone-200 text-stone-700 text-2xl font-black hover:border-[var(--pv-gold)] hover:text-[var(--pv-gold)] shadow-sm active:scale-95 transition-all flex items-center justify-center disabled:opacity-30"
                            >
                              +
                            </button>
                          </div>

                          {/* Presets Rápidos por Cantidad de Slots */}
                          <div className="flex items-center justify-center flex-wrap gap-1.5 pt-1">
                            {[4, 6, 8, 10, 12, 16, 24].map((num) => (
                              <button
                                key={num}
                                type="button"
                                onClick={() => updateSlotsCount(num)}
                                className={`px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all ${
                                  slotsCount === num
                                    ? 'bg-[var(--pv-navy)] text-white border-[var(--pv-navy)] shadow-sm'
                                    : 'bg-white text-[var(--pv-navy)] border-stone-200 hover:border-[var(--pv-gold)]'
                                }`}
                              >
                                {num} slots
                              </button>
                            ))}
                          </div>

                          {/* Atajos Directos por Duración (5 min, 10 min, etc.) */}
                          <div className="pt-2 border-t border-stone-200/60 flex items-center justify-center flex-wrap gap-1.5">
                            <span className="text-[8px] font-black uppercase tracking-widest text-[var(--pv-navy)] opacity-50 mr-0.5">
                              Duración:
                            </span>
                            {[5, 10, 15, 20, 30, 45, 60].map((mins) => {
                              const isCurrent = computedMins === mins;
                              return (
                                <button
                                  key={mins}
                                  type="button"
                                  onClick={() => setSlotDurationDirect(mins)}
                                  className={`px-2 py-1 rounded-lg text-[9px] font-bold border transition-all ${
                                    isCurrent
                                      ? 'bg-[var(--pv-gold)] text-white border-[var(--pv-gold)] shadow-sm'
                                      : 'bg-white text-[var(--pv-navy)]/80 border-stone-200 hover:border-[var(--pv-gold)]'
                                  }`}
                                >
                                  {mins}m
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* 3. Previsualización de los Espacios (Slots) */}
                        <div className="p-3.5 rounded-2xl bg-white border border-stone-200/80 shadow-sm space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--pv-ink)] flex items-center gap-1.5">
                                <CalendarCheck size={13} className="text-[var(--pv-gold)]" /> Espacios ({slots.length})
                              </span>
                              <span className="block text-[8px] text-[var(--pv-navy)] opacity-60 mt-0.5">
                                Pulsa en cualquier hora para cerrarla u omitirla de la agenda.
                              </span>
                            </div>
                            <div className="flex items-center gap-2.5 text-[9px] font-bold">
                              <span className="text-emerald-700">
                                {availableSlotsCount} libres
                              </span>
                              {bookedSlotsCount > 0 && (
                                <span className="text-[var(--pv-gold)]">
                                  {bookedSlotsCount} ocupadas
                                </span>
                              )}
                              {blockedSlotsCount > 0 && (
                                <span className="text-red-500">
                                  {blockedSlotsCount} cerrados
                                </span>
                              )}
                            </div>
                          </div>

                          {fullDayBlock ? (
                            <div className="py-6 text-center text-xs text-red-600 font-bold bg-red-50/50 rounded-xl border border-red-100">
                              Día completamente cerrado en Cierres.
                            </div>
                          ) : slots.length === 0 ? (
                            <div className="py-6 text-center text-xs text-stone-400 italic bg-[var(--pv-marble)]/50 rounded-xl">
                              No hay espacios configurados para este día.
                            </div>
                          ) : (
                            <div className="space-y-2.5">
                              {/* Mañana */}
                              <div>
                                <div className="text-[9px] font-black uppercase tracking-wider text-[var(--pv-navy)]/60 mb-1.5 flex items-center gap-1">
                                  <Sun size={10} className="text-[var(--pv-gold)]" /> Mañana ({morningSlots.length} citas de {computedMins} min)
                                </div>
                                {morningSlots.length === 0 ? (
                                  <p className="text-[10px] text-stone-400 italic">Sin cupos en la mañana</p>
                                ) : (
                                  <div className="flex flex-wrap gap-1.5">
                                    {morningSlots.map((slot) => (
                                      <button
                                        key={slot.time}
                                        type="button"
                                        disabled={togglingBlock || slot.status === 'booked' || Boolean(fullDayBlock)}
                                        onClick={() => {
                                          if (slot.status === 'blocked' && slot.blockId) {
                                            handleUnblock(slot.blockId);
                                          } else if (slot.status === 'available') {
                                            handleBlockRange(slot.time, slot.endTime, `Cierre horario ${slot.time}-${slot.endTime}`);
                                          }
                                        }}
                                        title={
                                          slot.clientName
                                            ? `Reservado por: ${slot.clientName}`
                                            : slot.status === 'blocked'
                                            ? `Cerrada (${slot.time} a ${slot.endTime}). Clic para volver a abrir`
                                            : `Disponible (${slot.time} a ${slot.endTime}). Clic para omitir/cerrar esta cita`
                                        }
                                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95 disabled:cursor-not-allowed ${
                                          slot.status === 'booked'
                                            ? 'bg-[var(--pv-gold)] text-white shadow-sm'
                                            : slot.status === 'blocked'
                                            ? 'bg-red-50 text-red-500 line-through opacity-80 border border-red-200 hover:bg-red-100 hover:text-red-700'
                                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300'
                                        }`}
                                      >
                                        {slot.time}
                                        {slot.status === 'booked' && (
                                          <span className="text-[8px] opacity-90 truncate max-w-[65px]">
                                            · {slot.clientName?.split(' ')[0]}
                                          </span>
                                        )}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Tarde */}
                              <div className="pt-2 border-t border-stone-100">
                                <div className="text-[9px] font-black uppercase tracking-wider text-[var(--pv-navy)]/60 mb-1.5 flex items-center gap-1">
                                  <Sunset size={10} className="text-[var(--pv-gold)]" /> Tarde ({afternoonSlots.length} citas de {computedMins} min)
                                </div>
                                {afternoonSlots.length === 0 ? (
                                  <p className="text-[10px] text-stone-400 italic">Sin cupos en la tarde</p>
                                ) : (
                                  <div className="flex flex-wrap gap-1.5">
                                    {afternoonSlots.map((slot) => (
                                      <button
                                        key={slot.time}
                                        type="button"
                                        disabled={togglingBlock || slot.status === 'booked' || Boolean(fullDayBlock)}
                                        onClick={() => {
                                          if (slot.status === 'blocked' && slot.blockId) {
                                            handleUnblock(slot.blockId);
                                          } else if (slot.status === 'available') {
                                            handleBlockRange(slot.time, slot.endTime, `Cierre horario ${slot.time}-${slot.endTime}`);
                                          }
                                        }}
                                        title={
                                          slot.clientName
                                            ? `Reservado por: ${slot.clientName}`
                                            : slot.status === 'blocked'
                                            ? `Cerrada (${slot.time} a ${slot.endTime}). Clic para volver a abrir`
                                            : `Disponible (${slot.time} a ${slot.endTime}). Clic para omitir/cerrar esta cita`
                                        }
                                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95 disabled:cursor-not-allowed ${
                                          slot.status === 'booked'
                                            ? 'bg-[var(--pv-gold)] text-white shadow-sm'
                                            : slot.status === 'blocked'
                                            ? 'bg-red-50 text-red-500 line-through opacity-80 border border-red-200 hover:bg-red-100 hover:text-red-700'
                                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300'
                                        }`}
                                      >
                                        {slot.time}
                                        {slot.status === 'booked' && (
                                          <span className="text-[8px] opacity-90 truncate max-w-[65px]">
                                            · {slot.clientName?.split(' ')[0]}
                                          </span>
                                        )}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 4. Modalidad Permitida (Discreta) */}
                        <div className="p-3 rounded-2xl bg-[var(--pv-marble)] border border-white flex items-center justify-between gap-3">
                          <label className="text-[9px] font-black text-[var(--pv-navy)] uppercase tracking-wider shrink-0">
                            Modalidad:
                          </label>
                          <select
                            className="neo-input !py-1.5 !bg-white !text-xs flex-1"
                            value={scheduleForm.allowedModality}
                            onChange={(e) =>
                              setScheduleForm({ ...scheduleForm, allowedModality: e.target.value })
                            }
                          >
                            <option value="">Cualquiera (Despacho y Videollamada)</option>
                            <option value="OFFICE">Solo En Despacho</option>
                            <option value="VIDEO_CALL">Solo Videollamada</option>
                          </select>
                        </div>

                        {/* 5. Botón de Guardado */}
                        <button
                          type="button"
                          onClick={handleSaveSchedule}
                          disabled={scheduleSaving || Boolean(fullDayBlock)}
                          className="w-full btn-roman !py-3.5 !text-[10px] !uppercase !tracking-[0.2em] flex items-center justify-center gap-2 shadow-lg disabled:opacity-40"
                        >
                          <Save size={14} />
                          {scheduleSaving ? 'Guardando...' : `Guardar Jornada (${slotsCount} slots · ${computedMins} min)`}
                        </button>

                        {scheduleMessage && (
                          <p className="text-center text-[10px] font-bold text-emerald-600 animate-pulse">
                            {scheduleMessage}
                          </p>
                        )}
                      </div>
                    );
                  })()}
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
