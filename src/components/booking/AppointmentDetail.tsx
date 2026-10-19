'use client';

import { useEffect, useState } from 'react';
import { STATUS_COLORS, STATUS_LABELS, formatDateShort } from '@/lib/constants';
import { CONSULTATION_DEPOSIT_AMOUNT, formatEuro } from '@/lib/payments';
import { ClientDocumentUploader, PublicDocument } from './ClientDocumentUploader';
import { 
  Clock, 
  MapPin, 
  Video, 
  CreditCard,
  Briefcase,
  FileText,
  AlertCircle,
  CheckCircle2,
  CalendarCheck,
  CalendarPlus,
  XCircle,
  X
} from 'lucide-react';

export function AppointmentDetail({ appointmentId, paymentSuccess }: { appointmentId: string, paymentSuccess?: boolean }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingModality, setSavingModality] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState('');
  const [cancelSuccess, setCancelSuccess] = useState(false);

  const [selectedModality, setSelectedModality] = useState<'OFFICE' | 'VIDEO_CALL' | null>(null);
  const [isModalitySealed, setIsModalitySealed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sealed = localStorage.getItem(`modality_sealed_${appointmentId}`);
      if (sealed) setIsModalitySealed(true);
    }

    const params = new URLSearchParams(window.location.search);
    const confirmPayment = params.get('payment') === 'success'
      ? fetch('/api/payments/redsys/return-confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            appointmentId,
            documentId: params.get('documentId'),
          }),
        }).catch(() => undefined)
      : Promise.resolve();

    confirmPayment.then(() => fetch(`/api/portal/appointments/${appointmentId}`))
      .then(res => res.json())
      .then(d => {
        if (d.error) setError(d.error);
        else {
          setData(d);
          setSelectedModality(d.appointment.modality);
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [appointmentId]);

  const handleSaveModality = async () => {
    if (!selectedModality) return;
    setSavingModality(true);
    try {
      const res = await fetch(`/api/portal/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modality: selectedModality })
      });
      if (res.ok) {
        setData((prev: any) => ({ ...prev, appointment: { ...prev.appointment, modality: selectedModality } }));
        setIsModalitySealed(true);
        if (typeof window !== 'undefined') {
          localStorage.setItem(`modality_sealed_${appointmentId}`, 'true');
        }
      }
    } finally {
      setSavingModality(false);
    }
  };

  const handlePay = (id: string) => {
    window.location.href = `/api/payments/redsys?appointmentId=${id}`;
  };

  const handleCancelAppointment = async () => {
    setCancelling(true);
    setCancelError('');
    try {
      const res = await fetch(`/api/portal/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', reason: cancelReason }),
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Error al cancelar la cita');
      }
      setData((prev: any) => ({
        ...prev,
        appointment: {
          ...prev.appointment,
          status: 'CANCELLED',
          notes: result.appointment?.notes || prev.appointment.notes,
        },
      }));
      setShowCancelModal(false);
      setCancelSuccess(true);
    } catch (err: any) {
      setCancelError(err.message || 'Error al procesar la cancelación');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <div className="text-center p-12 animate-pulse text-white">Cargando tu cita...</div>;
  if (error) return <div className="p-4 bg-red-50 text-red-700 rounded-xl m-4">{error}</div>;
  if (!data?.appointment) return <div className="p-4 bg-red-50 text-red-700 rounded-xl m-4">Cita no encontrada</div>;

  const { appointment, pendingAppointments } = data;
  const isPast = new Date(`${appointment.date.split('T')[0]}T${appointment.startTime}:00`) < new Date();
  const isAugust = appointment.date.split('T')[0].split('-')[1] === '08';
  const isCancelled = appointment.status === 'CANCELLED';
  const bookAnotherUrl = `/reservar?portalBooking=1&email=${encodeURIComponent(appointment.clientEmail || '')}&name=${encodeURIComponent(appointment.clientName || '')}&nie=${encodeURIComponent(appointment.clientNie || '')}&type=new`;

  return (
    <div className="space-y-4 animate-fade-in pb-4">
      {paymentSuccess && (
        <div className="p-3 rounded-xl font-bold border flex items-center justify-center gap-2 bg-emerald-500/10 border-emerald-500/20 text-emerald-400 backdrop-blur-md">
          <CheckCircle2 size={16} />
          <span className="text-xs tracking-wide">¡Pago recibido! Cita confirmada.</span>
        </div>
      )}

      {cancelSuccess && (
        <div className="p-3 rounded-xl font-bold border flex items-center justify-center gap-2 bg-emerald-500/10 border-emerald-500/20 text-emerald-400 backdrop-blur-md">
          <CheckCircle2 size={16} />
          <span className="text-xs tracking-wide">Tu cita ha sido cancelada correctamente.</span>
        </div>
      )}

      {/* Hero Appointment Section */}
      <div className="flex flex-col items-center text-center relative z-10">
        <h2 className="text-xl sm:text-2xl font-roman uppercase tracking-widest text-white mb-2 font-bold drop-shadow-lg">
          {appointment.service.name}
        </h2>
        <div className="inline-flex items-center gap-2 text-[10px] font-bold text-white/80 uppercase tracking-widest bg-white/5 border border-white/10 px-3 py-1.5 rounded-full mb-4 backdrop-blur-md shadow-lg">
          <Clock size={12} className="text-[var(--pv-gold)]" />
          {formatDateShort(appointment.date.split('T')[0])} a las {appointment.startTime}
          <span className={`ml-1 text-[9px] px-2 py-0.5 rounded border uppercase tracking-wider ${
            isCancelled
              ? 'bg-red-500/20 text-red-300 border-red-500/30 font-bold'
              : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
          }`}>
            {STATUS_LABELS[appointment.status] || appointment.status}
          </span>
        </div>

        {isCancelled ? (
          <div className="w-full max-w-sm bg-red-500/10 border border-red-500/30 rounded-2xl p-5 text-center backdrop-blur-md space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
              <XCircle size={24} />
            </div>
            <div>
              <h3 className="text-sm font-roman uppercase tracking-widest font-bold text-red-300">
                Cita Cancelada
              </h3>
              <p className="text-[11px] text-white/60 mt-1 leading-relaxed">
                Esta cita ha sido cancelada y el horario ha quedado liberado. Si deseas agendar una nueva cita o para otro familiar, puedes hacerlo a continuación.
              </p>
            </div>
            <a 
              href={bookAnotherUrl}
              className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[var(--pv-gold)] hover:bg-[#b8914b] text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-lg"
            >
              <CalendarPlus size={16} /> Reservar otra cita
            </a>
          </div>
        ) : !isPast ? (
          <div className="w-full max-w-sm">
            {isModalitySealed ? (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 backdrop-blur-md">
                <div className="flex items-center gap-2 mb-1">
                  {appointment.modality === 'OFFICE' ? <MapPin size={16} className="text-[var(--pv-gold)]" /> : <Video size={16} className="text-[var(--pv-gold)]" />}
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
                    Modalidad Confirmada
                  </span>
                  <CheckCircle2 size={14} className="text-emerald-400" />
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-xs font-bold text-[var(--pv-gold)] uppercase tracking-widest">
                    {appointment.modality === 'OFFICE' ? 'En Despacho' : 'Video Llamada'}
                  </div>
                  {appointment.modality === 'OFFICE' && (
                    <div className="text-[10px] text-white/70 text-center mt-2 px-4 leading-relaxed">
                      C/ de Sant Ignasi de Loiola, 21, Entresuelo<br />
                      46008 València, Valencia
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50 mb-3">
                  ¿Cómo prefieres ser atendido?
                </h3>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button 
                    onClick={() => setSelectedModality('OFFICE')}
                    disabled={savingModality || isAugust}
                    title={isAugust ? 'En agosto solo atendemos online' : ''}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-300 ${selectedModality === 'OFFICE' ? 'border-[var(--pv-gold)] bg-[var(--pv-gold)]/10 shadow-[0_0_15px_rgba(196,161,115,0.15)] scale-[1.02]' : 'border-white/10 bg-white/5 hover:bg-white/10'} ${isAugust ? 'opacity-30 cursor-not-allowed grayscale' : ''}`}
                  >
                    <MapPin size={20} className={`mb-1.5 transition-colors duration-300 ${selectedModality === 'OFFICE' ? 'text-[var(--pv-gold)]' : 'text-white/40'}`} />
                    <span className={`text-[9px] font-black uppercase tracking-widest transition-colors duration-300 ${selectedModality === 'OFFICE' ? 'text-[var(--pv-gold)]' : 'text-white/40'}`}>En Despacho</span>
                  </button>
                  <button 
                    onClick={() => setSelectedModality('VIDEO_CALL')}
                    disabled={savingModality}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-300 ${selectedModality === 'VIDEO_CALL' ? 'border-[var(--pv-gold)] bg-[var(--pv-gold)]/10 shadow-[0_0_15px_rgba(196,161,115,0.15)] scale-[1.02]' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
                  >
                    <Video size={20} className={`mb-1.5 transition-colors duration-300 ${selectedModality === 'VIDEO_CALL' ? 'text-[var(--pv-gold)]' : 'text-white/40'}`} />
                    <span className={`text-[9px] font-black uppercase tracking-widest transition-colors duration-300 ${selectedModality === 'VIDEO_CALL' ? 'text-[var(--pv-gold)]' : 'text-white/40'}`}>Video Llamada</span>
                  </button>
                </div>
                {isAugust && <p className="text-[9px] font-bold text-white/50 text-center mb-3 tracking-wider">En agosto todas las citas son exclusivamente online.</p>}
                <button
                  onClick={handleSaveModality}
                  disabled={savingModality || !selectedModality}
                  className="w-full py-2.5 rounded-xl border border-[var(--pv-gold)]/50 bg-[var(--pv-gold)]/10 text-[var(--pv-gold)] text-[9px] font-black uppercase tracking-[0.2em] hover:bg-[var(--pv-gold)] hover:text-[var(--pv-ink)] transition-all disabled:opacity-50 disabled:pointer-events-none"
                >
                  {savingModality ? 'Guardando...' : 'Guardar Preferencia'}
                </button>
              </>
            )}

            {/* Quick Actions for active future appointment */}
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-2 w-full">
              <a
                href={bookAnotherUrl}
                className="w-full sm:w-auto flex-1 py-2.5 px-3 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold uppercase tracking-widest inline-flex items-center justify-center gap-2 transition-all"
              >
                <CalendarPlus size={14} className="text-[var(--pv-gold)]" /> Agendar otra cita
              </a>
              <button
                type="button"
                onClick={() => {
                  setCancelError('');
                  setShowCancelModal(true);
                }}
                className="w-full sm:w-auto py-2.5 px-3 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-widest inline-flex items-center justify-center gap-2 transition-all"
              >
                <XCircle size={14} /> Cancelar cita
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-sm">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-center gap-4 text-white relative overflow-hidden backdrop-blur-md">
              <div className="w-10 h-10 rounded-full bg-[var(--pv-gold)]/10 flex items-center justify-center border border-[var(--pv-gold)]/20">
                <Briefcase size={18} className="text-[var(--pv-gold)]" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-roman uppercase tracking-[0.2em] font-bold text-white mb-0.5">En Trámite</h3>
                <p className="text-[10px] text-white/50 leading-snug">
                  Expediente en gestión.
                </p>
              </div>
            </div>
            <div className="mt-3 text-center">
              <a
                href={bookAnotherUrl}
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold uppercase tracking-widest transition-all"
              >
                <CalendarPlus size={14} className="text-[var(--pv-gold)]" /> Agendar otra cita
              </a>
            </div>
          </div>
        )}
      </div>

      {isPast && !isCancelled && (
        <div className="pt-3 border-t border-white/10">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center text-white relative overflow-hidden backdrop-blur-md">
             <div className="w-12 h-12 mx-auto rounded-full bg-[var(--pv-gold)]/10 flex items-center justify-center border border-[var(--pv-gold)]/20 mb-3">
               <Briefcase size={24} className="text-[var(--pv-gold)]" />
             </div>
             <h3 className="text-sm font-roman uppercase tracking-[0.2em] font-bold text-white mb-2">Cita Finalizada</h3>
             <p className="text-xs text-white/50 leading-snug mb-4">
               El equipo legal está revisando los detalles. Podrás ver el estado del expediente en la sección correspondiente de tu portal.
             </p>
             <a
               href={bookAnotherUrl}
               className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--pv-gold)] hover:bg-[#b8914b] text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-lg"
             >
               <CalendarPlus size={15} /> Agendar nueva cita
             </a>
          </div>
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0f172a] border border-white/20 rounded-2xl p-6 w-full max-w-md shadow-2xl relative text-left">
            <button
              onClick={() => !cancelling && setShowCancelModal(false)}
              disabled={cancelling}
              className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors disabled:opacity-50"
            >
              <X size={18} />
            </button>
            <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={24} />
            </div>
            <h3 className="text-base font-roman uppercase tracking-widest font-bold text-white text-center mb-2">
              ¿Cancelar esta cita?
            </h3>
            <p className="text-xs text-white/60 text-center mb-4 leading-relaxed">
              El horario será liberado en el calendario y se notificará tanto a ti como al equipo del despacho.
            </p>

            <div className="mb-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/60 block mb-1">
                Motivo de la cancelación (opcional)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Ej: Cambio de planes, indisposición, ya resolví la consulta..."
                rows={3}
                disabled={cancelling}
                className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/30 text-xs focus:border-red-400 focus:ring-1 focus:ring-red-400 outline-none transition-all resize-none disabled:opacity-50"
              />
            </div>

            {cancelError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold flex items-center gap-2">
                <AlertCircle size={16} /> {cancelError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
                className="flex-1 py-3 rounded-xl border border-white/20 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={handleCancelAppointment}
                disabled={cancelling}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
              >
                {cancelling ? 'Cancelando...' : 'Sí, cancelar cita'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pending Payments - Only shown if there are any */}
      {pendingAppointments && pendingAppointments.length > 0 && (
        <section className="pt-3 border-t border-white/10">
          <div className="mb-3">
            <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50 flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center">
                <CreditCard size={10} className="text-red-400" />
              </div>
              Pagos Pendientes
            </h3>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {pendingAppointments.map((appt: any) => (
              <div key={appt.id} className="rounded-2xl bg-white/5 border border-white/10 p-3 backdrop-blur-sm relative overflow-hidden flex items-center justify-between">
                <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-bl from-red-500/20 to-transparent opacity-50 -z-10"></div>
                <div>
                  <div className="text-[8px] font-black uppercase text-red-400 tracking-[0.2em] mb-0.5">Pendiente</div>
                  <div className="font-bold text-xs text-white/90 line-clamp-1">{appt.service.name}</div>
                  <div className="text-sm font-roman font-bold text-white mt-0.5">{formatEuro(appt.service.price || CONSULTATION_DEPOSIT_AMOUNT)}</div>
                </div>
                <button onClick={() => handlePay(appt.id)} className="px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500 hover:text-white transition-all">
                  Pagar
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
