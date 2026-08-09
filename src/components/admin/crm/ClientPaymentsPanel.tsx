'use client';

import { useState, useEffect } from 'react';
import { Wallet, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { formatDateShort } from '@/lib/constants';

interface ClientPaymentsPanelProps {
  clientEmail: string;
}

export function ClientPaymentsPanel({ clientEmail }: ClientPaymentsPanelProps) {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await fetch(`/api/admin/clients/${encodeURIComponent(clientEmail)}/payments`);
        if (res.ok) {
          const data = await res.json();
          setPayments(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, [clientEmail]);

  if (loading) {
    return (
      <div className="p-12 text-center text-[var(--pv-navy)]/50 text-xs font-bold uppercase tracking-widest animate-pulse">
        Cargando historial de pagos...
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="p-12 text-center neo-card bg-white/50 border-dashed">
        <Wallet size={32} className="mx-auto text-[var(--pv-navy)]/20 mb-3" />
        <p className="text-[var(--pv-navy)]/60 text-xs font-bold uppercase tracking-widest">No hay pagos registrados</p>
      </div>
    );
  }

  return (
    <div className="neo-card !p-0 bg-white overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-[var(--pv-marble)] bg-[var(--pv-marble)]/30 flex items-center justify-between">
        <div>
          <h3 className="font-roman text-sm font-bold uppercase tracking-widest text-[var(--pv-ink)]">
            Historial de Pagos
          </h3>
          <p className="text-xs font-medium text-[var(--pv-navy)]/60 mt-1">
            Cobros, facturas y reservas
          </p>
        </div>
      </div>
      <div className="divide-y divide-[var(--pv-marble)]">
        {payments.map((p) => (
          <div key={p.id} className="p-4 sm:p-6 hover:bg-[var(--pv-marble)]/20 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[var(--pv-gold)]/10 text-[var(--pv-gold)] flex items-center justify-center shrink-0">
                <Wallet size={18} />
              </div>
              <div>
                <p className="font-bold text-sm text-[var(--pv-ink)]">{p.concept}</p>
                <div className="flex items-center gap-2 mt-1 text-xs font-medium text-[var(--pv-navy)]/60">
                  <span>{formatDateShort(p.date)}</span>
                  <span>•</span>
                  <span>{p.typeLabel}</span>
                  {p.reference && (
                    <>
                      <span>•</span>
                      <span>Ref: {p.reference}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between sm:justify-end gap-6 sm:min-w-[150px]">
              <div className="text-right">
                <p className="text-lg font-black text-[var(--pv-ink)]">
                  {p.amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                </p>
                <div className="flex items-center justify-end gap-1 mt-1">
                  {p.status === 'PAID' ? (
                    <><CheckCircle2 size={12} className="text-emerald-500" /><span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Pagado</span></>
                  ) : p.status === 'PENDING' ? (
                    <><Clock size={12} className="text-amber-500" /><span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Pendiente</span></>
                  ) : (
                    <><XCircle size={12} className="text-red-500" /><span className="text-[10px] font-bold text-red-600 uppercase tracking-widest">Cancelado</span></>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
