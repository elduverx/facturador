'use client';

import { useState, useEffect } from 'react';
import { DAYS_OF_WEEK_FULL, MONTHS } from '@/lib/constants';

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
}

export default function ConfiguracionPage() {
  const [settings, setSettings] = useState<Settings>({
    firmName: 'Consultorio de Extranjeria',
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
  const [scheduleForm, setScheduleForm] = useState({
    date: '',
    startTime: '09:00',
    endTime: '14:00',
    lunchStartTime: '',
    lunchEndTime: '',
    maxAppointmentsPerDay: '',
    slotDurationMin: '',
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
          firmName: data.firmName || '',
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
      const res = await fetch('/api/admin/day-schedules');
      const data = await res.json();
      setDaySchedules(Array.isArray(data) ? data : []);
    } catch {
      setDaySchedules([]);
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
      alert('Error al guardar la configuracion');
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
      setScheduleMessage('Seleccione un dia en el calendario.');
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
      setScheduleMessage('No se pudo guardar la jornada.');
    } finally {
      setScheduleSaving(false);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm('Eliminar esta jornada?')) return;
    try {
      const schedule = daySchedules.find((item) => item.id === id);
      const res = await fetch(`/api/admin/day-schedules/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      await loadDaySchedules();
      if (schedule && selectedDate === schedule.date.split('T')[0]) {
        setSelectedDate(null);
      }
    } catch {
      alert('No se pudo eliminar la jornada.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
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
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">Configuracion</h1>
          <p className="text-sm text-stone-500">Ajustes del consultorio</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn btn-primary disabled:opacity-50"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Guardando...
            </>
          ) : saved ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
              Guardado
            </>
          ) : (
            'Guardar cambios'
          )}
        </button>
      </div>

      <div className="space-y-6">
        {/* Firm info */}
        <div className="card">
          <h2 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-teal-600">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            Datos del consultorio
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label block text-sm">Nombre del consultorio</label>
              <input
                type="text"
                className="form-input text-sm"
                value={settings.firmName}
                onChange={(e) => setSettings({ ...settings, firmName: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label block text-sm">Email (para notificaciones)</label>
              <input
                type="email"
                className="form-input text-sm"
                placeholder="consultorio@email.com"
                value={settings.firmEmail}
                onChange={(e) => setSettings({ ...settings, firmEmail: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label block text-sm">Telefono</label>
              <input
                type="tel"
                className="form-input text-sm"
                placeholder="+34 600 000 000"
                value={settings.firmPhone}
                onChange={(e) => setSettings({ ...settings, firmPhone: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label block text-sm">Direccion</label>
              <input
                type="text"
                className="form-input text-sm"
                placeholder="Calle, numero, ciudad"
                value={settings.firmAddress}
                onChange={(e) => setSettings({ ...settings, firmAddress: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="card">
          <h2 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-teal-600">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            Horario de atencion
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="form-label block text-sm">Hora inicio</label>
              <select className="form-input text-sm" value={settings.startHour} onChange={(e) => setSettings({ ...settings, startHour: parseInt(e.target.value) })}>
                {Array.from({ length: 14 }, (_, i) => i + 6).map((h) => (
                  <option key={h} value={h}>{h.toString().padStart(2, '0')}:00</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label block text-sm">Hora fin</label>
              <select className="form-input text-sm" value={settings.endHour} onChange={(e) => setSettings({ ...settings, endHour: parseInt(e.target.value) })}>
                {Array.from({ length: 14 }, (_, i) => i + 10).map((h) => (
                  <option key={h} value={h}>{h.toString().padStart(2, '0')}:00</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label block text-sm">Inicio almuerzo</label>
              <select className="form-input text-sm" value={settings.lunchStartHour} onChange={(e) => setSettings({ ...settings, lunchStartHour: parseInt(e.target.value) })}>
                {Array.from({ length: 8 }, (_, i) => i + 12).map((h) => (
                  <option key={h} value={h}>{h.toString().padStart(2, '0')}:00</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label block text-sm">Fin almuerzo</label>
              <select className="form-input text-sm" value={settings.lunchEndHour} onChange={(e) => setSettings({ ...settings, lunchEndHour: parseInt(e.target.value) })}>
                {Array.from({ length: 8 }, (_, i) => i + 12).map((h) => (
                  <option key={h} value={h}>{h.toString().padStart(2, '0')}:00</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[220px_1fr] gap-4">
            <div>
              <label className="form-label block text-sm">Duracion del slot (minutos)</label>
              <input
                type="number"
                min={1}
                className="form-input text-sm w-32"
                value={settings.slotDurationMin}
                onChange={(e) => setSettings({ ...settings, slotDurationMin: Number(e.target.value) || 1 })}
              />
              <p className="text-xs text-stone-400 mt-2">Permite intervalos cortos (ej: 5 min).</p>
            </div>
            <div>
              <label className="form-label block text-sm">Cupos maximos por dia</label>
              <input
                type="number"
                min={0}
                className="form-input text-sm w-40"
                value={settings.maxAppointmentsPerDay}
                onChange={(e) => setSettings({ ...settings, maxAppointmentsPerDay: Number(e.target.value) || 0 })}
              />
              <p className="text-xs text-stone-400 mt-2">0 = sin limite. Se aplica a todo el dia.</p>
            </div>
          </div>
        </div>

        {/* Work days */}
        <div className="card">
          <h2 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-teal-600">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            Dias laborables
          </h2>

          <div className="flex flex-wrap gap-2">
            {DAYS_OF_WEEK_FULL.map((dayName, index) => (
              <button
                key={index}
                onClick={() => toggleWorkDay(index)}
                className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                  settings.workDays.includes(index)
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
                }`}
              >
                {dayName}
              </button>
            ))}
          </div>
        </div>

        {/* Day schedules */}
        <div className="card">
          <h2 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-teal-600">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            Jornadas por dia
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => {
                    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
                    else setCurrentMonth(currentMonth - 1);
                  }}
                  className="p-2 rounded-lg hover:bg-stone-100"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </button>
                <div className="text-sm font-semibold">{MONTHS[currentMonth]} {currentYear}</div>
                <button
                  onClick={() => {
                    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
                    else setCurrentMonth(currentMonth + 1);
                  }}
                  className="p-2 rounded-lg hover:bg-stone-100"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {weekDays.map((day) => (
                  <div key={day} className="text-center text-xs font-medium text-stone-400 py-1">{day}</div>
                ))}
                {calendarCells.map((day, idx) => {
                  if (!day) return <div key={`empty-${idx}`} className="aspect-square" />;
                  const dateStr = `${currentYear}-${pad2(currentMonth + 1)}-${pad2(day)}`;
                  const isSelected = selectedDate === dateStr;
                  const isToday = dateStr === todayStr;
                  const hasOverride = !!getScheduleForDate(dateStr);
                  return (
                    <button
                      key={dateStr}
                      onClick={() => {
                        setSelectedDate(dateStr);
                        setScheduleMessage('');
                      }}
                      className={`aspect-square rounded-lg text-sm relative transition-colors ${
                        isSelected
                          ? 'bg-teal-600 text-white'
                          : isToday
                          ? 'bg-teal-50 text-teal-700 font-semibold'
                          : 'hover:bg-stone-100 text-stone-700'
                      }`}
                    >
                      <span className="text-xs">{day}</span>
                      {hasOverride && (
                        <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${
                          isSelected ? 'bg-white' : 'bg-teal-500'
                        }`} />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="text-xs text-stone-400 mt-3">
                Los dias con punto tienen jornada personalizada.
              </div>

              {daySchedules.length > 0 && (
                <div className="mt-4 space-y-2">
                  {daySchedules.map((schedule) => {
                    const scheduleDate = schedule.date.split('T')[0];
                    return (
                      <div key={schedule.id} className="flex items-center justify-between gap-2 border border-stone-200 rounded-lg p-2 text-xs">
                        <button
                          onClick={() => setSelectedDate(scheduleDate)}
                          className="text-left flex-1"
                        >
                          <div className="font-medium text-stone-700">{scheduleDate}</div>
                          <div className="text-stone-500">{schedule.startTime} - {schedule.endTime}</div>
                        </button>
                        <button
                          onClick={() => handleDeleteSchedule(schedule.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Eliminar
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="border border-stone-200 rounded-xl p-4">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <div className="text-sm font-semibold">Configurar dia</div>
                  <div className="text-xs text-stone-500">
                    {selectedDate ? `Fecha seleccionada: ${selectedDate}` : 'Seleccione un dia del calendario.'}
                  </div>
                </div>
                {selectedSchedule && (
                  <button
                    onClick={() => handleDeleteSchedule(selectedSchedule.id)}
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    Eliminar jornada
                  </button>
                )}
              </div>

              {!selectedDate ? (
                <div className="text-xs text-stone-400 py-6 text-center">
                  Haga clic en un dia para editar su jornada.
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="form-label block text-xs">Cupos del dia</label>
                      <input
                        type="number"
                        min={0}
                        className="form-input text-sm"
                        placeholder="Ej: 20"
                        value={scheduleForm.maxAppointmentsPerDay}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, maxAppointmentsPerDay: e.target.value })}
                      />
                      <p className="text-[10px] text-stone-400 mt-1">Vacio = usar cupo global. 0 = sin limite.</p>
                    </div>
                    <div>
                      <label className="form-label block text-xs">Duracion slot (min)</label>
                      <input
                        type="number"
                        min={1}
                        className="form-input text-sm"
                        placeholder="Auto"
                        value={scheduleForm.slotDurationMin}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, slotDurationMin: e.target.value })}
                      />
                      <p className="text-[10px] text-stone-400 mt-1">Vacio = calcular segun cupos.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="form-label block text-xs">Hora inicio</label>
                      <input
                        type="time"
                        className="form-input text-sm"
                        value={scheduleForm.startTime}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, startTime: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="form-label block text-xs">Hora fin</label>
                      <input
                        type="time"
                        className="form-input text-sm"
                        value={scheduleForm.endTime}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, endTime: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="form-label block text-xs">Pausa inicio</label>
                      <input
                        type="time"
                        className="form-input text-sm"
                        value={scheduleForm.lunchStartTime}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, lunchStartTime: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="form-label block text-xs">Pausa fin</label>
                      <input
                        type="time"
                        className="form-input text-sm"
                        value={scheduleForm.lunchEndTime}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, lunchEndTime: e.target.value })}
                      />
                    </div>
                  </div>

                  {estimateAutoSlot() !== null && (
                    <div className="text-[10px] text-stone-500 mt-2">
                      Duracion auto estimada: {estimateAutoSlot()} min
                    </div>
                  )}
                  <div className="text-[10px] text-stone-400 mt-1">Si deja la pausa vacia, se usa la pausa global.</div>

                  <div className="flex items-center gap-2 mt-4">
                    <button
                      onClick={handleSaveSchedule}
                      disabled={scheduleSaving}
                      className="btn btn-secondary text-xs disabled:opacity-60"
                    >
                      {scheduleSaving ? 'Guardando...' : 'Guardar jornada'}
                    </button>
                    {scheduleMessage && <span className="text-xs text-stone-500">{scheduleMessage}</span>}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
