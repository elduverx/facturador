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
import { ShieldCheck, UserCheck, Calendar, FileText, CheckCircle2, ChevronRight, ChevronLeft, Sparkles, AlertCircle } from 'lucide-react';

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

    const nextClientData = {
      clientName: params.get('name') || '',
      clientEmail: normalizeEmail(params.get('email') || ''),
      clientPhone: normalizePhone(params.get('phone') || ''),
      clientNie: normalizeNie(params.get('nie') || ''),
      notes: 'Nueva cita solicitada desde Mi Portal.',
    };

    setClientData((current) => ({
      ...current,
      ...nextClientData,
    }));
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
    // Skip step 1 (Trámite) if it was pre-selected via the hero funnel
    if (step === 0 && initialServiceName && selectedServiceId) {
      setStep(2);
    } else {
      setStep(step + 1);
    }
    setError('');
  };

  const handleBack = () => {
    // Go back to step 0 if we skipped step 1
    if (step === 2 && initialServiceName && selectedServiceId) {
      setStep(0);
    } else {
      setStep(step - 1);
    }
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

      window.location.href = `/api/payments/redsys?appointmentId=${appointment.id}`;
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
    <div className="space-y-3 sm:space-y-6 lg:space-y-8 animate-fade-in">
      {/* Progress Stepper */}
      {step < 4 && (
        <div className="neo-card !p-3 sm:!p-5 lg:!p-6 bg-white/50 border-white/20">
          <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4 mb-4 sm:mb-6 lg:mb-8">
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-lg bg-[var(--pv-gold)] flex items-center justify-center text-white shadow-lg">
                  <Sparkles size={16} />
               </div>
               <h2 className="font-roman font-bold text-base sm:text-lg uppercase tracking-tight text-[var(--pv-ink)]">{STEPS[step].label}</h2>
            </div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--pv-gold)]">
              Etapa {step + 1} de 4
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2 sm:flex sm:items-center">
            {STEPS.slice(0, 4).map((s, i) => (
              <div key={i} className="sm:flex-1 relative min-w-0">
                <div className={`h-1.5 rounded-full transition-all duration-700 ${i <= step ? 'bg-[var(--pv-gold)] shadow-sm' : 'bg-[var(--pv-marble)]'}`} />
                <div className={`mt-3 flex flex-col items-center gap-1 ${i <= step ? 'opacity-100' : 'opacity-30'}`}>
                   <s.icon size={14} className={i === step ? 'text-[var(--pv-gold)]' : 'text-[var(--pv-navy)]'} />
                   <span className="text-[8px] font-black uppercase tracking-widest hidden md:block text-center truncate max-w-full">{s.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={step < 4 ? 'grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-5 sm:gap-6 xl:gap-8 items-start' : ''}>
        <div className="neo-card !p-3 sm:!p-6 lg:!p-8 xl:!p-10 shadow-2xl relative overflow-hidden min-w-0">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none transform translate-x-4 -translate-y-4">
             <ShieldCheck size={160} />
          </div>

          {step === 0 && (
            <div className="relative z-10 animate-fade-in">
              <h2 className="text-xl sm:text-3xl font-bold font-roman uppercase text-[var(--pv-ink)] mb-2 sm:mb-3 tracking-tighter">Elige quién te atenderá</h2>
              <p className="text-xs sm:text-sm text-[var(--pv-navy)] opacity-60 mb-4 sm:mb-8 lg:mb-10 leading-relaxed font-medium max-w-3xl">
                Selecciona una abogada para tu consulta. Después podrás elegir el trámite, la fecha disponible y completar tus datos.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 lg:gap-10">
                {LAWYERS.map((lawyer) => (
                  <button
                    key={lawyer.id}
                    type="button"
                    onClick={() => {
                      setSelectedLawyerId(lawyer.id);
                      // Auto-advance for better UX
                      setTimeout(() => {
                        if (initialServiceName && selectedServiceId) {
                          setStep(2);
                        } else {
                          setStep(1);
                        }
                      }, 400);
                    }}
                    className={`group rounded-[2.5rem] border-4 transition-all duration-500 relative overflow-hidden aspect-[4/5] sm:aspect-[3/4] cursor-pointer ${
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
                    <div className="absolute top-6 right-6 z-20">
                      <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
                        selectedLawyerId === lawyer.id 
                          ? 'bg-[var(--pv-gold)] border-[var(--pv-gold)] shadow-lg' 
                          : 'bg-white/10 border-white/50 backdrop-blur-md group-hover:border-[var(--pv-gold)] group-hover:bg-white/20'
                      }`}>
                        <CheckCircle2 
                          className={`text-white transition-all duration-500 ${
                            selectedLawyerId === lawyer.id ? 'opacity-100 scale-110' : 'opacity-0 scale-50'
                          }`} 
                          size={24} 
                        />
                      </div>
                    </div>
                    
                    {/* Content Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-10 z-10 text-left">
                      <div className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4 transition-all duration-500 border ${
                        selectedLawyerId === lawyer.id 
                          ? 'bg-[var(--pv-gold)] text-white border-[var(--pv-gold)]' 
                          : 'bg-white/10 text-white border-white/30 backdrop-blur-md group-hover:bg-[var(--pv-gold)] group-hover:border-[var(--pv-gold)]'
                      }`}>
                        {selectedLawyerId === lawyer.id ? 'Seleccionada' : 'Seleccionar'}
                      </div>
                      <h3 className="font-roman text-3xl sm:text-4xl font-bold text-white uppercase tracking-tight leading-tight mb-2 transition-transform duration-500 group-hover:-translate-y-1">{lawyer.name}</h3>
                      <p className="text-sm text-white/80 font-medium leading-relaxed line-clamp-2 transition-transform duration-500 delay-75 group-hover:-translate-y-1">{lawyer.detail}</p>
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
              />
            </div>
          )}

          {error && (
            <div className="mt-8 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-700 text-xs font-bold flex items-center gap-3 animate-shake">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          {step < 4 && (
            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-6 mt-5 sm:mt-10 lg:mt-12 pt-4 sm:pt-7 lg:pt-8 border-t border-[var(--pv-marble)] relative z-10">
              {step > 0 ? (
                <button onClick={handleBack} className="w-full sm:w-auto px-6 sm:px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] border-2 border-[var(--pv-marble)] text-[var(--pv-navy)] opacity-60 hover:opacity-100 hover:bg-stone-100 transition-all flex items-center justify-center gap-2">
                   <ChevronLeft size={16} /> Atrás
                </button>
              ) : (
                <div className="hidden sm:block" />
              )}
              <button
                onClick={handleNext}
                disabled={!canGoNext() || submitting}
                className="btn-roman w-full sm:w-auto px-8 sm:px-10 py-4 text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-[var(--pv-gold)]/20 disabled:grayscale disabled:opacity-50"
              >
                {submitting ? (
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Procesando...
                  </div>
                ) : step === 3 ? (
                  'Confirmar y pagar'
                ) : (
                  <div className="flex items-center gap-2">Continuar <ChevronRight size={16} /></div>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Sidebar Summary */}
        {step > 0 && step < 4 && (
          <aside className="hidden sm:block space-y-4 sm:space-y-6 animate-fade-in xl:sticky xl:top-24 min-w-0">
             <div className="neo-card !p-4 sm:!p-6 xl:!p-8 border-t-8 border-t-[var(--pv-gold)] shadow-xl">
                <h3 className="font-roman font-bold text-sm uppercase tracking-[0.2em] text-[var(--pv-ink)] mb-5 xl:mb-8 border-b border-[var(--pv-marble)] pb-4">Resumen de reserva</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-1 gap-4 xl:gap-6">
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
                      <p className="text-2xl font-black text-[var(--pv-navy)]">{formatEuro(CONSULTATION_DEPOSIT_AMOUNT)}</p>
                      <p className="text-[10px] font-medium text-[var(--pv-navy)] opacity-40 mt-2 leading-relaxed">
                        Este importe confirma la cita y se descuenta del servicio si continúas el trámite.
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

