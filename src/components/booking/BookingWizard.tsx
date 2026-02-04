'use client';

import { useState, useEffect } from 'react';
import { ServiceType } from '@/types/booking';
import { formatDateES } from '@/lib/constants';
import { isValidEmail, isValidPhone, normalizeEmail, normalizeNie, normalizePhone } from '@/lib/validation';
import { ServiceSelector } from './ServiceSelector';
import { DateTimePicker } from './DateTimePicker';
import { ClientForm } from './ClientForm';
import { BookingConfirmation } from './BookingConfirmation';

const STEPS = ['Servicio', 'Fecha y hora', 'Datos', 'Confirmacion'];

export function BookingWizard() {
  const [step, setStep] = useState(0);
  const [services, setServices] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form state
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
    clientName: string;
    serviceName: string;
    date: string;
    time: string;
  } | null>(null);

  useEffect(() => {
    fetch('/api/services')
      .then((r) => r.json())
      .then((data) => setServices(data))
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
  }, []);

  const selectedService = services.find((s) => s.id === selectedServiceId);

  const canGoNext = () => {
    if (step === 0) return !!selectedServiceId;
    if (step === 1) return !!selectedDate && !!selectedTime;
    if (step === 2) return !!clientData.clientName && !!clientData.clientEmail && !!clientData.clientPhone;
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
    if (step === 2) {
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
          notes: clientData.notes || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al crear la cita');
      }

      setConfirmation({
        clientName: clientData.clientName,
        serviceName: selectedService?.name || '',
        date: formatDateES(selectedDate!),
        time: selectedTime!,
      });
      setStep(3);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al procesar la reserva');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="card text-center py-12">
        <div className="inline-block w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-stone-500 mt-3">Cargando servicios...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Step indicator */}
      {step < 3 && (
        <div className="flex items-center gap-1.5 mb-3">
          {STEPS.slice(0, 3).map((label, i) => (
            <div key={label} className="flex items-center gap-1.5 flex-1">
              <div className={`flex items-center gap-1.5 flex-1 ${i <= step ? 'opacity-100' : 'opacity-40'}`}>
                <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-[11px] font-semibold shrink-0 ${
                  i < step ? 'bg-teal-600 text-white' : i === step ? 'bg-teal-600 text-white' : 'bg-stone-200 text-stone-500'
                }`}>
                  {i < step ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <span className="text-[10px] sm:text-[11px] font-medium hidden sm:inline">{label}</span>
              </div>
              {i < 2 && <div className={`h-px flex-1 ${i < step ? 'bg-teal-400' : 'bg-stone-200'}`} />}
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="card">
        {step === 0 && (
          <ServiceSelector
            services={services}
            selected={selectedServiceId}
            onSelect={(id) => setSelectedServiceId(id)}
          />
        )}

        {step === 1 && selectedServiceId && (
          <DateTimePicker
            serviceId={selectedServiceId}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            onDateSelect={setSelectedDate}
            onTimeSelect={(t) => setSelectedTime(t || null)}
          />
        )}

        {step === 2 && (
          <ClientForm
            data={clientData}
            onChange={setClientData}
            errors={formErrors}
          />
        )}

        {step === 3 && confirmation && (
          <BookingConfirmation
            clientName={confirmation.clientName}
            serviceName={confirmation.serviceName}
            date={confirmation.date}
            time={confirmation.time}
          />
        )}

        {/* Error message */}
        {error && (
          <div className="mt-3 sm:mt-4 bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm rounded-lg p-2.5 sm:p-3">
            {error}
          </div>
        )}

        {/* Navigation */}
        {step < 3 && (
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-stone-200">
            {step > 0 ? (
              <button onClick={handleBack} className="btn btn-secondary text-xs">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
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
              ) : step === 2 ? (
                'Confirmar reserva'
              ) : (
                <>
                  Siguiente
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </>
              )}
            </button>
          </div>
        )}

        {/* Summary sidebar on step 1 and 2 */}
        {step > 0 && step < 3 && selectedService && (
          <div className="mt-2 pt-2 border-t border-stone-100">
            <div className="flex flex-wrap items-center gap-1.5 text-[10px] sm:text-[11px] text-stone-500">
              <span className="bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded font-medium">{selectedService.name}</span>
              {selectedDate && (
                <span className="bg-stone-100 px-1.5 py-0.5 rounded">{formatDateES(selectedDate)}</span>
              )}
              {selectedTime && (
                <span className="bg-stone-100 px-1.5 py-0.5 rounded">{selectedTime}</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
