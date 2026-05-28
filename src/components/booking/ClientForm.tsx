'use client';

import { normalizeEmail, normalizeNie, normalizePhone } from '@/lib/validation';
import { User, Mail, Phone, Fingerprint, MessageSquare } from 'lucide-react';

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
    <div className="animate-fade-in">
      <h2 className="text-xl sm:text-3xl font-bold font-roman uppercase text-[var(--pv-ink)] mb-2 sm:mb-3 tracking-tighter">Tus datos de contacto</h2>
      <p className="text-xs sm:text-sm text-[var(--pv-navy)] opacity-60 mb-4 sm:mb-10 leading-relaxed font-medium">
        Usaremos estos datos para confirmar la cita, asociarla a tu historial y mantener actualizado tu portal.
      </p>

      <div className="space-y-3 sm:space-y-6">
        <div className="space-y-1">
          <label className="text-[9px] sm:text-[10px] font-black uppercase text-[var(--pv-gold)] tracking-widest ml-4">Nombre Completo *</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--pv-gold)]" size={18} />
            <input
              type="text"
              className={`neo-input !py-2.5 sm:!py-3 pl-12 ${errors.clientName ? 'ring-2 ring-red-400 bg-red-50' : ''}`}
              placeholder="Marcus Aurelius"
              value={data.clientName}
              onChange={(e) => update('clientName', e.target.value)}
            />
          </div>
          {errors.clientName && <p className="text-[10px] font-bold text-red-500 mt-1 ml-4 uppercase">{errors.clientName}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-[var(--pv-gold)] tracking-widest ml-4">Email de Notificación *</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--pv-gold)]" size={18} />
              <input
                type="email"
                className={`neo-input !py-2.5 sm:!py-3 pl-12 ${errors.clientEmail ? 'ring-2 ring-red-400 bg-red-50' : ''}`}
                placeholder="correo@ejemplo.com"
                value={data.clientEmail}
                onChange={(e) => update('clientEmail', normalizeEmail(e.target.value))}
              />
            </div>
            {errors.clientEmail && <p className="text-[10px] font-bold text-red-500 mt-1 ml-4 uppercase">{errors.clientEmail}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-[var(--pv-gold)] tracking-widest ml-4">Teléfono Móvil *</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--pv-gold)]" size={18} />
              <input
                type="tel"
                className={`neo-input !py-2.5 sm:!py-3 pl-12 ${errors.clientPhone ? 'ring-2 ring-red-400 bg-red-50' : ''}`}
                placeholder="600000000"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={9}
                value={data.clientPhone}
                onChange={(e) => update('clientPhone', normalizePhone(e.target.value))}
              />
            </div>
            {errors.clientPhone && <p className="text-[10px] font-bold text-red-500 mt-1 ml-4 uppercase">{errors.clientPhone}</p>}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-[var(--pv-gold)] tracking-widest ml-4">NIE / Pasaporte / DNI</label>
          <div className="relative">
            <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--pv-gold)]" size={18} />
            <input
              type="text"
              className="neo-input !py-2.5 sm:!py-3 pl-12"
              placeholder="X1234567A"
              value={data.clientNie}
              onChange={(e) => update('clientNie', normalizeNie(e.target.value))}
            />
          </div>
          <p className="text-[10px] font-bold text-[var(--pv-navy)] opacity-40 mt-2 ml-4 uppercase tracking-widest italic">Ayuda a localizar tu expediente más rápido</p>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-[var(--pv-gold)] tracking-widest ml-4">Comentario sobre tu caso</label>
          <div className="relative">
             <MessageSquare className="absolute left-4 top-6 text-[var(--pv-gold)]" size={18} />
             <textarea
              className="neo-input pl-12 min-h-[88px] sm:min-h-[120px] resize-none"
              placeholder="Cuéntanos brevemente qué necesitas revisar en la cita..."
              value={data.notes}
              onChange={(e) => update('notes', e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
