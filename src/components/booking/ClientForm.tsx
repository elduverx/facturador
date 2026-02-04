'use client';

import { normalizeEmail, normalizeNie, normalizePhone } from '@/lib/validation';

interface FormData {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientNie: string;
  notes: string;
}

interface Props {
  data: FormData;
  onChange: (data: FormData) => void;
  errors: Record<string, string>;
}

export function ClientForm({ data, onChange, errors }: Props) {
  const update = (field: keyof FormData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div>
      <h2 className="text-base sm:text-lg font-semibold mb-1">Sus datos de contacto</h2>
      <p className="text-xs sm:text-sm text-stone-500 mb-3 sm:mb-5">Complete sus datos para confirmar la reserva</p>

      <div className="space-y-3 sm:space-y-4">
        <div>
          <label className="form-label block text-xs sm:text-sm">Nombre completo *</label>
          <input
            type="text"
            className={`form-input text-xs sm:text-sm ${errors.clientName ? 'border-red-400' : ''}`}
            placeholder="Su nombre y apellidos"
            value={data.clientName}
            onChange={(e) => update('clientName', e.target.value)}
          />
          {errors.clientName && <p className="text-xs text-red-500 mt-1">{errors.clientName}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
          <label className="form-label block text-xs sm:text-sm">Email *</label>
          <input
            type="email"
            className={`form-input text-xs sm:text-sm ${errors.clientEmail ? 'border-red-400' : ''}`}
            placeholder="su@email.com"
            value={data.clientEmail}
            onChange={(e) => update('clientEmail', normalizeEmail(e.target.value))}
          />
            {errors.clientEmail && <p className="text-xs text-red-500 mt-1">{errors.clientEmail}</p>}
          </div>
          <div>
          <label className="form-label block text-xs sm:text-sm">Telefono *</label>
          <input
            type="tel"
            className={`form-input text-xs sm:text-sm ${errors.clientPhone ? 'border-red-400' : ''}`}
            placeholder="600000000"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={9}
            value={data.clientPhone}
            onChange={(e) => update('clientPhone', normalizePhone(e.target.value))}
          />
          {errors.clientPhone && <p className="text-xs text-red-500 mt-1">{errors.clientPhone}</p>}
        </div>
        </div>

        <div>
          <label className="form-label block text-xs sm:text-sm">NIE / Pasaporte</label>
          <input
            type="text"
            className="form-input text-xs sm:text-sm"
            placeholder="X1234567A o numero de pasaporte"
            value={data.clientNie}
            onChange={(e) => update('clientNie', normalizeNie(e.target.value))}
          />
          <p className="text-[11px] sm:text-xs text-stone-400 mt-1">Opcional, pero ayuda a agilizar el tramite</p>
        </div>

        <div>
          <label className="form-label block text-xs sm:text-sm">Notas sobre su caso</label>
          <textarea
            className="form-input text-xs sm:text-sm min-h-[80px] sm:min-h-[100px]"
            placeholder="Describa brevemente su situacion o consulta..."
            value={data.notes}
            onChange={(e) => update('notes', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
