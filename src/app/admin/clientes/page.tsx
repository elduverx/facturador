'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AppointmentData } from '@/types/booking';
import { ClientProfile360 } from '@/components/admin/crm/ClientProfile360';
import { Users, Search, ChevronRight } from 'lucide-react';
import { formatDateShort } from '@/lib/constants';

interface ClientInfo {
  name: string;
  email: string;
  phone: string;
  nie: string | null;
  totalAppointments: number;
  lastVisit: string;
}

function ClientesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams?.get('email');

  const [clients, setClients] = useState<ClientInfo[]>([]);
  const [selectedClient, setSelectedClient] = useState<string | null>(emailParam || null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [newClientData, setNewClientData] = useState({ name: '', email: '', phone: '', nie: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (emailParam && !selectedClient) {
       setSelectedClient(emailParam);
    }
  }, [emailParam]);

  const loadClients = async () => {
    try {
      const res = await fetch('/api/admin/clients');
      const data = await res.json();

      if (!Array.isArray(data)) {
        setClients([]);
        return;
      }
      setClients(data);
    } catch {
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClientData)
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al crear cliente');
      }

      await loadClients();
      setShowNewClientModal(false);
      setNewClientData({ name: '', email: '', phone: '', nie: '' });
      setSelectedClient(data.email); // Auto-open the new client profile
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const selectedClientData = clients.find((c) => c.email === selectedClient);

  if (selectedClient && loading) {
    return (
      <div className="h-[calc(100vh-80px)] flex items-center justify-center rounded-2xl shadow-xl border border-[var(--pv-marble)] bg-[var(--pv-marble)]/30">
        <div className="text-sm font-bold uppercase tracking-widest text-[var(--pv-navy)]/40 animate-pulse">
           Cargando perfil del cliente...
        </div>
      </div>
    );
  }

  if (selectedClientData) {
    return (
      <div className="h-[calc(100vh-80px)] overflow-hidden rounded-2xl shadow-xl border border-[var(--pv-marble)] bg-[var(--pv-marble)]">
        <ClientProfile360 
          client={selectedClientData} 
          onBack={() => {
            setSelectedClient(null);
            router.replace('/admin/clientes');
          }} 
          onClientUpdated={loadClients}
        />
      </div>
    );
  }

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.nie && c.nie.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-roman text-2xl font-bold uppercase tracking-tight text-[var(--pv-ink)]">
            Directorio de Clientes
          </h1>
          <p className="text-sm text-[var(--pv-navy)]/60 mt-1">
            Gestiona los perfiles, documentos y expedientes de todos los clientes.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--pv-navy)]/40" />
            <input
              type="text"
              placeholder="Buscar cliente..."
              className="neo-input !py-2.5 !pl-10 !text-sm w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowNewClientModal(true)}
            className="btn-roman !py-2.5 !px-5 w-full sm:w-auto"
          >
            Nuevo Cliente
          </button>
        </div>
      </div>

      {showNewClientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--pv-navy)]/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative">
            <h2 className="font-roman text-xl font-bold text-[var(--pv-ink)] uppercase mb-6">Añadir Nuevo Cliente</h2>
            <form onSubmit={handleCreateClient} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--pv-navy)]/50 mb-1 ml-2">Nombre completo</label>
                <input required type="text" className="neo-input w-full" value={newClientData.name} onChange={e => setNewClientData({...newClientData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--pv-navy)]/50 mb-1 ml-2">Email</label>
                <input required type="email" className="neo-input w-full" value={newClientData.email} onChange={e => setNewClientData({...newClientData, email: e.target.value})} />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--pv-navy)]/50 mb-1 ml-2">Teléfono</label>
                <input required type="tel" className="neo-input w-full" value={newClientData.phone} onChange={e => setNewClientData({...newClientData, phone: e.target.value})} />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--pv-navy)]/50 mb-1 ml-2">NIE / DNI (Opcional)</label>
                <input type="text" className="neo-input w-full" value={newClientData.nie} onChange={e => setNewClientData({...newClientData, nie: e.target.value})} />
              </div>
              
              {errorMsg && <p className="text-red-500 text-xs font-bold">{errorMsg}</p>}

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowNewClientModal(false)} className="flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest text-[var(--pv-navy)] bg-[var(--pv-marble)] hover:bg-stone-200 transition-colors">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest text-white bg-[var(--pv-gold)] hover:bg-[#b8914b] transition-colors">{isSubmitting ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-sm font-bold uppercase tracking-widest text-[var(--pv-navy)]/40 animate-pulse">
          Cargando clientes...
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="neo-card !p-12 text-center flex flex-col items-center justify-center">
          <Users size={32} className="text-[var(--pv-navy)]/20 mb-3" />
          <p className="text-sm font-bold text-[var(--pv-ink)] uppercase tracking-widest">No se encontraron clientes</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredClients.map((client) => (
            <button
              key={client.email}
              onClick={() => setSelectedClient(client.email)}
              className="neo-card !p-5 bg-white text-left group hover:border-[var(--pv-gold)]/50 transition-colors flex flex-col justify-between"
            >
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-[var(--pv-marble)] flex items-center justify-center text-[var(--pv-gold)] font-roman font-bold text-lg group-hover:bg-[var(--pv-gold)] group-hover:text-white transition-colors shrink-0">
                  {client.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-[var(--pv-ink)] truncate pr-2">{client.name}</h3>
                  <div className="text-xs text-[var(--pv-navy)]/60 mt-1 flex flex-col gap-0.5">
                    <span className="truncate">{client.email}</span>
                    <span>{client.phone}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-[var(--pv-marble)] flex items-center justify-between text-xs font-medium text-[var(--pv-navy)]/60">
                 <span>Última cita: {formatDateShort(client.lastVisit)}</span>
                 <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[var(--pv-gold)] opacity-0 group-hover:opacity-100 transition-opacity">
                   Abrir perfil <ChevronRight size={14} />
                 </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ClientesPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm font-bold uppercase tracking-widest text-[var(--pv-navy)]/40 animate-pulse">Cargando directorio...</div>}>
      <ClientesPageContent />
    </Suspense>
  );
}
