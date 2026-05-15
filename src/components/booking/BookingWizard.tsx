'use client';

import { useState, useEffect } from 'react';
import { ServiceType } from '@/types/booking';
import { formatDateES } from '@/lib/constants';
import { CONSULTATION_DEPOSIT_AMOUNT, formatEuro } from '@/lib/payments';
import { isValidEmail, isValidPhone, normalizeEmail, normalizeNie, normalizePhone } from '@/lib/validation';
import { ServiceSelector } from './ServiceSelector';
import { DateTimePicker } from './DateTimePicker';
import { ClientForm } from './ClientForm';
import { BookingConfirmation } from './BookingConfirmation';

const LAWYERS = [
  {
    id: 'luz',
    name: 'Abogada Luz',
    detail: 'Especialista en estrategia documental y seguimiento de expedientes.',
  },
  {
    id: 'dian',
    name: 'Abogada Dian',
    detail: 'Especialista en citas, renovaciones y acompanamiento administrativo.',
  },
];

const STEPS = ['Abogada', 'Servicio', 'Fecha y hora', 'Datos', 'Confirmacion'];

export function BookingWizard() {
  const [step, setStep] = useState(0);
  const [services, setServices] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [selectedLawyerId, setSelectedLawyerId] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [clientData, setClientData] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientNie: '',
    notes: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Confirmation data
  const [confirmation, setConfirmation] = useState<{
    appointmentId: string;
    clientName: string;
    serviceName: string;
    lawyerName: string;
    date: string;
    time: string;
    price: number;
  } | null>(null);

  useEffect(() => {
    fetch('/api/services')
      .then((r) => r.json())
      .then((data) => setServices(data))
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
  }, []);

  const selectedService = services.find((s) => s.id === selectedServiceId);
  const selectedLawyer = LAWYERS.find((lawyer) => lawyer.id === selectedLawyerId);

  const canGoNext = () => {
    if (step === 0) return !!selectedLawyerId;
    if (step === 1) return !!selectedServiceId;
    if (step === 2) return !!selectedDate && !!selectedTime;
    if (step === 3) return !!clientData.clientName && !!clientData.clientEmail && !!clientData.clientPhone;
    return false;
  };

  const validateStep2 = () => {
    const errors: Record<string, string> = {};
    if (!clientData.clientName.trim()) errors.clientName = 'El nombre es obligatorio';
    const normalizedEmail = normalizeEmail(clientData.clientEmail);
    const normalizedPhone = normalizePhone(clientData.clientPhone);
    if (!normalizedEmail) errors.clientEmail = 'El email es obligatorio';
    else if (!isValidEmail(normalizedEmail)) errors.clientEmail = 'Email no valido';
    if (!normalizedPhone) errors.clientPhone = 'El telefono es obligatorio';
    else if (!isValidPhone(normalizedPhone)) errors.clientPhone = 'Telefono no valido (9 digitos, empieza con 6, 7, 8 o 9)';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (step === 3) {
      if (!validateStep2()) return;
      handleSubmit();
      return;
    }
    setStep(step + 1);
    setError('');
  };

  const handleBack = () => {
    setStep(step - 1);
    setError('');
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: selectedServiceId,
          date: selectedDate,
          startTime: selectedTime,
          clientName: clientData.clientName.trim(),
          clientEmail: normalizeEmail(clientData.clientEmail),
          clientPhone: normalizePhone(clientData.clientPhone),
          clientNie: clientData.clientNie ? normalizeNie(clientData.clientNie) : undefined,
          notes: [
            selectedLawyer ? `Abogada seleccionada: ${selectedLawyer.name}` : null,
            clientData.notes || null,
          ].filter(Boolean).join('\n\n') || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al crear la cita');
      }

      const appointment = await res.json();

      setConfirmation({
        appointmentId: appointment.id,
        clientName: clientData.clientName,
        serviceName: selectedService?.name || '',
        lawyerName: selectedLawyer?.name || '',
        date: formatDateES(selectedDate!),
        time: selectedTime!,
        price: selectedService?.price || 0,
      });
      setStep(4);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al procesar la reserva');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="card text-center py-12">
        <div className="inline-block w-8 h-8 border-2 border-[var(--pv-gold)] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-[var(--pv-muted)] mt-3">Cargando servicios...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {step < 4 && (
        <div className="card !p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-[var(--pv-muted)]">
                Paso {step + 1} de 4
              </div>
              <div className="font-legal text-xl text-[var(--pv-navy)] mt-1">{STEPS[step]}</div>
            </div>
            <div className="hidden sm:block text-xs text-[var(--pv-muted)]">
              Reserva guiada
            </div>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2">
            {STEPS.slice(0, 4).map((label, i) => (
              <div key={label} className="space-y-1">
                <div className={`h-1.5 rounded-full ${i <= step ? 'bg-[var(--pv-navy)]' : 'bg-[#d8c7a0]/50'}`} />
                <div className={`text-[10px] hidden sm:block ${i <= step ? 'text-[var(--pv-navy)] font-semibold' : 'text-[var(--pv-muted)]'}`}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={step < 4 ? 'grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4 items-start' : ''}>
        <div className="card">
          {step === 0 && (
            <div>
              <h2 className="font-legal text-2xl text-[var(--pv-navy)] mb-1">Seleccione abogada</h2>
              <p className="text-sm text-[var(--pv-muted)] mb-5">
                Elija con quien quiere iniciar la reserva. Despues seleccionara servicio, fecha y sus datos.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {LAWYERS.map((lawyer) => (
                  <button
                    key={lawyer.id}
                    type="button"
                    onClick={() => setSelectedLawyerId(lawyer.id)}
                    className={`group text-left rounded-md border p-4 transition-all ${
                      selectedLawyerId === lawyer.id
                        ? 'border-[var(--pv-gold)] bg-[#fff8e8] shadow-sm'
                        : 'border-[var(--pv-line)] bg-[#fffdf5]/80 hover:border-[var(--pv-gold)]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="pv-seal w-12 h-12 rounded-full flex items-center justify-center font-legal text-xs font-bold shrink-0">
                        {lawyer.name === 'Abogada Luz' ? 'LZ' : 'DN'}
                      </div>
                      <div>
                        <div className="font-legal text-xl text-[var(--pv-navy)]">{lawyer.name}</div>
                        <p className="text-xs text-[var(--pv-muted)] mt-1 leading-relaxed">{lawyer.detail}</p>
                        <div className="mt-3 text-[10px] uppercase tracking-[0.16em] text-[var(--pv-muted)] group-hover:text-[var(--pv-navy)]">
                          {selectedLawyerId === lawyer.id ? 'Seleccionada' : 'Seleccionar'}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <ServiceSelector
              services={services}
              selected={selectedServiceId}
              onSelect={(id) => setSelectedServiceId(id)}
            />
          )}

          {step === 2 && selectedServiceId && (
            <DateTimePicker
              serviceId={selectedServiceId}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              onDateSelect={setSelectedDate}
              onTimeSelect={(t) => setSelectedTime(t || null)}
            />
          )}

          {step === 3 && (
            <ClientForm
              data={clientData}
              onChange={setClientData}
              errors={formErrors}
            />
          )}

          {step === 4 && confirmation && (
          <BookingConfirmation
            appointmentId={confirmation.appointmentId}
            clientName={confirmation.clientName}
            serviceName={confirmation.serviceName}
            lawyerName={confirmation.lawyerName}
            date={confirmation.date}
            time={confirmation.time}
            price={confirmation.price}
          />
          )}

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm rounded-md p-3">
              {error}
            </div>
          )}

          {step < 4 && (
            <div className="flex items-center justify-between gap-3 mt-5 pt-4 border-t border-[var(--pv-line)]">
              {step > 0 ? (
                <button onClick={handleBack} className="btn btn-secondary text-xs">
                  Atras
                </button>
              ) : (
                <div />
              )}
              <button
                onClick={handleNext}
                disabled={!canGoNext() || submitting}
                className="btn btn-primary text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Procesando...
                  </>
                ) : step === 3 ? (
                  'Confirmar reserva'
                ) : (
                  'Continuar'
                )}
              </button>
            </div>
          )}
        </div>

        {step > 0 && step < 4 && (
          <aside className="card !p-4 lg:sticky lg:top-4">
            <div className="font-legal text-base text-[var(--pv-navy)]">Resumen</div>
            <div className="mt-4 space-y-3 text-xs">
              <div>
                <div className="uppercase tracking-[0.16em] text-[10px] text-[var(--pv-muted)]">Abogada</div>
                <div className="mt-1 font-semibold text-[var(--pv-navy)]">{selectedLawyer?.name || 'Pendiente'}</div>
              </div>
              <div>
                <div className="uppercase tracking-[0.16em] text-[10px] text-[var(--pv-muted)]">Servicio</div>
                <div className="mt-1 font-semibold text-[var(--pv-navy)]">{selectedService?.name || 'Pendiente'}</div>
              </div>
              <div>
                <div className="uppercase tracking-[0.16em] text-[10px] text-[var(--pv-muted)]">Fecha y hora</div>
                <div className="mt-1 font-semibold text-[var(--pv-navy)]">
                  {selectedDate ? formatDateES(selectedDate) : 'Pendiente'}
                  {selectedTime ? `, ${selectedTime}` : ''}
                </div>
              </div>
            </div>
            <div className="pv-divider my-4" />
            <div className="rounded-md border border-[var(--pv-line)] bg-[#fff8e8]/70 p-3 text-xs">
              <div className="uppercase tracking-[0.16em] text-[10px] text-[var(--pv-muted)]">Anticipo</div>
              <div className="mt-1 font-semibold text-[var(--pv-navy)]">{formatEuro(CONSULTATION_DEPOSIT_AMOUNT)}</div>
              <p className="mt-1 text-[11px] leading-relaxed text-[var(--pv-muted)]">
                Se descuenta del total de la consulta o servicio.
              </p>
            </div>
            <div className="pv-divider my-4" />
            <div className="flex flex-wrap gap-1.5 text-[10px]">
              {selectedLawyer && (
                <span className="bg-[#fff8e8] text-[var(--pv-navy)] border border-[var(--pv-line)] px-1.5 py-0.5 rounded font-medium">{selectedLawyer.name}</span>
              )}
              {selectedService && (
                <span className="bg-[#fff8e8] text-[var(--pv-navy)] border border-[var(--pv-line)] px-1.5 py-0.5 rounded font-medium">{selectedService.name}</span>
              )}
              {selectedDate && (
                <span className="bg-stone-100 px-1.5 py-0.5 rounded">{formatDateES(selectedDate)}</span>
              )}
              {selectedTime && (
                <span className="bg-stone-100 px-1.5 py-0.5 rounded">{selectedTime}</span>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
