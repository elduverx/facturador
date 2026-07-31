'use client';

import { CONSULTATION_DEPOSIT_AMOUNT, formatEuro } from '@/lib/payments';
import { CheckCircle2, CreditCard, Mail, ExternalLink, ShieldCheck, ArrowRight, RefreshCw, Banknote, MapPin } from 'lucide-react';
import Link from 'next/link';

interface Props {
  appointmentId: string;
  clientName: string;
  serviceName: string;
  lawyerName?: string;
  date: string;
  time: string;
  price: number;
  paymentMethod?: 'CARD' | 'CASH';
}

export function BookingConfirmation({ appointmentId, clientName, serviceName, lawyerName, date, time, price, paymentMethod = 'CARD' }: Props) {
  const handlePay = () => {
    window.location.href = `/api/payments/redsys?appointmentId=${appointmentId}`;
  };

  const remainingAfterDeposit = Math.max(0, price - CONSULTATION_DEPOSIT_AMOUNT);

  return (
    <div className="animate-fade-in py-4 sm:py-8">
      <div className="flex flex-col items-center text-center mb-6 sm:mb-12">
        <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-4 sm:mb-6 shadow-xl shadow-emerald-100/50 animate-bounce-slow">
           <CheckCircle2 className="h-8 w-8 sm:h-12 sm:w-12" />
        </div>
        <h2 className="text-2xl sm:text-4xl font-bold font-roman uppercase text-[var(--pv-ink)] mb-2 sm:mb-3 tracking-tighter">
           {paymentMethod === 'CASH' ? 'Reserva confirmada' : 'Cita registrada'}
        </h2>
        <p className="text-sm sm:text-lg text-[var(--pv-navy)] opacity-60 max-w-xl font-medium">
          {paymentMethod === 'CASH'
            ? `Gracias, ${clientName}. Tu cita queda confirmada. Recuerda traer el pago en efectivo el día de la consulta.`
            : `Gracias, ${clientName}. Tu solicitud de cita se ha registrado correctamente.`}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-10 max-w-4xl mx-auto">
        {/* Detail Card */}
        <div className="neo-card !p-4 sm:!p-8 border-l-4 sm:border-l-8 border-l-[var(--pv-gold)] shadow-xl relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
              <ShieldCheck size={120} />
           </div>
           
           <h3 className="font-roman text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-[var(--pv-gold)] mb-4 sm:mb-8 border-b border-[var(--pv-marble)] pb-3 sm:pb-4">Detalles de la Cita</h3>
           
           <div className="space-y-4 sm:space-y-6 relative z-10">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--pv-navy)] opacity-40 mb-1">Trámite seleccionado</p>
                <p className="text-xl font-bold text-[var(--pv-ink)] uppercase font-roman">{serviceName}</p>
              </div>
              
              {lawyerName && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[var(--pv-navy)] opacity-40 mb-1">Abogada asignada</p>
                  <p className="text-lg font-bold text-[var(--pv-ink)]">{lawyerName}</p>
                </div>
              )}
              
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--pv-navy)] opacity-40 mb-1">Fecha y hora</p>
                <p className="text-lg font-bold text-[var(--pv-ink)] uppercase">{date} · {time}</p>
              </div>
           </div>
        </div>

        {/* Payment Card */}
        {paymentMethod === 'CASH' ? (
          <div className="neo-card !p-4 sm:!p-8 bg-emerald-800 text-white border-none shadow-2xl relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-1000">
               <Banknote size={140} />
            </div>

            <div className="relative z-10 h-full flex flex-col">
              <h3 className="font-roman text-sm font-bold uppercase tracking-[0.2em] text-emerald-300 mb-4">Pago en Efectivo</h3>
              <p className="text-sm font-medium text-white/70 leading-relaxed mb-8">
                Tu cita está confirmada. Abona el anticipo directamente en la oficina el día de tu consulta.
              </p>
              
              <div className="mb-8 p-6 rounded-2xl bg-white/5 border border-white/10 shadow-inner">
                 <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300 mb-2">Importe a abonar en oficina</p>
                 <div className="text-3xl sm:text-5xl font-black text-white font-roman">{formatEuro(CONSULTATION_DEPOSIT_AMOUNT)}</div>
                 
                 {price > 0 && (
                   <div className="mt-6 space-y-2 border-t border-white/10 pt-4">
                     <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-white/40">
                        <span>Total trámite:</span>
                        <span>{formatEuro(price)}</span>
                     </div>
                     {price > CONSULTATION_DEPOSIT_AMOUNT && (
                       <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-emerald-300">
                          <span>Restante:</span>
                          <span>{formatEuro(remainingAfterDeposit)}</span>
                       </div>
                     )}
                   </div>
                 )}
              </div>

              <div className="p-4 rounded-xl bg-white/10 border border-white/10 flex items-start gap-3 mt-auto">
                 <MapPin size={18} className="text-emerald-300 shrink-0 mt-0.5" />
                 <p className="text-xs text-white/80 leading-relaxed">
                   Presenta este comprobante al llegar a la oficina. Recibirás un email con los detalles de tu cita.
                 </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="neo-card !p-4 sm:!p-8 bg-[var(--pv-navy)] text-white border-none shadow-2xl relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-1000">
               <Banknote size={140} />
            </div>

            <div className="relative z-10 h-full flex flex-col">
              <h3 className="font-roman text-sm font-bold uppercase tracking-[0.2em] text-[var(--pv-gold)] mb-4">Pago por Bizum</h3>
              <p className="text-sm font-medium text-white/70 leading-relaxed mb-8">
                Tu cita está reservada. Nos pondremos en contacto contigo para facilitarte los detalles y abonar el anticipo mediante Bizum.
              </p>
              
              <div className="mb-8 p-6 rounded-2xl bg-white/5 border border-white/10 shadow-inner">
                 <p className="text-[10px] font-black uppercase tracking-widest text-[var(--pv-gold)] mb-2">Importe del anticipo</p>
                 <div className="text-3xl sm:text-5xl font-black text-white font-roman">{formatEuro(CONSULTATION_DEPOSIT_AMOUNT)}</div>
                 
                 <div className="mt-6 space-y-2 border-t border-white/10 pt-4">
                    {price > 0 && (
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-white/40">
                         <span>Total trámite:</span>
                         <span>{formatEuro(price)}</span>
                      </div>
                    )}
                    {price > CONSULTATION_DEPOSIT_AMOUNT && (
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-[var(--pv-gold)]">
                         <span>Restante:</span>
                         <span>{formatEuro(remainingAfterDeposit)}</span>
                      </div>
                    )}
                 </div>
              </div>

              <div className="p-4 rounded-xl bg-[var(--pv-gold)]/10 border border-[var(--pv-gold)]/20 flex items-start gap-3 mt-auto">
                 <CheckCircle2 size={18} className="text-[var(--pv-gold)] shrink-0 mt-0.5" />
                 <p className="text-xs text-[var(--pv-gold)] leading-relaxed">
                   Hemos enviado un email a tu correo con los detalles de tu cita. Revisa tu bandeja de entrada.
                 </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Info Boxes */}
      <div className="mt-12 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="p-6 rounded-2xl bg-white border border-[var(--pv-marble)] shadow-sm flex items-start gap-4">
            <div className="p-2 bg-[var(--pv-marble)] text-[var(--pv-gold)] rounded-xl">
               <Mail size={20} />
            </div>
            <div>
               <p className="text-xs font-bold text-[var(--pv-ink)] uppercase tracking-tight">Email enviado</p>
               <p className="text-[11px] text-[var(--pv-navy)] opacity-60 mt-1 leading-relaxed">Revisa tu bandeja de entrada; te hemos enviado la información de la cita.</p>
            </div>
         </div>
         
         <div className="p-6 rounded-2xl bg-white border border-[var(--pv-marble)] shadow-sm flex items-start gap-4 group">
            <div className="p-2 bg-[var(--pv-marble)] text-[var(--pv-gold)] rounded-xl group-hover:bg-[var(--pv-gold)] group-hover:text-white transition-all">
               <ExternalLink size={20} />
            </div>
            <div>
               <p className="text-xs font-bold text-[var(--pv-ink)] uppercase tracking-tight">Mi Portal</p>
               <p className="text-[11px] text-[var(--pv-navy)] opacity-60 mt-1 leading-relaxed">
                  Consulta el estado de tu cita, pagos y notificaciones en <Link href="/portal" className="text-[var(--pv-gold)] font-black hover:underline">Mi Portal</Link>.
               </p>
            </div>
         </div>
      </div>

      <div className="mt-12 flex justify-center gap-6">
         <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--pv-navy)] opacity-40 hover:opacity-100 hover:text-[var(--pv-gold)] transition-all"
        >
          <RefreshCw size={14} /> Reservar Nueva Cita
        </button>
      </div>

      <style jsx>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
