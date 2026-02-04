'use client';

import { useState } from 'react';
import { AppointmentData } from '@/types/booking';
import { STATUS_LABELS, STATUS_COLORS, formatDateES } from '@/lib/constants';

interface Props {
  appointment: AppointmentData | null;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

export function AppointmentModal({ appointment, open, onClose, onUpdate, showToast }: Props) {
  const [adminNotes, setAdminNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(false);

  if (!open || !appointment) return null;

  const dateStr = typeof appointment.date === 'string'
    ? appointment.date.split('T')[0]
    : new Date(appointment.date).toISOString().split('T')[0];

  const handleSaveNotes = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/appointments/${appointment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNotes }),
      });
      if (!res.ok) throw new Error();
      showToast('Notas guardadas', 'success');
      onUpdate();
    } catch {
      showToast('Error al guardar notas', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/appointments/${appointment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      showToast(`Cita ${STATUS_LABELS[status]?.toLowerCase() || 'actualizada'}`, 'success');
      onUpdate();
      onClose();
    } catch {
      showToast('Error al actualizar estado', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSendReminder = async () => {
    setSendingReminder(true);
    try {
      const res = await fetch(`/api/appointments/${appointment.id}/reminder`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error();
      showToast('Recordatorio enviado', 'success');
    } catch {
      showToast('Error al enviar recordatorio', 'error');
    } finally {
      setSendingReminder(false);
    }
  };

  // Initialize admin notes from appointment
  const currentNotes = adminNotes || appointment.adminNotes || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="fixed inset-0 bg-black/40" />
      <div
        className="relative bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <h3 className="font-semibold">Detalle de cita</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-stone-100">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className={`text-xs px-3 py-1.5 rounded-full border font-medium ${STATUS_COLORS[appointment.status] || ''}`}>
              {STATUS_LABELS[appointment.status] || appointment.status}
            </span>
            <span className="text-xs text-stone-400">ID: {appointment.id.slice(0, 8)}...</span>
          </div>

          {/* Service & Schedule */}
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
            <div className="font-semibold text-sm">{appointment.service?.name || 'Servicio'}</div>
            <div className="text-sm text-teal-700 mt-1">
              {formatDateES(dateStr)} - {appointment.startTime} a {appointment.endTime}
            </div>
          </div>

          {/* Client info */}
          <div>
            <h4 className="text-xs font-semibold uppercase text-stone-400 mb-2">Datos del cliente</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-stone-400 text-xs">Nombre</span>
                <div className="font-medium">{appointment.clientName}</div>
              </div>
              <div>
                <span className="text-stone-400 text-xs">Email</span>
                <div>{appointment.clientEmail}</div>
              </div>
              <div>
                <span className="text-stone-400 text-xs">Telefono</span>
                <div>{appointment.clientPhone}</div>
              </div>
              {appointment.clientNie && (
                <div>
                  <span className="text-stone-400 text-xs">NIE/Pasaporte</span>
                  <div>{appointment.clientNie}</div>
                </div>
              )}
            </div>
          </div>

          {/* Client notes */}
          {appointment.notes && (
            <div>
              <h4 className="text-xs font-semibold uppercase text-stone-400 mb-2">Notas del cliente</h4>
              <div className="text-sm bg-stone-50 p-3 rounded-lg">{appointment.notes}</div>
            </div>
          )}

          {/* Admin notes */}
          <div>
            <h4 className="text-xs font-semibold uppercase text-stone-400 mb-2">Notas internas (admin)</h4>
            <textarea
              className="form-input text-sm min-h-[80px]"
              placeholder="Agregar notas internas sobre esta cita..."
              value={currentNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
            />
            <button
              onClick={handleSaveNotes}
              disabled={saving}
              className="btn btn-secondary mt-2 text-xs"
            >
              {saving ? 'Guardando...' : 'Guardar notas'}
            </button>
          </div>

          {/* Actions */}
          <div className="border-t border-stone-200 pt-4">
            <h4 className="text-xs font-semibold uppercase text-stone-400 mb-3">Acciones</h4>
            <div className="flex flex-wrap gap-2">
              {appointment.status === 'PENDING' && (
                <>
                  <button onClick={() => handleStatusChange('CONFIRMED')} disabled={saving} className="btn bg-teal-600 text-white hover:bg-teal-700 text-xs">
                    Confirmar cita
                  </button>
                  <button onClick={() => handleStatusChange('CANCELLED')} disabled={saving} className="btn bg-red-100 text-red-700 hover:bg-red-200 text-xs">
                    Cancelar cita
                  </button>
                </>
              )}
              {appointment.status === 'CONFIRMED' && (
                <>
                  <button onClick={() => handleStatusChange('COMPLETED')} disabled={saving} className="btn bg-green-100 text-green-700 hover:bg-green-200 text-xs">
                    Marcar completada
                  </button>
                  <button onClick={() => handleStatusChange('NO_SHOW')} disabled={saving} className="btn bg-stone-100 text-stone-600 hover:bg-stone-200 text-xs">
                    No presentado
                  </button>
                  <button onClick={() => handleStatusChange('CANCELLED')} disabled={saving} className="btn bg-red-100 text-red-700 hover:bg-red-200 text-xs">
                    Cancelar cita
                  </button>
                </>
              )}
              {['PENDING', 'CONFIRMED'].includes(appointment.status) && (
                <button
                  onClick={handleSendReminder}
                  disabled={sendingReminder}
                  className="btn btn-secondary text-xs"
                >
                  {sendingReminder ? (
                    <>
                      <div className="w-3 h-3 border-2 border-stone-400 border-t-transparent rounded-full animate-spin"></div>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                      Enviar recordatorio
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
