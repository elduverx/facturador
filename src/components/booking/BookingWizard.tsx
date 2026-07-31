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
import { ShieldCheck, UserCheck, Calendar, FileText, CheckCircle2, ChevronRight, ChevronLeft, Sparkles, AlertCircle, CreditCard, Banknote } from 'lucide-react';

const LAWYERS = [
  {
    id: 'diana',
    name: 'Abogada Diana',
    detail: 'Te orienta sobre documentación, estrategia y seguimiento del expediente.',
    initials: 'DN',
    image: '/luz.png',
  },
  {
    id: 'luz',
    name: 'Abogada Luz',
    detail: 'Te ayuda con citas, renovaciones y trámites administrativos.',
    initials: 'LZ',
    image: '/diana.png',
  },
];

const STEPS = [
  { label: 'Abogada', icon: UserCheck },
  { label: 'Trámite', icon: FileText },
  { label: 'Agenda', icon: Calendar },
  { label: 'Datos', icon: ShieldCheck },
  { label: 'Pago', icon: CheckCircle2 },
];

export function BookingWizard({ initialServiceName }: { initialServiceName?: string | null }) {
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
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'CASH'>('CASH');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isExistingMatterConsultation, setIsExistingMatterConsultation] = useState(false);
  const [allowedModality, setAllowedModality] = useState<string | null>(null);
  const [selectedModality, setSelectedModality] = useState<'OFFICE' | 'VIDEO_CALL'>('VIDEO_CALL');

  useEffect(() => {
    if (allowedModality === 'VIDEO_CALL') setSelectedModality('VIDEO_CALL');
    if (allowedModality === 'OFFICE') setSelectedModality('OFFICE');
  }, [allowedModality]);

  // Confirmation data
  const [confirmation, setConfirmation] = useState<{
    appointmentId: string;
    clientName: string;
    serviceName: string;
    lawyerName: string;
    date: string;
    time: string;
    price: number;
    paymentMethod: 'CARD' | 'CASH';
  } | null>(null);

  useEffect(() => {
    fetch('/api/services')
      .then((r) => r.json())
      .then((data) => setServices(data))
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (initialServiceName && services.length > 0) {
      // Find a matching service (case-insensitive partial match to be safe)
      const srv = services.find(s => 
        s.name.toLowerCase() === initialServiceName.toLowerCase() || 
        initialServiceName.toLowerCase().includes(s.name.toLowerCase()) ||
        s.name.toLowerCase().includes(initialServiceName.toLowerCase())
      );
      if (srv) {
        setSelectedServiceId(srv.id);
      }
    }
  }, [initialServiceName, services]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('portalBooking') !== '1') return;

    if (params.get('type') === 'existing') {
      setIsExistingMatterConsultation(true);
      setPaymentMethod('CASH'); // Internally represented as CASH so it doesn't trigger Redsys
    }

    const nextClientData = {
      clientName: params.get('name') || '',
      clientEmail: normalizeEmail(params.get('email') || ''),
      clientPhone: normalizePhone(params.get('phone') || ''),
      clientNie: normalizeNie(params.get('nie') || ''),
      notes: params.get('type') === 'existing' ? 'Cita sobre expediente en curso (gratuita)' : 'Nueva cita solicitada desde Mi Portal.',
    };

    setClientData((current) => ({
      ...current,
      ...nextClientData,
    }));
  }, []);

  useEffect(() => {
    if (selectedModality === 'VIDEO_CALL') {
      setPaymentMethod('CARD');
    } else if (selectedModality === 'OFFICE') {
      setPaymentMethod('CASH');
    }
  }, [selectedModality]);

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
    else if (!isValidEmail(normalizedEmail)) errors.clientEmail = 'Email no válido';
    if (!normalizedPhone) errors.clientPhone = 'El teléfono es obligatorio';
    else if (!isValidPhone(normalizedPhone)) errors.clientPhone = 'Teléfono no válido';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (step === 3) {
      if (!validateStep2()) return;
      handleSubmit();
      return;
    }
    
    if (step === 0 && selectedServiceId) {
      setStep(2);
    } else {
      setStep(step + 1);
    }
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
          lawyerId: selectedLawyerId,
          paymentMethod,
          modality: selectedModality,
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

      // Temporalmente omitimos Redsys para Bizum
      setConfirmation({
        appointmentId: appointment.id,
        clientName: clientData.clientName.trim(),
        serviceName: selectedService?.name || '',
        lawyerName: selectedLawyer?.name || '',
        date: selectedDate || '',
        time: selectedTime || '',
        price: selectedService?.price || 0,
        paymentMethod: paymentMethod,
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
      <div className="neo-card text-center py-24 flex flex-col items-center gap-6">
        <div className="w-12 h-12 border-4 border-[var(--pv-gold)] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-bold text-[var(--pv-gold)] uppercase tracking-[0.3em] animate-pulse">Cargando servicios...</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 sm:space-y-3 lg:space-y-4 animate-fade-in">
      {/* Progress Stepper */}
      {step < 4 && (
        <div className="neo-card !p-2 sm:!p-3 lg:!p-4 bg-white/50 border-white/20">
          <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4 mb-2 sm:mb-3 lg:mb-4">
            <div className="flex items-center gap-2 sm:gap-3">
               <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-[var(--pv-gold)] flex items-center justify-center text-white shadow-md">
                  <Sparkles size={12} />
               </div>
               <h2 className="font-roman font-bold text-sm sm:text-base uppercase tracking-tight text-[var(--pv-ink)]">{STEPS[step].label}</h2>
            </div>
            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--pv-gold)]">
              Etapa {step + 1} de 4
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2 sm:flex sm:items-center">
            {STEPS.slice(0, 4).map((s, i) => (
              <div 
                key={i} 
                className={`sm:flex-1 relative min-w-0 ${i < step ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                onClick={() => {
                  if (i < step) setStep(i);
                }}
              >
                <div className={`h-1 sm:h-1.5 rounded-full transition-all duration-700 ${i <= step ? 'bg-[var(--pv-gold)] shadow-sm' : 'bg-[var(--pv-marble)]'}`} />
                <div className={`mt-1.5 flex flex-col items-center gap-0.5 sm:gap-1 ${i <= step ? 'opacity-100' : 'opacity-30'}`}>
                   <s.icon size={12} className={i === step ? 'text-[var(--pv-gold)]' : 'text-[var(--pv-navy)]'} />
                   <span className="text-[7px] font-black uppercase tracking-widest hidden md:block text-center truncate max-w-full">{s.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={step > 0 && step < 4 ? 'grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-4 sm:gap-5 xl:gap-6 items-start' : ''}>
        <div className={`neo-card !p-3 sm:!p-5 lg:!p-6 xl:!p-8 shadow-2xl relative overflow-hidden min-w-0 ${step === 0 ? 'max-w-4xl mx-auto' : ''}`}>
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none transform translate-x-4 -translate-y-4">
             <ShieldCheck size={160} />
          </div>

          {step === 0 && (
            <div className="relative z-10 animate-fade-in">
              <h2 className="text-lg sm:text-2xl font-bold font-roman uppercase text-[var(--pv-ink)] mb-1.5 tracking-tighter">Elige quién te atenderá</h2>
              <p className="text-xs sm:text-sm text-[var(--pv-navy)] opacity-60 mb-3 sm:mb-5 leading-relaxed font-medium max-w-3xl">
                Selecciona una abogada para tu consulta. Después podrás elegir el trámite, la fecha disponible y completar tus datos.
              </p>
              
              <div className="grid grid-cols-2 gap-3 sm:gap-8 lg:gap-10">
                {LAWYERS.map((lawyer) => (
                  <button
                    key={lawyer.id}
                    type="button"
                    onClick={() => {
                      setSelectedLawyerId(lawyer.id);
                      // Auto-advance for better UX
                      setTimeout(() => {
                        if (selectedServiceId) {
                          setStep(2);
                        } else {
                          setStep(1);
                        }
                      }, 400);
                    }}
                    className={`group rounded-[2.5rem] border-4 transition-all duration-500 relative overflow-hidden aspect-[1/2] sm:aspect-[3/4] cursor-pointer ${
                      selectedLawyerId === lawyer.id
                        ? 'border-[var(--pv-gold)] shadow-2xl scale-[1.02] ring-8 ring-[var(--pv-gold)]/10'
                        : 'border-white hover:border-[var(--pv-gold)]/40 hover:shadow-xl shadow-md'
                    }`}
                  >
                    {/* Background Image */}
                    {lawyer.image ? (
                      <img 
                        src={lawyer.image} 
                        alt={lawyer.name} 
                        className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 group-hover:scale-110 ${
                          selectedLawyerId === lawyer.id ? 'brightness-110' : 'brightness-90 group-hover:brightness-100'
                        }`}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-[var(--pv-marble)] flex items-center justify-center font-roman text-4xl font-black text-[var(--pv-gold)]">
                        {lawyer.initials}
                      </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--pv-navy)] via-[var(--pv-navy)]/10 to-transparent opacity-80 group-hover:opacity-70 transition-opacity duration-500" />

                    {/* Selection Indicator (Always visible now) */}
                    <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20">
                      <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
                        selectedLawyerId === lawyer.id 
                          ? 'bg-[var(--pv-gold)] border-[var(--pv-gold)] shadow-lg' 
                          : 'bg-white/10 border-white/50 backdrop-blur-md group-hover:border-[var(--pv-gold)] group-hover:bg-white/20'
                      }`}>
                        <CheckCircle2 
                          size={16}
                          className={`text-white transition-all duration-500 ${
                            selectedLawyerId === lawyer.id ? 'opacity-100 scale-110' : 'opacity-0 scale-50'
                          }`} 
                        />
                      </div>
                    </div>
                    
                    {/* Content Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-10 z-10 text-left">
                      <div className={`inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-5 py-1 sm:py-2 rounded-full text-[7px] sm:text-[10px] font-black uppercase tracking-[0.2em] mb-2 sm:mb-4 transition-all duration-500 border ${
                        selectedLawyerId === lawyer.id 
                          ? 'bg-[var(--pv-gold)] text-white border-[var(--pv-gold)]' 
                          : 'bg-white/10 text-white border-white/30 backdrop-blur-md group-hover:bg-[var(--pv-gold)] group-hover:border-[var(--pv-gold)]'
                      }`}>
                        {selectedLawyerId === lawyer.id ? 'Seleccionada' : 'Seleccionar'}
                      </div>
                      <h3 className="font-roman text-lg sm:text-3xl md:text-4xl font-bold text-white uppercase tracking-tight leading-tight mb-1 sm:mb-2 transition-transform duration-500 group-hover:-translate-y-1">{lawyer.name}</h3>
                      <p className="text-[9px] sm:text-sm text-white/80 font-medium leading-relaxed line-clamp-2 transition-transform duration-500 delay-75 group-hover:-translate-y-1">{lawyer.detail}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="relative z-10 animate-fade-in">
              <ServiceSelector
                services={services}
                selected={selectedServiceId}
                onSelect={(id) => {
                  setSelectedServiceId(id);
                  // Auto-advance for better UX
                  setTimeout(() => {
                    setStep(2);
                  }, 400);
                }}
              />
            </div>
          )}

          {step === 2 && selectedServiceId && (
            <div className="relative z-10 animate-fade-in">
                <DateTimePicker
                  serviceId={selectedServiceId}
                  lawyerId={selectedLawyerId}
                  selectedDate={selectedDate}
                  selectedTime={selectedTime}
                  onDateSelect={setSelectedDate}
                  onTimeSelect={(t) => setSelectedTime(t || null)}
                  onModalityFetched={setAllowedModality}
                />
            </div>
          )}

          {step === 3 && (
            <div className="relative z-10 animate-fade-in">
              <ClientForm
                data={clientData}
                onChange={setClientData}
                errors={formErrors}
              />

              {/* Modality Selection */}
              <div className="mt-6 sm:mt-10">
                <h3 className="text-lg sm:text-xl font-bold font-roman uppercase text-[var(--pv-ink)] mb-2 tracking-tighter">
                  Modalidad de la Cita
                </h3>
                {allowedModality ? (
                   <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-sm flex items-center justify-between">
                     <div>
                       <p className="text-sm font-bold uppercase text-[var(--pv-ink)]">
                         {allowedModality === 'VIDEO_CALL' ? 'Video Llamada' : 'En Despacho'}
                       </p>
                       <p className="text-[10px] sm:text-xs text-[var(--pv-navy)] opacity-60">
                         {allowedModality === 'VIDEO_CALL' ? 'Para esta fecha solo están disponibles citas online.' : 'Para esta fecha solo están disponibles citas presenciales.'}
                       </p>
                     </div>
                   </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setSelectedModality('OFFICE')}
                      className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${selectedModality === 'OFFICE' ? 'border-[var(--pv-gold)] bg-[var(--pv-gold)]/5 shadow-md' : 'border-stone-200 bg-white hover:border-[var(--pv-gold)]/50'}`}
                    >
                      <span className={`text-sm font-bold uppercase tracking-wider ${selectedModality === 'OFFICE' ? 'text-[var(--pv-gold)]' : 'text-[var(--pv-ink)]'}`}>En Despacho</span>
                    </button>
                    <button
                      onClick={() => setSelectedModality('VIDEO_CALL')}
                      className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${selectedModality === 'VIDEO_CALL' ? 'border-[var(--pv-gold)] bg-[var(--pv-gold)]/5 shadow-md' : 'border-stone-200 bg-white hover:border-[var(--pv-gold)]/50'}`}
                    >
                      <span className={`text-sm font-bold uppercase tracking-wider ${selectedModality === 'VIDEO_CALL' ? 'text-[var(--pv-gold)]' : 'text-[var(--pv-ink)]'}`}>Video Llamada</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Payment Method Selection */}
              <div className="mt-6 sm:mt-10">
                <h3 className="text-lg sm:text-xl font-bold font-roman uppercase text-[var(--pv-ink)] mb-2 tracking-tighter">
                  {isExistingMatterConsultation ? 'Cita sobre tu expediente' : 'Método de pago'}
                </h3>
                
                {isExistingMatterConsultation ? (
                  <div className="rounded-2xl border-2 border-[var(--pv-gold)] bg-[var(--pv-gold)]/5 p-4 sm:p-6 flex items-start gap-3 sm:gap-4 shadow-lg">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[var(--pv-gold)] flex items-center justify-center text-white shrink-0">
                      <CheckCircle2 size={22} />
                    </div>
                    <div>
                      <p className="font-bold text-sm sm:text-base uppercase tracking-tight text-[var(--pv-gold)]">Consulta Incluida</p>
                      <p className="text-[10px] sm:text-xs text-[var(--pv-navy)] opacity-80 mt-1 leading-relaxed font-medium">
                        Esta cita está vinculada a tu expediente en curso y no tiene coste adicional. Haz clic en "Confirmar reserva" para terminar.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-xs sm:text-sm text-[var(--pv-navy)] opacity-60 mb-4 sm:mb-6 leading-relaxed font-medium">
                      {selectedModality === 'VIDEO_CALL' 
                        ? 'El pago de la cita online se realizará mediante Bizum o Transferencia.'
                        : 'El pago del anticipo de la consulta presencial se concretará en la oficina.'}
                    </p>

                    <div className="rounded-2xl border-2 border-[var(--pv-marble)] bg-white p-4 sm:p-6 flex items-start gap-3 sm:gap-4 shadow-sm">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-md">
                        {selectedModality === 'VIDEO_CALL' ? <CreditCard size={22} /> : <Banknote size={22} />}
                      </div>
                      <div>
                        <p className="font-bold text-sm sm:text-base uppercase tracking-tight text-emerald-600">
                          {selectedModality === 'VIDEO_CALL' ? 'Pago Online (Bizum)' : 'A Concretar'}
                        </p>
                        <p className="text-[10px] sm:text-xs text-[var(--pv-navy)] opacity-60 mt-1 leading-relaxed">
                          {selectedModality === 'VIDEO_CALL'
                            ? 'Al confirmar, tu cita quedará agendada y nos pondremos en contacto contigo para realizar el Bizum.'
                            : 'El método de pago se acordará tras confirmar la reserva o al acudir al despacho. Al confirmar, tu cita quedará agendada.'}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {step === 4 && confirmation && (
             <div className="relative z-10 animate-fade-in">
              <BookingConfirmation
                appointmentId={confirmation.appointmentId}
                clientName={confirmation.clientName}
                serviceName={confirmation.serviceName}
                lawyerName={confirmation.lawyerName}
                date={confirmation.date}
                time={confirmation.time}
                price={confirmation.price}
                paymentMethod={confirmation.paymentMethod}
              />
            </div>
          )}

          {error && (
            <div className="mt-8 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-700 text-xs font-bold flex items-center gap-3 animate-shake">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          {step < 4 && (
            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mt-4 sm:mt-6 lg:mt-8 pt-3 sm:pt-5 lg:pt-6 border-t border-[var(--pv-marble)] relative z-10">
              {step > 0 ? (
                <button onClick={handleBack} className="w-full sm:w-auto px-5 sm:px-6 py-3 rounded-2xl font-black text-[9px] uppercase tracking-[0.2em] border-2 border-[var(--pv-marble)] text-[var(--pv-navy)] opacity-60 hover:opacity-100 hover:bg-stone-100 transition-all flex items-center justify-center gap-2">
                   <ChevronLeft size={14} /> Atrás
                </button>
              ) : (
                <div className="hidden sm:block" />
              )}
              <button
                onClick={handleNext}
                disabled={!canGoNext() || submitting}
                className="btn-roman w-full sm:w-auto px-6 sm:px-8 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-[var(--pv-gold)]/20 disabled:grayscale disabled:opacity-50"
              >
                {submitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Procesando...
                  </div>
                ) : step === 3 ? (
                  paymentMethod === 'CASH' ? 'Confirmar reserva' : 'Confirmar y pagar'
                ) : (
                  <div className="flex items-center gap-2">Continuar <ChevronRight size={14} /></div>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Sidebar Summary */}
        {step > 0 && step < 4 && (
          <aside className="hidden sm:block space-y-3 sm:space-y-4 animate-fade-in xl:sticky xl:top-24 min-w-0">
             <div className="neo-card !p-4 sm:!p-5 xl:!p-6 border-t-8 border-t-[var(--pv-gold)] shadow-xl">
                <h3 className="font-roman font-bold text-xs uppercase tracking-[0.2em] text-[var(--pv-ink)] mb-4 xl:mb-6 border-b border-[var(--pv-marble)] pb-3">Resumen de reserva</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-1 gap-3 xl:gap-4">
                  <div className="group">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--pv-gold)] mb-2 group-hover:translate-x-1 transition-transform">Abogada</p>
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-lg bg-[var(--pv-marble)] flex items-center justify-center text-[var(--pv-navy)] font-roman font-black text-[10px] border border-white overflow-hidden shrink-0">
                          {selectedLawyer?.image ? (
                            <img src={selectedLawyer.image} alt="" className="w-full h-full object-contain" />
                          ) : (
                            selectedLawyer?.initials || '?'
                          )}
                       </div>
                       <p className="text-sm font-bold text-[var(--pv-navy)]">{selectedLawyer?.name || 'Por elegir'}</p>
                    </div>
                  </div>

                  <div className="group">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--pv-gold)] mb-2 group-hover:translate-x-1 transition-transform">Trámite</p>
                    <p className="text-sm font-bold text-[var(--pv-navy)]">{selectedService?.name || 'Pendiente'}</p>
                  </div>

                  <div className="group">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--pv-gold)] mb-2 group-hover:translate-x-1 transition-transform">Fecha y Hora</p>
                    <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-[var(--pv-navy)]">
                       <Calendar size={14} className="text-[var(--pv-gold)]" />
                       {selectedDate ? formatDateES(selectedDate) : 'Pendiente'}
                       {selectedTime && <span className="text-[var(--pv-gold)] px-2 py-0.5 rounded-lg bg-[var(--pv-marble)] ml-2">{selectedTime}</span>}
                    </div>
                  </div>

                  <div className="pt-4 sm:pt-0 xl:pt-6 sm:border-t-0 xl:border-t border-[var(--pv-marble)] sm:col-span-3 xl:col-span-1">
                    <div className="p-4 rounded-2xl bg-[var(--pv-marble)] border border-white shadow-inner">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--pv-gold)] mb-2">Anticipo de la consulta</p>
                      <p className="text-2xl font-black text-[var(--pv-navy)]">{isExistingMatterConsultation ? 'Gratis' : formatEuro(CONSULTATION_DEPOSIT_AMOUNT)}</p>
                      {!isExistingMatterConsultation && (
                        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.15em] bg-emerald-100 text-emerald-700 border border-emerald-200">
                          <Banknote size={12} />
                          Efectivo
                        </div>
                      )}
                      <p className="text-[10px] font-medium text-[var(--pv-navy)] opacity-40 mt-2 leading-relaxed">
                        {isExistingMatterConsultation
                          ? 'Incluido como seguimiento de tu expediente actual.'
                          : 'Pagarás directamente en la oficina el día de tu cita.'}
                      </p>
                    </div>
                  </div>
                </div>
             </div>

             <div className="neo-card bg-[var(--pv-navy)] text-white border-none !p-4 sm:!p-6 flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[var(--pv-gold)] group-hover:scale-110 transition-transform">
                   <ShieldCheck size={20} />
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-[var(--pv-gold)]">Datos protegidos</p>
                   <p className="text-[10px] font-medium text-white opacity-60">Usaremos tus datos solo para gestionar tu cita y tu expediente.</p>
                </div>
             </div>
          </aside>
        )}
      </div>

      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.6s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.4s ease-in-out; }
      `}</style>
    </div>
  );
}
