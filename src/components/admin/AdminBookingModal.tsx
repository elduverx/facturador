'use client';

import { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Clock, User, Mail, Phone, CreditCard, Banknote, Briefcase } from 'lucide-react';
import { normalizePhone, normalizeEmail, normalizeNie } from '@/lib/validation';

interface Service {
  id: string;
  name: string;
}

interface Staff {
  id: string;
  name: string;
  loginSlug: string;
}

interface AdminBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AdminBookingModal({ isOpen, onClose, onSuccess }: AdminBookingModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  
  const [existingClients, setExistingClients] = useState<any[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientNie: '',
    date: '',
    startTime: '',
    serviceId: '',
    lawyerId: '',
    paymentMethod: 'CASH',
    notes: 'Cita creada manualmente por administración.'
  });

  useEffect(() => {
    if (isOpen) {
      fetch('/api/services').then(res => res.json()).then(data => setServices(data || []));
      fetch('/api/admin/staff').then(res => res.json()).then(data => setStaff(data || []));
      fetch('/api/appointments').then(res => res.json()).then(data => {
        const clientsMap = new Map();
        (data || []).forEach((apt: any) => {
          if (apt.clientEmail && !clientsMap.has(apt.clientEmail)) {
            clientsMap.set(apt.clientEmail, {
              clientName: apt.clientName,
              clientEmail: apt.clientEmail,
              clientPhone: apt.clientPhone,
              clientNie: apt.clientNie || ''
            });
          }
        });
        setExistingClients(Array.from(clientsMap.values()));
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Error al crear la cita');
      }
      
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl w-full shadow-2xl overflow-hidden flex flex-col border border-[var(--pv-gold)]/20 animate-fade-in">
        
        {/* Header */}
        <div className="bg-[var(--pv-navy)] p-6 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-bold font-roman uppercase text-white tracking-widest">Nueva Cita Manual</h2>
            <p className="text-[10px] text-white/60 font-medium uppercase tracking-[0.2em] mt-1">Agendar evento desde panel de control</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center hover:bg-red-500 transition-colors" title="Cancelar">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium flex items-center gap-2">
              <span className="font-bold">Error:</span> {error}
            </div>
          )}

          <form id="admin-booking-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Cliente */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--pv-marble)] pb-2">
                <h3 className="text-[10px] font-black text-[var(--pv-gold)] uppercase tracking-[0.2em]">Datos del Cliente</h3>
              </div>

              {existingClients.length > 0 && (
                <div className="relative">
                  <label className="block text-xs font-bold text-[var(--pv-ink)] mb-1">Buscar cliente existente (Autocompletar)</label>
                  <input
                    type="text"
                    value={clientSearch}
                    onChange={(e) => {
                      setClientSearch(e.target.value);
                      setShowClientDropdown(true);
                    }}
                    onFocus={() => setShowClientDropdown(true)}
                    onBlur={() => setTimeout(() => setShowClientDropdown(false), 200)}
                    placeholder="Escribe nombre o email para buscar..."
                    className="w-full px-4 py-3 rounded-xl border border-[var(--glass-border)] bg-[var(--pv-marble)] text-sm focus:border-[var(--pv-gold)] focus:ring-1 focus:ring-[var(--pv-gold)] outline-none transition-all"
                  />
                  
                  {showClientDropdown && clientSearch && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-[var(--glass-border)] rounded-xl shadow-xl max-h-60 overflow-y-auto">
                      {existingClients.filter(c => 
                        c.clientName.toLowerCase().includes(clientSearch.toLowerCase()) || 
                        c.clientEmail.toLowerCase().includes(clientSearch.toLowerCase())
                      ).length === 0 ? (
                        <div className="p-3 text-sm text-gray-500">No se encontraron clientes.</div>
                      ) : (
                        existingClients.filter(c => 
                          c.clientName.toLowerCase().includes(clientSearch.toLowerCase()) || 
                          c.clientEmail.toLowerCase().includes(clientSearch.toLowerCase())
                        ).map(c => (
                          <div 
                            key={c.clientEmail}
                            className="p-3 hover:bg-[var(--pv-marble)] cursor-pointer text-sm border-b last:border-0 border-[var(--glass-border)]"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                clientName: c.clientName,
                                clientEmail: c.clientEmail,
                                clientPhone: c.clientPhone,
                                clientNie: c.clientNie
                              }));
                              setClientSearch(`${c.clientName} (${c.clientEmail})`);
                              setShowClientDropdown(false);
                            }}
                          >
                            <div className="font-bold text-[var(--pv-navy)]">{c.clientName}</div>
                            <div className="text-xs text-gray-500">{c.clientEmail}</div>
                          </div>
                        ))
                      )}
                      
                      <div 
                        className="p-3 bg-[var(--pv-gold)]/10 text-[var(--pv-gold)] hover:bg-[var(--pv-gold)] hover:text-white cursor-pointer text-sm font-bold transition-colors"
                        onClick={() => {
                           setFormData(prev => ({ ...prev, clientName: '', clientEmail: '', clientPhone: '', clientNie: '' }));
                           setClientSearch('');
                           setShowClientDropdown(false);
                        }}
                      >
                         + Limpiar / Cliente Nuevo
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--pv-ink)] mb-1">Nombre Completo *</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--pv-gold)]" />
                    <input 
                      required 
                      value={formData.clientName}
                      onChange={e => setFormData({...formData, clientName: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--glass-border)] bg-[var(--pv-marble)] text-sm focus:border-[var(--pv-gold)] focus:ring-1 focus:ring-[var(--pv-gold)] outline-none transition-all" 
                      placeholder="Nombre del cliente" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--pv-ink)] mb-1">NIE / Pasaporte</label>
                  <div className="relative">
                    <CreditCard size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--pv-gold)]" />
                    <input 
                      value={formData.clientNie}
                      onChange={e => setFormData({...formData, clientNie: normalizeNie(e.target.value)})}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--glass-border)] bg-[var(--pv-marble)] text-sm focus:border-[var(--pv-gold)] focus:ring-1 focus:ring-[var(--pv-gold)] outline-none transition-all" 
                      placeholder="Opcional" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--pv-ink)] mb-1">Email *</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--pv-gold)]" />
                    <input 
                      required type="email"
                      value={formData.clientEmail}
                      onChange={e => setFormData({...formData, clientEmail: normalizeEmail(e.target.value)})}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--glass-border)] bg-[var(--pv-marble)] text-sm focus:border-[var(--pv-gold)] focus:ring-1 focus:ring-[var(--pv-gold)] outline-none transition-all" 
                      placeholder="email@ejemplo.com" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--pv-ink)] mb-1">Teléfono *</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--pv-gold)]" />
                    <input 
                      required
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={9}
                      value={formData.clientPhone}
                      onChange={e => setFormData({...formData, clientPhone: normalizePhone(e.target.value)})}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--glass-border)] bg-[var(--pv-marble)] text-sm focus:border-[var(--pv-gold)] focus:ring-1 focus:ring-[var(--pv-gold)] outline-none transition-all" 
                      placeholder="600000000" 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Servicio y Abogada */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-[var(--pv-gold)] uppercase tracking-[0.2em] border-b border-[var(--pv-marble)] pb-2">Servicio y Abogada</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--pv-ink)] mb-1">Trámite / Servicio *</label>
                  <select 
                    required
                    value={formData.serviceId}
                    onChange={e => setFormData({...formData, serviceId: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-[var(--glass-border)] bg-[var(--pv-marble)] text-sm focus:border-[var(--pv-gold)] focus:ring-1 focus:ring-[var(--pv-gold)] outline-none transition-all"
                  >
                    <option value="">Seleccione un servicio</option>
                    {services.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--pv-ink)] mb-1">Abogada Asignada</label>
                  <select 
                    value={formData.lawyerId}
                    onChange={e => setFormData({...formData, lawyerId: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-[var(--glass-border)] bg-[var(--pv-marble)] text-sm focus:border-[var(--pv-gold)] focus:ring-1 focus:ring-[var(--pv-gold)] outline-none transition-all"
                  >
                    <option value="">Sin preferencia / Aleatoria</option>
                    {staff.map(s => (
                      <option key={s.id} value={s.loginSlug}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Fecha y Hora */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-[var(--pv-gold)] uppercase tracking-[0.2em] border-b border-[var(--pv-marble)] pb-2">Fecha y Hora</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--pv-ink)] mb-1">Fecha de la Cita *</label>
                  <div className="relative">
                    <CalendarIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--pv-gold)] pointer-events-none" />
                    <input 
                      required type="date"
                      value={formData.date}
                      onChange={e => setFormData({...formData, date: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--glass-border)] bg-white text-sm focus:border-[var(--pv-gold)] focus:ring-1 focus:ring-[var(--pv-gold)] outline-none transition-all" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--pv-ink)] mb-1">Hora de inicio (ej: 10:00) *</label>
                  <div className="relative">
                    <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--pv-gold)] pointer-events-none" />
                    <input 
                      required type="time"
                      value={formData.startTime}
                      onChange={e => setFormData({...formData, startTime: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--glass-border)] bg-white text-sm focus:border-[var(--pv-gold)] focus:ring-1 focus:ring-[var(--pv-gold)] outline-none transition-all" 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Opciones Adicionales */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-[var(--pv-gold)] uppercase tracking-[0.2em] border-b border-[var(--pv-marble)] pb-2">Opciones de Pago</h3>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-[var(--pv-navy)] font-bold">
                  <input type="radio" name="payment" checked={formData.paymentMethod === 'CASH'} onChange={() => setFormData({...formData, paymentMethod: 'CASH'})} className="accent-[var(--pv-gold)]" />
                  <Banknote size={16} className="text-emerald-500" /> Confirmada Directamente / Efectivo / Exenta
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm text-[var(--pv-navy)] font-bold">
                  <input type="radio" name="payment" checked={formData.paymentMethod === 'CARD'} onChange={() => setFormData({...formData, paymentMethod: 'CARD'})} className="accent-[var(--pv-gold)]" />
                  <CreditCard size={16} className="text-[var(--pv-gold)]" /> Pendiente de Pago
                </label>
              </div>
              <textarea 
                value={formData.notes}
                onChange={e => setFormData({...formData, notes: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-[var(--glass-border)] bg-[var(--pv-marble)] text-sm focus:border-[var(--pv-gold)] focus:ring-1 focus:ring-[var(--pv-gold)] outline-none transition-all min-h-[80px]"
                placeholder="Notas internas..."
              />
            </div>
            
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 bg-[var(--pv-marble)] border-t border-[var(--glass-border)] flex justify-end gap-3 shrink-0">
          <button 
            type="button" 
            onClick={onClose}
            className="px-6 py-3 rounded-xl text-sm font-bold text-[var(--pv-navy)] hover:bg-black/5 transition-colors"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            form="admin-booking-form"
            disabled={loading}
            className="px-8 py-3 rounded-xl text-sm font-bold bg-[var(--pv-gold)] text-white hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[var(--pv-gold)]/20"
          >
            {loading ? 'Guardando...' : 'Crear Cita'}
          </button>
        </div>

    </div>
  );
}
