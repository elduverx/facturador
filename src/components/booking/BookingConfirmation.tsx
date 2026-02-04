'use client';

interface Props {
  clientName: string;
  serviceName: string;
  date: string;
  time: string;
}

export function BookingConfirmation({ clientName, serviceName, date, time }: Props) {
  return (
    <div className="text-center py-6">
      <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0D9488" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>

      <h2 className="text-xl font-semibold mb-2">Cita registrada</h2>
      <p className="text-stone-500 text-sm mb-6">
        Gracias {clientName}, su cita ha sido registrada correctamente.
      </p>

      <div className="bg-teal-50 border border-teal-200 rounded-xl p-5 text-left max-w-sm mx-auto mb-6">
        <div className="space-y-3">
          <div>
            <div className="text-xs text-teal-600 font-medium">Servicio</div>
            <div className="text-sm font-semibold">{serviceName}</div>
          </div>
          <div>
            <div className="text-xs text-teal-600 font-medium">Fecha</div>
            <div className="text-sm font-semibold">{date}</div>
          </div>
          <div>
            <div className="text-xs text-teal-600 font-medium">Hora</div>
            <div className="text-sm font-semibold">{time}</div>
          </div>
        </div>
      </div>

      <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 text-sm text-stone-600">
        <p>Le hemos enviado un email de confirmacion con los detalles de su cita.</p>
        <p className="mt-2">Recuerde traer toda la documentacion relacionada con su tramite.</p>
      </div>

      <button
        onClick={() => window.location.reload()}
        className="btn btn-primary mt-6"
      >
        Reservar otra cita
      </button>
    </div>
  );
}
