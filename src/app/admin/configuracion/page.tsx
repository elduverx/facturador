'use client';

import { useState, useEffect } from 'react';
import { DAYS_OF_WEEK_FULL } from '@/lib/constants';
import Link from 'next/link';
import { 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Calendar as CalendarIcon, 
  Check, 
  Save, 
  Hash,
  Sun,
  Sunset,
  ArrowRight
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
  }, []);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-[var(--pv-gold)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-roman uppercase text-[var(--pv-ink)] tracking-tight">Ajustes Generales</h1>
          <p className="text-sm text-[var(--pv-navy)] opacity-60">Configura la información del despacho y el horario base semanal.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-roman px-8 py-3.5 shadow-xl shadow-[var(--pv-gold)]/20 flex items-center justify-center gap-2"
        >
          {saving ? 'Guardando...' : saved ? <><Check size={18} /> Guardado</> : <><Save size={18} /> Guardar cambios</>}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
        {/* Firm Identity */}
        <div className="space-y-6">
          <section className="neo-card !p-6 lg:!p-8 border-l-8 border-l-[var(--pv-gold)]">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-[var(--pv-gold)] text-white rounded-2xl shadow-lg">
                <Building2 size={24} />
              </div>
              <div>
                <h2 className="font-bold font-roman uppercase text-[var(--pv-ink)]">Datos del Despacho</h2>
                <p className="text-[10px] font-bold text-[var(--pv-gold)] uppercase tracking-widest">Información pública y de contacto</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[var(--pv-gold)] uppercase tracking-widest ml-2">Nombre de la Firma</label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--pv-gold)]" size={16} />
                  <input className="neo-input pl-12" value={settings.firmName} onChange={(e) => setSettings({ ...settings, firmName: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[var(--pv-gold)] uppercase tracking-widest ml-2">Email de Notificaciones</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--pv-gold)]" size={16} />
                  <input className="neo-input pl-12" value={settings.firmEmail} onChange={(e) => setSettings({ ...settings, firmEmail: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[var(--pv-gold)] uppercase tracking-widest ml-2">Teléfono de Contacto</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--pv-gold)]" size={16} />
                  <input className="neo-input pl-12" value={settings.firmPhone} onChange={(e) => setSettings({ ...settings, firmPhone: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[var(--pv-gold)] uppercase tracking-widest ml-2">Dirección Sede Central</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--pv-gold)]" size={16} />
                  <input className="neo-input pl-12" value={settings.firmAddress} onChange={(e) => setSettings({ ...settings, firmAddress: e.target.value })} />
                </div>
              </div>
            </div>
          </section>

          {/* Shortcut Callout to Calendar Exceptions */}
          <section className="neo-card !p-6 bg-gradient-to-br from-white to-[var(--pv-marble)]/60 border border-[var(--pv-gold)]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[var(--pv-gold)]/15 text-[var(--pv-gold)] rounded-2xl">
                <CalendarIcon size={24} />
              </div>
              <div>
                <h3 className="text-sm font-bold font-roman uppercase text-[var(--pv-ink)]">¿Necesitas cerrar horas o personalizar un día?</h3>
                <p className="text-xs text-[var(--pv-navy)] opacity-70 mt-0.5">
                  Las excepciones de jornada y cierres por franja horaria (ej. 10:00 a 14:00) se gestionan directamente en el Calendario.
                </p>
              </div>
            </div>
            <Link
              href="/admin/calendario"
              className="shrink-0 px-4 py-2.5 rounded-xl bg-[var(--pv-navy)] hover:bg-[var(--pv-gold)] text-white text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-sm"
            >
              Ir a Agenda <ArrowRight size={14} />
            </Link>
          </section>
        </div>

        {/* General Schedule & Availability */}
        <section className="neo-card !p-6 lg:!p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-[var(--pv-navy)] text-white rounded-2xl shadow-lg">
              <Clock size={24} />
            </div>
            <div>
              <h2 className="font-bold font-roman uppercase text-[var(--pv-ink)]">Horario Base Semanal</h2>
              <p className="text-[10px] font-bold text-[var(--pv-gold)] uppercase tracking-widest">Organizado por secciones Mañana y Tarde</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="p-4 rounded-2xl bg-[var(--pv-marble)]/60 border border-stone-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--pv-gold)] flex items-center gap-1.5">
                  <Sun size={13} /> Sección Mañana
                </span>
                <span className="text-[10px] font-bold text-stone-500 bg-white px-2 py-0.5 rounded-md border border-stone-200/60">
                  {pad2(settings.startHour)}:00 - {pad2(settings.lunchStartHour)}:00
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[var(--pv-navy)] uppercase tracking-widest ml-1">Apertura</label>
                  <select className="neo-input !py-2 !text-xs bg-white" value={settings.startHour} onChange={(e) => setSettings({ ...settings, startHour: parseInt(e.target.value) })}>
                    {Array.from({ length: 14 }, (_, i) => i + 6).map((h) => (
                      <option key={h} value={h}>{h.toString().padStart(2, '0')}:00</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[var(--pv-navy)] uppercase tracking-widest ml-1">Cierre Mañana</label>
                  <select className="neo-input !py-2 !text-xs bg-white" value={settings.lunchStartHour} onChange={(e) => setSettings({ ...settings, lunchStartHour: parseInt(e.target.value) })}>
                    {Array.from({ length: 10 }, (_, i) => i + 11).map((h) => (
                      <option key={h} value={h}>{h.toString().padStart(2, '0')}:00</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--pv-marble)]/60 border border-stone-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--pv-navy)] flex items-center gap-1.5">
                  <Sunset size={13} className="text-[var(--pv-gold)]" /> Sección Tarde
                </span>
                <span className="text-[10px] font-bold text-stone-500 bg-white px-2 py-0.5 rounded-md border border-stone-200/60">
                  {pad2(settings.lunchEndHour)}:00 - {pad2(settings.endHour)}:00
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[var(--pv-navy)] uppercase tracking-widest ml-1">Apertura Tarde</label>
                  <select className="neo-input !py-2 !text-xs bg-white" value={settings.lunchEndHour} onChange={(e) => setSettings({ ...settings, lunchEndHour: parseInt(e.target.value) })}>
                    {Array.from({ length: 10 }, (_, i) => i + 12).map((h) => (
                      <option key={h} value={h}>{h.toString().padStart(2, '0')}:00</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[var(--pv-navy)] uppercase tracking-widest ml-1">Cierre Final</label>
                  <select className="neo-input !py-2 !text-xs bg-white" value={settings.endHour} onChange={(e) => setSettings({ ...settings, endHour: parseInt(e.target.value) })}>
                    {Array.from({ length: 14 }, (_, i) => i + 10).map((h) => (
                      <option key={h} value={h}>{h.toString().padStart(2, '0')}:00</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[var(--pv-gold)] uppercase tracking-widest ml-2">Duración Estándar de Cita (Min)</label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--pv-gold)]" size={16} />
                <input type="number" className="neo-input pl-12" value={settings.slotDurationMin} onChange={(e) => setSettings({ ...settings, slotDurationMin: Number(e.target.value) })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[var(--pv-gold)] uppercase tracking-widest ml-2">Máx. Citas Diarias (0 = sin límite)</label>
              <div className="relative">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--pv-gold)]" size={16} />
                <input type="number" className="neo-input pl-12" value={settings.maxAppointmentsPerDay} onChange={(e) => setSettings({ ...settings, maxAppointmentsPerDay: Number(e.target.value) })} />
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-[var(--pv-marble)] space-y-4">
            <label className="text-[10px] font-bold text-[var(--pv-gold)] uppercase tracking-widest ml-2 block">Días Laborables de la Semana</label>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK_FULL.map((dayName, index) => (
                <button
                  key={index}
                  onClick={() => toggleWorkDay(index)}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold border transition-all duration-300 ${
                    settings.workDays.includes(index)
                      ? 'bg-[var(--pv-gold)] text-white border-[var(--pv-gold)] shadow-lg shadow-[var(--pv-gold)]/20'
                      : 'bg-white text-[var(--pv-navy)] border-stone-200 hover:border-[var(--pv-gold)]'
                  }`}
                >
                  {dayName}
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
