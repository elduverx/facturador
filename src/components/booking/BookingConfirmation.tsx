'use client';

import { CONSULTATION_DEPOSIT_AMOUNT, formatEuro } from '@/lib/payments';

interface Props {
  appointmentId: string;
  clientName: string;
  serviceName: string;
  lawyerName?: string;
  date: string;
  time: string;
  price: number;
}

export function BookingConfirmation({ appointmentId, clientName, serviceName, lawyerName, date, time, price }: Props) {
  const handlePay = () => {
    window.location.href = `/api/payments/redsys?appointmentId=${appointmentId}`;
  };

  const remainingAfterDeposit = Math.max(0, price - CONSULTATION_DEPOSIT_AMOUNT);

  return (
    <div className="text-center py-6">
      <div className="pv-seal w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>

      <h2 className="font-legal text-2xl text-[var(--pv-navy)] mb-2">Cita registrada</h2>
      <p className="text-[var(--pv-muted)] text-sm mb-6">
        Gracias {clientName}, su cita ha sido registrada correctamente.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
        <div className="bg-[#fff8e8]/70 border border-[var(--pv-line)] rounded-md p-5 text-left shadow-sm">
          <h3 className="font-legal text-xs text-[var(--pv-navy)] uppercase tracking-wider mb-4">Resumen de la cita</h3>
          <div className="space-y-3">
            <div>
              <div className="text-[10px] text-[var(--pv-muted)] font-bold uppercase tracking-wide">Servicio</div>
              <div className="text-sm font-semibold text-[var(--pv-navy)]">{serviceName}</div>
            </div>
            {lawyerName && (
              <div>
                <div className="text-[10px] text-[var(--pv-muted)] font-bold uppercase tracking-wide">Abogada</div>
                <div className="text-sm font-semibold text-[var(--pv-navy)]">{lawyerName}</div>
              </div>
            )}
            <div>
              <div className="text-[10px] text-[var(--pv-muted)] font-bold uppercase tracking-wide">Fecha y hora</div>
              <div className="text-sm font-semibold text-[var(--pv-navy)]">{date} a las {time}</div>
            </div>
          </div>
        </div>

        <div className="bg-[#0b1f2d] border border-[var(--pv-gold)] rounded-md p-5 text-left shadow-sm flex flex-col justify-between text-[#f8f1df]">
          <div>
            <h3 className="font-legal text-xs uppercase tracking-wider mb-2 text-[#ead9ad]">Anticipo de consulta</h3>
            <p className="text-[11px] text-[#d8c7a0] leading-relaxed mb-4">
              Para confirmar la reserva se cobra un anticipo de consulta. Este importe se descontara del total de la consulta o servicio.
            </p>
            <div className="text-3xl font-bold mb-2">{formatEuro(CONSULTATION_DEPOSIT_AMOUNT)}</div>
            <div className="text-[11px] text-[#d8c7a0] space-y-1 mb-4">
              {price > 0 && <div>Total estimado: {formatEuro(price)}</div>}
              {price > CONSULTATION_DEPOSIT_AMOUNT && <div>Resto estimado tras descuento: {formatEuro(remainingAfterDeposit)}</div>}
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex gap-2 overflow-x-auto pb-1 snap-x">
              {['Redsys', 'Tarjeta bancaria', 'Pago seguro'].map((label) => (
                <div key={label} className="snap-start shrink-0 min-w-[120px] rounded-md border border-[#c8aa6a]/50 bg-white/5 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-[#ead9ad]">{label}</div>
                </div>
              ))}
            </div>
            <button onClick={handlePay} className="btn btn-primary w-full justify-center text-sm">
              Pagar anticipo por Redsys
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-[#fff8e8]/70 border border-[var(--pv-line)] rounded-md p-4 text-xs text-[var(--pv-muted)] max-w-2xl mx-auto flex items-start gap-3 text-left">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0"><path d="M4 4h16v16H4z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
        <p>
          Le hemos enviado un email con los detalles. Puede consultar el estado de su tramite, sus citas y documentos en{' '}
          <a href="/portal" className="font-semibold text-[var(--pv-navy)] underline">
            Mi Portal
          </a>
          {' '}usando su email y telefono.
        </p>
      </div>

      <button
        onClick={() => window.location.reload()}
        className="text-[var(--pv-muted)] hover:text-[var(--pv-navy)] text-xs mt-8 underline"
      >
        Reservar otra cita
      </button>
    </div>
  );
}
