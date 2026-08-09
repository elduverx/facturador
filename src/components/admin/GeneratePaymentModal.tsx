'use client';

import { useState, useEffect } from 'react';
import { X, Euro, FileText, User, Mail, Phone, Users } from 'lucide-react';

interface GeneratePaymentModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function GeneratePaymentModal({ onClose, onSuccess }: GeneratePaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [clients, setClients] = useState<any[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);

  const [selectedClientIndex, setSelectedClientIndex] = useState<string>('-1');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  
  const [concept, setConcept] = useState('');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await fetch('/api/admin/clients');
        if (res.ok) {
          const data = await res.json();
          setClients(data);
        }
      } catch (err) {
        console.error('Error fetching clients:', err);
      } finally {
        setLoadingClients(false);
      }
    };
    fetchClients();
  }, []);

  const handleClientSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const index = e.target.value;
    setSelectedClientIndex(index);
    if (index === '-1') {
      setClientName('');
      setClientEmail('');
      setClientPhone('');
    } else {
      const c = clients[parseInt(index, 10)];
      setClientName(c.name || '');
      setClientEmail(c.email || '');
      setClientPhone(c.phone || '');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/income/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName,
          clientEmail,
          clientPhone,
          concept,
          amount: parseFloat(amount),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al generar cobro');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--pv-ink)]/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-[var(--pv-marble)]">
          <div>
            <h2 className="font-roman text-xl font-bold text-[var(--pv-ink)]">Generar Cobro</h2>
            <p className="text-xs text-[var(--pv-navy)]/60 mt-1">Se mostrará en el portal del cliente</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--pv-marble)] text-[var(--pv-navy)] hover:bg-[var(--pv-gold)] hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs font-medium rounded-xl border border-red-100 mb-4">
              {error}
            </div>
          )}

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--pv-navy)]/60 mb-1.5 block ml-2">Seleccionar Cliente Registrado</label>
            <div className="relative mb-2">
              <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--pv-navy)]/40" />
              <select 
                value={selectedClientIndex} 
                onChange={handleClientSelect} 
                disabled={loadingClients}
                className="w-full bg-[var(--pv-marble)]/30 border border-[var(--pv-marble)] rounded-xl py-2.5 pl-9 pr-4 text-sm focus:border-[var(--pv-gold)] focus:ring-1 focus:ring-[var(--pv-gold)] outline-none appearance-none"
              >
                <option value="-1">Nuevo cliente (Ingresar manualmente)...</option>
                {clients.map((c, i) => (
                  <option key={c.email} value={i}>{c.name || c.email} ({c.email})</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--pv-navy)]/60 mb-1.5 block ml-2">Nombre del Cliente</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--pv-navy)]/40" />
              <input required type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} disabled={selectedClientIndex !== '-1'} className="w-full bg-[var(--pv-marble)]/30 border border-[var(--pv-marble)] rounded-xl py-2.5 pl-9 pr-4 text-sm focus:border-[var(--pv-gold)] focus:ring-1 focus:ring-[var(--pv-gold)] outline-none disabled:opacity-50" placeholder="Nombre completo" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-[var(--pv-navy)]/60 mb-1.5 block ml-2">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--pv-navy)]/40" />
                <input required type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} disabled={selectedClientIndex !== '-1'} className="w-full bg-[var(--pv-marble)]/30 border border-[var(--pv-marble)] rounded-xl py-2.5 pl-9 pr-4 text-sm focus:border-[var(--pv-gold)] focus:ring-1 focus:ring-[var(--pv-gold)] outline-none disabled:opacity-50" placeholder="correo@..." />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-[var(--pv-navy)]/60 mb-1.5 block ml-2">Teléfono</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--pv-navy)]/40" />
                <input required type="tel" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} disabled={selectedClientIndex !== '-1'} className="w-full bg-[var(--pv-marble)]/30 border border-[var(--pv-marble)] rounded-xl py-2.5 pl-9 pr-4 text-sm focus:border-[var(--pv-gold)] focus:ring-1 focus:ring-[var(--pv-gold)] outline-none disabled:opacity-50" placeholder="600123456" />
              </div>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--pv-navy)]/60 mb-1.5 block ml-2">Concepto</label>
            <div className="relative">
              <FileText size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--pv-navy)]/40" />
              <input required type="text" value={concept} onChange={(e) => setConcept(e.target.value)} className="w-full bg-[var(--pv-marble)]/30 border border-[var(--pv-marble)] rounded-xl py-2.5 pl-9 pr-4 text-sm focus:border-[var(--pv-gold)] focus:ring-1 focus:ring-[var(--pv-gold)] outline-none" placeholder="Ej. Provisión de fondos..." />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--pv-navy)]/60 mb-1.5 block ml-2">Importe (€)</label>
            <div className="relative">
              <Euro size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--pv-navy)]/40" />
              <input required type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-[var(--pv-marble)]/30 border border-[var(--pv-marble)] rounded-xl py-2.5 pl-9 pr-4 text-sm font-bold text-[var(--pv-ink)] focus:border-[var(--pv-gold)] focus:ring-1 focus:ring-[var(--pv-gold)] outline-none" placeholder="0.00" />
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--pv-marble)]">
            <button type="submit" disabled={loading} className="w-full py-3 bg-[var(--pv-ink)] text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-[var(--pv-gold)] transition-colors disabled:opacity-50">
              {loading ? 'Generando...' : 'Generar Pago'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
