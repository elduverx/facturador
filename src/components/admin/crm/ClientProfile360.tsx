'use client';

import { useState, useEffect } from 'react';
import { Calendar, FolderKanban, FileText, MessageSquare, ArrowLeft, Mail, Phone, Hash } from 'lucide-react';
import { AppointmentData } from '@/types/booking';
import { ClientDocumentsPanel } from '@/components/admin/ClientDocumentsPanel';
import { ClientMattersPanel } from './ClientMattersPanel';
import { ClientNotesPanel } from './ClientNotesPanel';

import { ClientAppointmentsPanel } from './ClientAppointmentsPanel';
import { ClientPaymentsPanel } from './ClientPaymentsPanel';
import { ClientEditModal } from './ClientEditModal';

interface ClientInfo {
  name: string;
  email: string;
  phone: string;
  nie: string | null;
  totalAppointments: number;
  lastVisit: string;
}

interface ClientProfile360Props {
  client: ClientInfo;
  onBack: () => void;
  onClientUpdated: () => void;
}

export function ClientProfile360({ client, onBack, onClientUpdated }: ClientProfile360Props) {
  const [activeTab, setActiveTab] = useState<'RESUMEN' | 'EXPEDIENTES' | 'DOCUMENTOS' | 'NOTAS' | 'PAGOS'>('RESUMEN');
  const [isEditing, setIsEditing] = useState(false);
  
  return (
    <div className="flex flex-col h-full bg-[var(--pv-marble)] animate-fade-in">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-[var(--glass-border)] p-4 sm:p-6 sticky top-0 z-10 shrink-0">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--pv-navy)]/60 hover:text-[var(--pv-gold)] transition-colors mb-4"
        >
          <ArrowLeft size={14} /> Volver a clientes
        </button>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[var(--pv-gold)] rounded-2xl flex items-center justify-center text-xl font-bold text-white shadow-lg">
              {client.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="font-roman text-2xl font-bold uppercase tracking-tight text-[var(--pv-ink)]">
                {client.name}
              </h2>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-xs font-medium text-[var(--pv-navy)]/70">
                <span className="flex items-center gap-1"><Mail size={12} /> {client.email}</span>
                <span className="flex items-center gap-1"><Phone size={12} /> {client.phone}</span>
                {client.nie && <span className="flex items-center gap-1"><Hash size={12} /> {client.nie}</span>}
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => setIsEditing(true)}
            className="btn-roman !py-2 !px-4 !text-[10px] whitespace-nowrap"
          >
            Editar Ficha
          </button>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto gap-2 mt-6 pb-2 custom-scrollbar hide-scrollbar-mobile">
          {[
            { id: 'RESUMEN', label: 'Historial', icon: Calendar },
            { id: 'EXPEDIENTES', label: 'Expedientes', icon: FolderKanban },
            { id: 'DOCUMENTOS', label: 'Documentos', icon: FileText },
            { id: 'NOTAS', label: 'Notas', icon: MessageSquare },
            { id: 'PAGOS', label: 'Pagos', icon: FileText }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all ${
                activeTab === tab.id 
                  ? 'bg-[var(--pv-gold)] text-white shadow-md' 
                  : 'bg-white/50 text-[var(--pv-navy)]/60 hover:bg-white hover:text-[var(--pv-ink)]'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {activeTab === 'RESUMEN' && (
          <ClientAppointmentsPanel clientEmail={client.email} />
        )}
        
        {activeTab === 'EXPEDIENTES' && (
           <ClientMattersPanel client={client} />
        )}
        
        {activeTab === 'DOCUMENTOS' && (
          <div className="neo-card !p-0 bg-white overflow-hidden">
             <div className="p-4 border-b border-[var(--pv-marble)] bg-[var(--pv-marble)]/30">
               <h3 className="font-roman text-sm font-bold uppercase tracking-widest text-[var(--pv-ink)]">
                 Archivos Compartidos
               </h3>
               <p className="text-xs text-[var(--pv-navy)]/60 mt-1">Sube documentos para que el cliente los descargue desde Mi Portal.</p>
             </div>
             <div className="p-4">
                <ClientDocumentsPanel clientEmail={client.email} />
             </div>
          </div>
        )}

        {activeTab === 'NOTAS' && (
           <ClientNotesPanel clientEmail={client.email} />
        )}

        {activeTab === 'PAGOS' && (
          <ClientPaymentsPanel clientEmail={client.email} />
        )}
      </div>
      
      {isEditing && (
        <ClientEditModal
          client={client}
          onClose={() => setIsEditing(false)}
          onSuccess={(updatedClient) => {
            setIsEditing(false);
            onClientUpdated();
          }}
        />
      )}
    </div>
  );
}
