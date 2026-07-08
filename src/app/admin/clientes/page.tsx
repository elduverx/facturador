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

  useEffect(() => {
    if (emailParam && !selectedClient) {
       setSelectedClient(emailParam);
    }
  }, [emailParam]);

  const loadClients = async () => {
    try {
      const res = await fetch('/api/appointments');
      const data: AppointmentData[] = await res.json();

      if (!Array.isArray(data)) {
        setClients([]);
        return;
      }

      const clientMap = new Map<string, ClientInfo>();
      data.forEach((appt) => {
        const existing = clientMap.get(appt.clientEmail);
        const apptDate = typeof appt.date === 'string' ? appt.date.split('T')[0] : new Date(appt.date).toISOString().split('T')[0];

        if (!existing) {
          clientMap.set(appt.clientEmail, {
            name: appt.clientName,
            email: appt.clientEmail,
            phone: appt.clientPhone,
            nie: appt.clientNie,
            totalAppointments: 1,
            lastVisit: apptDate,
          });
        } else {
          existing.totalAppointments++;
          if (apptDate > existing.lastVisit) {
            existing.lastVisit = apptDate;
            existing.name = appt.clientName;
            existing.phone = appt.clientPhone;
            if (appt.clientNie) existing.nie = appt.clientNie;
          }
        }
      });

      const sorted = Array.from(clientMap.values()).sort((a, b) => b.lastVisit.localeCompare(a.lastVisit));
      setClients(sorted);
    } catch {
      setClients([]);
    } finally {
      setLoading(false);
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
        <div className="relative w-full sm:w-72">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--pv-navy)]/40" />
          <input
            type="text"
            placeholder="Buscar por nombre, email, teléfono o NIE..."
            className="neo-input !py-2.5 !pl-10 !text-sm w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

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
