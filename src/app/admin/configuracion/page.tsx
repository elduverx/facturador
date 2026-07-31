'use client';

import { useState, useEffect } from 'react';
import { DAYS_OF_WEEK_FULL, MONTHS } from '@/lib/constants';
import { 
  Settings as SettingsIcon, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Save, 
  Trash2, 
  AlertCircle,
  Hash,
  Lock,
  Unlock
} from 'lucide-react';

interface Settings {
  firmName: string;
  firmEmail: string;
  firmPhone: string;
  firmAddress: string;
  startHour: number;
  endHour: number;
  slotDurationMin: number;
  lunchStartHour: number;
  lunchEndHour: number;
  workDays: number[];
  maxAppointmentsPerDay: number;
}

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

export default function ConfiguracionPage() {
  const [settings, setSettings] = useState<Settings>({
    firmName: 'PV Abogadas',
    firmEmail: '',
    firmPhone: '',
    firmAddress: '',
    startHour: 9,
    endHour: 18,
    slotDurationMin: 30,
    lunchStartHour: 14,
    lunchEndHour: 15,
    workDays: [1, 2, 3, 4, 5],
    maxAppointmentsPerDay: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [daySchedules, setDaySchedules] = useState<DaySchedule[]>([]);
  const [blockedDates, setBlockedDates] = useState<any[]>([]);
  const [togglingBlock, setTogglingBlock] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    date: '',
    startTime: '09:00',
    endTime: '14:00',
    lunchStartTime: '',
    lunchEndTime: '',
    maxAppointmentsPerDay: '',
    slotDurationMin: '',
    allowedModality: '',
  });
  const [scheduleMessage, setScheduleMessage] = useState('');
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((data) => {
        setSettings({
          firmName: data.firmName || 'PV Abogadas',
          firmEmail: data.firmEmail || '',
          firmPhone: data.firmPhone || '',
          firmAddress: data.firmAddress || '',
          startHour: data.startHour ?? 9,
          endHour: data.endHour ?? 18,
          slotDurationMin: data.slotDurationMin ?? 30,
          lunchStartHour: data.lunchStartHour ?? 14,
          lunchEndHour: data.lunchEndHour ?? 15,
          workDays: Array.isArray(data.workDays) ? data.workDays : [1, 2, 3, 4, 5],
          maxAppointmentsPerDay: data.maxAppointmentsPerDay ?? 0,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    loadDaySchedules();
  }, []);

  const loadDaySchedules = async () => {
    try {
      const [resSchedules, resBlocked] = await Promise.all([
        fetch('/api/admin/day-schedules'),
        fetch('/api/admin/blocked-dates')
      ]);
      const data = await resSchedules.json();
      setDaySchedules(Array.isArray(data) ? data : []);
      const blocked = await resBlocked.json();
      setBlockedDates(Array.isArray(blocked) ? blocked : []);
    } catch {
      setDaySchedules([]);
      setBlockedDates([]);
    }
  };

  const toggleBlockDay = async () => {
    if (!selectedDate) return;
    setTogglingBlock(true);
    try {
      const existingBlock = blockedDates.find(b => b.date.startsWith(selectedDate));
      if (existingBlock) {
        await fetch(`/api/admin/blocked-dates?id=${existingBlock.id}`, { method: 'DELETE' });
      } else {
        await fetch(`/api/admin/blocked-dates`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: selectedDate, reason: 'Cerrado por administrador desde ajustes' })
        });
      }
      await loadDaySchedules();
    } catch (e) {
      console.error(e);
    } finally {
      setTogglingBlock(false);
    }
  };

  useEffect(() => {
    if (!selectedDate) return;
    setScheduleMessage('');
    const schedule = getScheduleForDate(selectedDate);
    if (schedule) {
      setScheduleForm({
        date: selectedDate,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        lunchStartTime: schedule.lunchStartTime || '',
        lunchEndTime: schedule.lunchEndTime || '',
        maxAppointmentsPerDay: schedule.maxAppointmentsPerDay === null ? '' : String(schedule.maxAppointmentsPerDay),
        slotDurationMin: schedule.slotDurationMin === null ? '' : String(schedule.slotDurationMin),
        allowedModality: schedule.allowedModality || '',
      });
    } else {
      const hasLunch = settings.lunchStartHour < settings.lunchEndHour;
      setScheduleForm({
        date: selectedDate,
        startTime: hourToTime(settings.startHour),
        endTime: hourToTime(settings.endHour),
        lunchStartTime: hasLunch ? hourToTime(settings.lunchStartHour) : '',
        lunchEndTime: hasLunch ? hourToTime(settings.lunchEndHour) : '',
        maxAppointmentsPerDay: '',
        slotDurationMin: '',
        allowedModality: '',
      });
    }
  }, [
    selectedDate,
    daySchedules,
    settings.startHour,
    settings.endHour,
    settings.lunchStartHour,
    settings.lunchEndHour,
  ]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error guardando:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleWorkDay = (day: number) => {
    setSettings((prev) => ({
      ...prev,
      workDays: prev.workDays.includes(day)
        ? prev.workDays.filter((d) => d !== day)
        : [...prev.workDays, day].sort(),
    }));
  };

  const pad2 = (value: number) => value.toString().padStart(2, '0');
  const hourToTime = (hour: number) => `${pad2(hour)}:00`;
  const getScheduleForDate = (dateStr: string) =>
    daySchedules.find((schedule) => schedule.date.split('T')[0] === dateStr);

  const estimateAutoSlot = () => {
    const { startTime, endTime, lunchStartTime, lunchEndTime, maxAppointmentsPerDay } = scheduleForm;
    const cupos = Number(maxAppointmentsPerDay);
    if (!startTime || !endTime || !cupos || cupos <= 0) return null;

    const toMinutes = (time: string) => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    };

    const start = toMinutes(startTime);
    const end = toMinutes(endTime);
    if (end <= start) return null;

    let available = end - start;
    if (lunchStartTime && lunchEndTime) {
      const lunchStart = toMinutes(lunchStartTime);
      const lunchEnd = toMinutes(lunchEndTime);
      if (lunchEnd > lunchStart) {
        available -= (lunchEnd - lunchStart);
      }
    }

    if (available <= 0) return null;
    return Math.max(1, Math.floor(available / cupos));
  };

  const handleSaveSchedule = async () => {
    if (!selectedDate) {
      setScheduleMessage('Seleccione un día.');
      return;
    }
    setScheduleSaving(true);
    setScheduleMessage('');
    try {
      const payload = {
        date: selectedDate,
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
      await loadDaySchedules();
      setScheduleMessage('Jornada guardada.');
      setTimeout(() => setScheduleMessage(''), 3000);
    } catch {
      setScheduleMessage('No se pudo guardar.');
    } finally {
      setScheduleSaving(false);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm('¿Eliminar esta jornada personalizada?')) return;
    try {
      const res = await fetch(`/api/admin/day-schedules/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      await loadDaySchedules();
      setSelectedDate(null);
    } catch {
      alert('Error al eliminar.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-[var(--pv-gold)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const adjustedFirst = firstDay === 0 ? 6 : firstDay - 1;
  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < adjustedFirst; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);
  const weekDays = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
  const todayStr = today.toISOString().split('T')[0];
  const selectedSchedule = selectedDate ? getScheduleForDate(selectedDate) : null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-roman uppercase text-[var(--pv-ink)] tracking-tight">Ajustes</h1>
          <p className="text-sm text-[var(--pv-navy)] opacity-60">Configura datos del despacho, horarios y disponibilidad.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-roman px-8 py-3.5 shadow-xl shadow-[var(--pv-gold)]/20"
        >
          {saving ? 'Guardando...' : saved ? <><Check size={18} /> Guardado</> : <><Save size={18} /> Guardar cambios</>}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="space-y-8">
          {/* Firm Identity */}
          <section className="neo-card !p-4 lg:!p-6 border-l-8 border-l-[var(--pv-gold)]">
             <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-[var(--pv-gold)] text-white rounded-2xl shadow-lg">
                   <Building2 size={24} />
                </div>
                <div>
                   <h2 className="font-bold font-roman uppercase text-[var(--pv-ink)]">Datos del despacho</h2>
                   <p className="text-[10px] font-bold text-[var(--pv-gold)] uppercase tracking-widest">Información pública</p>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[var(--pv-gold)] uppercase tracking-widest ml-4">Nombre de la Firma</label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--pv-gold)]" size={16} />
                    <input className="neo-input pl-12" value={settings.firmName} onChange={(e) => setSettings({ ...settings, firmName: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[var(--pv-gold)] uppercase tracking-widest ml-4">Email de Notificaciones</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--pv-gold)]" size={16} />
                    <input className="neo-input pl-12" value={settings.firmEmail} onChange={(e) => setSettings({ ...settings, firmEmail: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[var(--pv-gold)] uppercase tracking-widest ml-4">Teléfono de Contacto</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--pv-gold)]" size={16} />
                    <input className="neo-input pl-12" value={settings.firmPhone} onChange={(e) => setSettings({ ...settings, firmPhone: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[var(--pv-gold)] uppercase tracking-widest ml-4">Dirección Sede Central</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--pv-gold)]" size={16} />
                    <input className="neo-input pl-12" value={settings.firmAddress} onChange={(e) => setSettings({ ...settings, firmAddress: e.target.value })} />
                  </div>
                </div>
             </div>
          </section>

          {/* Time & Scheduling */}
          <section className="neo-card !p-4 lg:!p-6">
             <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-[var(--pv-navy)] text-white rounded-2xl shadow-lg">
                   <Clock size={24} />
                </div>
                <div>
                   <h2 className="font-bold font-roman uppercase text-[var(--pv-ink)]">Horarios</h2>
                   <p className="text-[10px] font-bold text-[var(--pv-gold)] uppercase tracking-widest">Disponibilidad general</p>
                </div>
             </div>

             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="space-y-1">
                   <label className="text-[9px] font-bold text-[var(--pv-gold)] uppercase tracking-widest ml-2">Apertura</label>
                   <select className="neo-input !py-2 !text-xs bg-white" value={settings.startHour} onChange={(e) => setSettings({ ...settings, startHour: parseInt(e.target.value) })}>
                    {Array.from({ length: 14 }, (_, i) => i + 6).map((h) => (
                      <option key={h} value={h}>{h.toString().padStart(2, '0')}:00</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                   <label className="text-[9px] font-bold text-[var(--pv-gold)] uppercase tracking-widest ml-2">Cierre</label>
                   <select className="neo-input !py-2 !text-xs bg-white" value={settings.endHour} onChange={(e) => setSettings({ ...settings, endHour: parseInt(e.target.value) })}>
                    {Array.from({ length: 14 }, (_, i) => i + 10).map((h) => (
                      <option key={h} value={h}>{h.toString().padStart(2, '0')}:00</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                   <label className="text-[9px] font-bold text-[var(--pv-gold)] uppercase tracking-widest ml-2">Pausa (Inicio)</label>
                   <select className="neo-input !py-2 !text-xs bg-white" value={settings.lunchStartHour} onChange={(e) => setSettings({ ...settings, lunchStartHour: parseInt(e.target.value) })}>
                    {Array.from({ length: 8 }, (_, i) => i + 12).map((h) => (
                      <option key={h} value={h}>{h.toString().padStart(2, '0')}:00</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                   <label className="text-[9px] font-bold text-[var(--pv-gold)] uppercase tracking-widest ml-2">Pausa (Fin)</label>
                   <select className="neo-input !py-2 !text-xs bg-white" value={settings.lunchEndHour} onChange={(e) => setSettings({ ...settings, lunchEndHour: parseInt(e.target.value) })}>
                    {Array.from({ length: 8 }, (_, i) => i + 12).map((h) => (
                      <option key={h} value={h}>{h.toString().padStart(2, '0')}:00</option>
                    ))}
                  </select>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[var(--pv-gold)] uppercase tracking-widest ml-4">Duración del Slot (Min)</label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--pv-gold)]" size={16} />
                    <input type="number" className="neo-input pl-12" value={settings.slotDurationMin} onChange={(e) => setSettings({ ...settings, slotDurationMin: Number(e.target.value) })} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[var(--pv-gold)] uppercase tracking-widest ml-4">Máx. Citas Diarias (0 = s/l)</label>
                  <div className="relative">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--pv-gold)]" size={16} />
                    <input type="number" className="neo-input pl-12" value={settings.maxAppointmentsPerDay} onChange={(e) => setSettings({ ...settings, maxAppointmentsPerDay: Number(e.target.value) })} />
                  </div>
                </div>
             </div>

             <div className="mt-8 space-y-4">
                <label className="text-[10px] font-bold text-[var(--pv-gold)] uppercase tracking-widest ml-4">Días laborables</label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK_FULL.map((dayName, index) => (
                    <button
                      key={index}
                      onClick={() => toggleWorkDay(index)}
                      className={`px-5 py-2.5 rounded-xl text-xs font-bold border transition-all duration-300 ${
                        settings.workDays.includes(index)
                          ? 'bg-[var(--pv-gold)] text-white border-[var(--pv-gold)] shadow-lg shadow-[var(--pv-gold)]/20'
                          : 'bg-white text-[var(--pv-navy)] border-white/50 hover:border-[var(--pv-gold)]'
                      }`}
                    >
                      {dayName}
                    </button>
                  ))}
                </div>
             </div>
          </section>
        </div>

        {/* Custom Day Overrides */}
        <div className="space-y-8">
           <section className="neo-card !p-4 lg:!p-6 h-full">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-[var(--pv-gold)] text-white rounded-2xl shadow-lg">
                   <CalendarIcon size={24} />
                </div>
                <div>
                   <h2 className="font-bold font-roman uppercase text-[var(--pv-ink)]">Excepciones de Jornada</h2>
                   <p className="text-[10px] font-bold text-[var(--pv-gold)] uppercase tracking-widest">Personalización por Día</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-6">
                    <div className="flex items-center justify-between mb-4">
                      <button onClick={() => setCurrentMonth(prev => prev === 0 ? 11 : prev - 1)} className="p-2 rounded-xl bg-[var(--pv-marble)] hover:bg-stone-200 transition-all text-[var(--pv-gold)]"><ChevronLeft size={18} /></button>
                      <div className="font-roman font-bold uppercase tracking-widest text-[var(--pv-ink)] text-sm">{MONTHS[currentMonth]} {currentYear}</div>
                      <button onClick={() => setCurrentMonth(prev => prev === 11 ? 0 : prev + 1)} className="p-2 rounded-xl bg-[var(--pv-marble)] hover:bg-stone-200 transition-all text-[var(--pv-gold)]"><ChevronRight size={18} /></button>
                    </div>

                    <div className="grid grid-cols-7 gap-2">
                      {weekDays.map(d => <div key={d} className="text-[9px] font-black text-[var(--pv-gold)] text-center uppercase mb-2">{d}</div>)}
                      {calendarCells.map((day, idx) => {
                        if (!day) return <div key={`empty-${idx}`} className="aspect-square opacity-20 bg-[var(--pv-marble)] rounded-lg" />;
                        const dateStr = `${currentYear}-${pad2(currentMonth + 1)}-${pad2(day)}`;
                        const isSelected = selectedDate === dateStr;
                        const hasOverride = !!getScheduleForDate(dateStr);
                        const isBlocked = blockedDates.some(b => b.date.startsWith(dateStr));
                        return (
                          <button
                            key={dateStr}
                            onClick={() => setSelectedDate(dateStr)}
                            className={`aspect-square rounded-xl text-xs font-bold transition-all relative ${
                              isSelected ? 'bg-[var(--pv-gold)] text-white shadow-lg' : isBlocked ? 'bg-red-50/50 border border-red-100 text-red-300' : hasOverride ? 'bg-[var(--pv-gold)]/10 text-[var(--pv-gold)] border border-[var(--pv-gold)]/20' : 'bg-white border border-white/50 hover:border-[var(--pv-gold)]'
                            }`}
                          >
                            {isBlocked && <Lock size={10} className="absolute top-1 right-1 opacity-50 text-red-400" />}
                            {day}
                            {hasOverride && !isSelected && !isBlocked && <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-[var(--pv-gold)] rounded-full"></span>}
                          </button>
                        );
                      })}
                    </div>
                 </div>

                 <div className="p-6 rounded-2xl bg-[var(--pv-marble)] shadow-inner border border-white space-y-5">
                    <div className="flex justify-between items-start">
                       <h3 className="text-xs font-black uppercase text-[var(--pv-gold)] tracking-[0.2em]">Configurar Fecha</h3>
                       {selectedSchedule && <button onClick={() => handleDeleteSchedule(selectedSchedule.id)} className="text-red-500 hover:text-red-700 transition-all"><Trash2 size={16} /></button>}
                    </div>
                    
                    {!selectedDate ? (
                       <div className="py-20 text-center">
                          <p className="text-[10px] font-bold text-[var(--pv-navy)] opacity-30 uppercase tracking-widest">Selecciona un día</p>
                       </div>
                    ) : (
                      <div className="space-y-4 animate-fade-in">
                        <div className="flex items-center justify-between mb-4">
                          <div className="text-sm font-bold text-[var(--pv-ink)]">{selectedDate}</div>
                          <button
                            onClick={toggleBlockDay}
                            disabled={togglingBlock}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                              blockedDates.some(b => b.date.startsWith(selectedDate))
                                ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'
                                : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                            }`}
                          >
                            {togglingBlock ? '...' : blockedDates.some(b => b.date.startsWith(selectedDate)) ? <><Unlock size={12} /> Abrir Día</> : <><Lock size={12} /> Cerrar Día</>}
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1">
                             <label className="text-[9px] font-bold text-[var(--pv-gold)] uppercase tracking-widest ml-2">Cupos</label>
                             <input type="number" className="neo-input !py-2 !bg-white !text-xs" value={scheduleForm.maxAppointmentsPerDay} onChange={e => setScheduleForm({...scheduleForm, maxAppointmentsPerDay: e.target.value})} />
                           </div>
                           <div className="space-y-1">
                             <label className="text-[9px] font-bold text-[var(--pv-gold)] uppercase tracking-widest ml-2">Slot (Min)</label>
                             <input type="number" className="neo-input !py-2 !bg-white !text-xs" value={scheduleForm.slotDurationMin} onChange={e => setScheduleForm({...scheduleForm, slotDurationMin: e.target.value})} />
                           </div>
                           <div className="space-y-1">
                             <label className="text-[9px] font-bold text-[var(--pv-gold)] uppercase tracking-widest ml-2">Inicio</label>
                             <input type="time" className="neo-input !py-2 !bg-white !text-xs" value={scheduleForm.startTime} onChange={e => setScheduleForm({...scheduleForm, startTime: e.target.value})} />
                           </div>
                           <div className="space-y-1">
                             <label className="text-[9px] font-bold text-[var(--pv-gold)] uppercase tracking-widest ml-2">Fin</label>
                             <input type="time" className="neo-input !py-2 !bg-white !text-xs" value={scheduleForm.endTime} onChange={e => setScheduleForm({...scheduleForm, endTime: e.target.value})} />
                           </div>
                           <div className="space-y-1 col-span-2">
                             <label className="text-[9px] font-bold text-[var(--pv-gold)] uppercase tracking-widest ml-2">Modalidad Especial</label>
                             <select className="neo-input !py-2 !bg-white !text-xs" value={scheduleForm.allowedModality} onChange={e => setScheduleForm({...scheduleForm, allowedModality: e.target.value})}>
                                <option value="">Cualquiera</option>
                                <option value="OFFICE">Solo En Despacho</option>
                                <option value="VIDEO_CALL">Solo Video Llamada</option>
                             </select>
                           </div>
                        </div>
                        <button onClick={handleSaveSchedule} disabled={scheduleSaving} className="w-full btn-roman !py-3 !text-[10px] !uppercase !tracking-[0.2em] mt-4">
                           {scheduleSaving ? '...' : 'Sellar Jornada'}
                        </button>
                        {scheduleMessage && <p className="text-center text-[10px] font-bold text-emerald-600 animate-pulse mt-2">{scheduleMessage}</p>}
                      </div>
                    )}
                 </div>
              </div>
           </section>
        </div>
      </div>

      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
