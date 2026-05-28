'use client';

import { useState, useEffect } from 'react';
import { AppointmentData } from '@/types/booking';
import { STATUS_LABELS, STATUS_COLORS, formatDateShort } from '@/lib/constants';
import { normalizeEmail, normalizeNie, normalizePhone } from '@/lib/validation';
import { DocumentAnalyzer } from '@/components/admin/DocumentAnalyzer';
import { ClientDocumentsPanel } from '@/components/admin/ClientDocumentsPanel';
import { Users, Search, Edit3, Trash2, Check, X, FileText, Calendar, PlusCircle, ExternalLink } from 'lucide-react';

interface ClientInfo {
  name: string;
  email: string;
  phone: string;
  nie: string | null;
  totalAppointments: number;
  lastVisit: string;
}

interface ClientNote {
  id: string;
  content: string;
  status: string;
  tags: string[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

const NOTE_TEMPLATES = [
  'Presupuesto enviado, pendiente de confirmacion.',
  'Pendiente de documentacion.',
  'Documentacion recibida, revisando.',
  'Hoja de encargo enviada.',
  'Cita de seguimiento programada.',
  'Caso en espera de respuesta del organismo.',
];

const NOTE_STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pendiente', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { value: 'IN_PROGRESS', label: 'En proceso', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'WAITING', label: 'En espera', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  { value: 'DONE', label: 'Finalizado', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
];

export default function ClientesPage() {
  const [clients, setClients] = useState<ClientInfo[]>([]);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [clientAppointments, setClientAppointments] = useState<AppointmentData[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', nie: '' });
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [clientNotes, setClientNotes] = useState<ClientNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [noteInput, setNoteInput] = useState('');
  const [noteStatus, setNoteStatus] = useState('PENDING');
  const [noteTags, setNoteTags] = useState('');
  const [noteIsPublic, setNoteIsPublic] = useState(false);
  const [noteError, setNoteError] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteMessage, setNoteMessage] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteValue, setEditingNoteValue] = useState('');
  const [editingNoteStatus, setEditingNoteStatus] = useState('PENDING');
  const [editingNoteTags, setEditingNoteTags] = useState('');
  const [editingNoteIsPublic, setEditingNoteIsPublic] = useState(false);

  const selectedClientData = clients.find((c) => c.email === selectedClient);

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (selectedClient) {
      loadClientAppointments(selectedClient);
      loadClientNotes(selectedClient);
    }
  }, [selectedClient]);
  
  useEffect(() => {
    if (!selectedClientData) return;
    setEditForm({
      name: selectedClientData.name || '',
      email: selectedClientData.email || '',
      phone: selectedClientData.phone || '',
      nie: selectedClientData.nie || '',
    });
    setEditMode(false);
    setSaveMessage('');
    setClientNotes([]);
    setNoteInput('');
    setNoteStatus('PENDING');
    setNoteTags('');
    setNoteIsPublic(false);
    setNoteError('');
    setNoteMessage('');
    setEditingNoteId(null);
    setEditingNoteValue('');
    setEditingNoteStatus('PENDING');
    setEditingNoteTags('');
    setEditingNoteIsPublic(false);
  }, [selectedClientData]);

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

  const loadClientAppointments = async (email: string) => {
    try {
      const res = await fetch(`/api/appointments?search=${encodeURIComponent(email)}`);
      const data = await res.json();
      setClientAppointments(Array.isArray(data) ? data.sort((a: AppointmentData, b: AppointmentData) => {
        const dateA = typeof a.date === 'string' ? a.date : new Date(a.date).toISOString();
        const dateB = typeof b.date === 'string' ? b.date : new Date(b.date).toISOString();
        return dateB.localeCompare(dateA);
      }) : []);
    } catch {
      setClientAppointments([]);
    }
  };

  const loadClientNotes = async (email: string) => {
    setNotesLoading(true);
    try {
      const res = await fetch(`/api/admin/client-notes?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      setClientNotes(Array.isArray(data) ? data : []);
    } catch {
      setClientNotes([]);
    } finally {
      setNotesLoading(false);
    }
  };

  const handleSaveClient = async () => {
    if (!selectedClient) return;
    setSaving(true);
    setSaveMessage('');
    try {
      const payload = {
        currentEmail: selectedClient,
        updates: {
          name: editForm.name.trim(),
          email: editForm.email.trim(),
          phone: editForm.phone.trim(),
          nie: editForm.nie.trim(),
        },
      };
      const res = await fetch('/api/admin/clients', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      const result = await res.json();
      const nextEmail = result?.email || editForm.email.trim() || selectedClient;
      await loadClients();
      setSelectedClient(nextEmail);
      setEditMode(false);
      setSaveMessage('Cliente actualizado.');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch {
      setSaveMessage('No se pudo actualizar el cliente.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (selectedClientData) {
      setEditForm({
        name: selectedClientData.name || '',
        email: selectedClientData.email || '',
        phone: selectedClientData.phone || '',
        nie: selectedClientData.nie || '',
      });
    }
    setEditMode(false);
    setSaveMessage('');
  };

  const formatDateTime = (value: string) => {
    const date = new Date(value);
    return date.toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });
  };

  const parseTags = (value: string) =>
    value
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

  const getStatusMeta = (status: string) =>
    NOTE_STATUS_OPTIONS.find((option) => option.value === status) || NOTE_STATUS_OPTIONS[0];

  const handleAddNote = async () => {
    if (!selectedClient) return;
    const content = noteInput.trim();
    if (!content) {
      setNoteError('Escribe una nota antes de guardar.');
      return;
    }
    setNoteSaving(true);
    setNoteError('');
    setNoteMessage('');
    try {
      const res = await fetch('/api/admin/client-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: selectedClient,
          content,
          status: noteStatus,
          tags: parseTags(noteTags),
          isPublic: noteIsPublic,
        }),
      });
      if (!res.ok) throw new Error();
      setNoteInput('');
      setNoteTags('');
      setNoteStatus('PENDING');
      setNoteIsPublic(false);
      await loadClientNotes(selectedClient);
      setNoteMessage('Nota guardada.');
      setTimeout(() => setNoteMessage(''), 3000);
    } catch {
      setNoteError('No se pudo guardar la nota.');
    } finally {
      setNoteSaving(false);
    }
  };

  const applyTemplate = (template: string) => {
    setNoteInput((prev) => (prev ? `${prev}\n${template}` : template));
    setNoteError('');
    setNoteMessage('');
  };

  const startEditNote = (note: ClientNote) => {
    setEditingNoteId(note.id);
    setEditingNoteValue(note.content);
    setEditingNoteStatus(note.status || 'PENDING');
    setEditingNoteTags((note.tags || []).join(', '));
    setEditingNoteIsPublic(note.isPublic || false);
    setNoteMessage('');
    setNoteError('');
  };

  const handleUpdateNote = async () => {
    if (!editingNoteId) return;
    const content = editingNoteValue.trim();
    if (!content) {
      setNoteError('La nota no puede quedar vacia.');
      return;
    }
    setNoteSaving(true);
    setNoteError('');
    try {
      const res = await fetch(`/api/admin/client-notes/${editingNoteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          status: editingNoteStatus,
          tags: parseTags(editingNoteTags),
          isPublic: editingNoteIsPublic,
        }),
      });
      if (!res.ok) throw new Error();
      if (selectedClient) {
        await loadClientNotes(selectedClient);
      }
      setEditingNoteId(null);
      setEditingNoteValue('');
      setEditingNoteStatus('PENDING');
      setEditingNoteTags('');
      setEditingNoteIsPublic(false);
      setNoteMessage('Nota actualizada.');
      setTimeout(() => setNoteMessage(''), 3000);
    } catch {
      setNoteError('No se pudo actualizar la nota.');
    } finally {
      setNoteSaving(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Eliminar esta nota del historial?')) return;
    setNoteSaving(true);
    setNoteError('');
    try {
      const res = await fetch(`/api/admin/client-notes/${noteId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      if (selectedClient) {
        await loadClientNotes(selectedClient);
      }
      setNoteMessage('Nota eliminada.');
      setTimeout(() => setNoteMessage(''), 3000);
    } catch {
      setNoteError('No se pudo eliminar la nota.');
    } finally {
      setNoteSaving(false);
    }
  };

  const filteredClients = clients.filter((c) =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    (c.nie && c.nie.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-[var(--pv-gold)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-8">
      <div className="flex justify-between items-end mb-2 lg:mb-4 px-2 lg:px-0">
        <div>
          <h1 className="text-xl lg:text-3xl font-bold font-roman uppercase text-[var(--pv-ink)] tracking-tight">Directorio de Clientes</h1>
          <p className="text-[10px] lg:text-sm text-[var(--pv-navy)] opacity-60">Gestión centralizada de la base de datos.</p>
        </div>
        <div className="hidden lg:flex gap-4">
          <div className="neo-card !p-3 !px-6 flex items-center gap-3 shadow-sm">
             <div className="p-2 bg-[var(--pv-gold)]/10 rounded-lg text-[var(--pv-gold)]">
                <Users size={20} />
             </div>
             <div>
                <p className="text-[9px] uppercase font-bold text-[var(--pv-gold)] tracking-widest">Total</p>
                <p className="text-xl font-bold text-[var(--pv-ink)] leading-none">{clients.length}</p>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 lg:gap-8">
        {/* Client list */}
        <div className="space-y-4 lg:space-y-6">
          <div className="neo-card !p-3 lg:!p-4 h-[350px] lg:h-[calc(100vh-200px)] flex flex-col">
            <div className="relative mb-3 lg:mb-4 shrink-0">
              <Search className="absolute left-3 lg:left-4 top-1/2 -translate-y-1/2 text-[var(--pv-gold)]" size={16} />
              <input
                type="text"
                placeholder="Buscar cliente..."
                className="neo-input !py-2.5 lg:!py-3 pl-10 lg:pl-12 text-xs lg:text-sm w-full"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-1 lg:pr-2">
              {filteredClients.length === 0 ? (
                <div className="text-center py-6 lg:py-10">
                  <p className="text-xs lg:text-sm text-[var(--pv-navy)] opacity-40">No se encontraron clientes</p>
                </div>
              ) : (
                filteredClients.map((client) => (
                  <button
                    key={client.email}
                    onClick={() => setSelectedClient(client.email)}
                    className={`w-full text-left p-3 lg:p-4 rounded-xl transition-all duration-300 border ${
                      selectedClient === client.email
                        ? 'bg-[var(--pv-gold)] text-white shadow-md border-[var(--pv-gold)]'
                        : 'bg-white/50 border-white/20 hover:bg-white hover:shadow-sm'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                       <div className="min-w-0 pr-2">
                          <div className={`text-xs lg:text-sm font-bold truncate ${selectedClient === client.email ? 'text-white' : 'text-[var(--pv-ink)]'}`}>{client.name}</div>
                          <div className={`text-[10px] lg:text-xs truncate ${selectedClient === client.email ? 'text-white/80' : 'text-[var(--pv-navy)] opacity-60'}`}>{client.email}</div>
                       </div>
                       <div className={`text-[9px] lg:text-[10px] font-bold px-1.5 py-0.5 lg:px-2 lg:py-1 rounded shrink-0 ${selectedClient === client.email ? 'bg-white/20' : 'bg-[var(--pv-gold)]/10 text-[var(--pv-gold)]'}`}>
                          {client.totalAppointments}
                       </div>
                    </div>
                    <div className={`flex items-center gap-1.5 lg:gap-2 mt-2 lg:mt-3 text-[9px] lg:text-[10px] font-medium uppercase tracking-wider ${selectedClient === client.email ? 'text-white/70' : 'text-[var(--pv-navy)] opacity-40'}`}>
                      <Calendar size={10} className="lg:size-12" />
                      <span>Ultima visita: {formatDateShort(client.lastVisit)}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Client detail */}
        <div className="space-y-4 lg:space-y-6">
          {!selectedClient ? (
            <div className="neo-card flex flex-col items-center justify-center py-20 lg:py-32 text-center h-[calc(100vh-200px)]">
              <div className="w-16 h-16 lg:w-20 lg:h-20 bg-[var(--pv-marble)] rounded-full flex items-center justify-center mb-4 lg:mb-6 shadow-inner">
                <Users size={32} className="lg:size-40 text-[var(--pv-gold)] opacity-30" />
              </div>
              <h3 className="text-lg lg:text-xl font-roman uppercase text-[var(--pv-navy)] mb-2">Seleccione un Cliente</h3>
              <p className="text-xs lg:text-sm text-[var(--pv-navy)] opacity-40 max-w-xs">Elija un registro de la lista para ver su historial completo y gestionar su expediente.</p>
            </div>
          ) : selectedClientData ? (
            <div className="space-y-4 lg:space-y-6">
              {/* Client info */}
              <div className="neo-card !p-4 lg:!p-6 border-l-4 lg:border-l-8 border-l-[var(--pv-gold)]">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 lg:gap-6 mb-4 lg:mb-6">
                  <div className="min-w-0">
                    <h2 className="text-xl lg:text-3xl font-bold text-[var(--pv-ink)] font-roman uppercase tracking-tight truncate">{selectedClientData.name}</h2>
                    <p className="text-[var(--pv-gold)] font-bold tracking-[0.2em] text-[9px] lg:text-xs uppercase mt-1">Ficha de Cliente</p>
                  </div>
                  <div className="flex gap-2 lg:gap-3 shrink-0">
                    {!editMode ? (
                      <button onClick={() => setEditMode(true)} className="flex items-center gap-1.5 lg:gap-2 px-3 py-1.5 lg:px-4 lg:py-2 rounded-lg lg:rounded-xl font-bold text-xs lg:text-sm bg-white border border-[var(--pv-gold)] text-[var(--pv-gold)] hover:bg-[var(--pv-gold)] hover:text-white transition-all shadow-sm">
                        <Edit3 size={14} className="lg:size-16" />
                        Editar
                      </button>
                    ) : (
                      <>
                        <button onClick={handleCancelEdit} className="px-3 py-1.5 lg:px-4 lg:py-2 rounded-lg lg:rounded-xl font-bold text-xs lg:text-sm bg-[var(--pv-marble)] text-[var(--pv-navy)] hover:bg-stone-200 transition-all">
                          Cancelar
                        </button>
                        <button onClick={handleSaveClient} disabled={saving} className="btn-roman !px-4 !py-1.5 lg:!px-5 lg:!py-2 text-xs lg:text-sm disabled:opacity-60">
                          {saving ? 'Guardando...' : 'Guardar'}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {!editMode ? (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
                    <div className="p-3 lg:p-4 rounded-xl lg:rounded-2xl bg-[var(--pv-marble)] shadow-inner min-w-0">
                      <span className="text-[9px] lg:text-[10px] font-bold text-[var(--pv-gold)] uppercase tracking-widest block mb-0.5 lg:mb-1 truncate">Email Principal</span>
                      <div className="text-xs lg:text-sm font-bold text-[var(--pv-ink)] truncate" title={selectedClientData.email}>{selectedClientData.email}</div>
                    </div>
                    <div className="p-3 lg:p-4 rounded-xl lg:rounded-2xl bg-[var(--pv-marble)] shadow-inner min-w-0">
                      <span className="text-[9px] lg:text-[10px] font-bold text-[var(--pv-gold)] uppercase tracking-widest block mb-0.5 lg:mb-1 truncate">Teléfono Contacto</span>
                      <div className="text-xs lg:text-sm font-bold text-[var(--pv-ink)] truncate">{selectedClientData.phone}</div>
                    </div>
                    <div className="p-3 lg:p-4 rounded-xl lg:rounded-2xl bg-[var(--pv-marble)] shadow-inner min-w-0">
                      <span className="text-[9px] lg:text-[10px] font-bold text-[var(--pv-gold)] uppercase tracking-widest block mb-0.5 lg:mb-1 truncate">NIE / Pasaporte</span>
                      <div className="text-xs lg:text-sm font-bold text-[var(--pv-ink)] truncate">{selectedClientData.nie || 'No registrado'}</div>
                    </div>
                    <div className="p-3 lg:p-4 rounded-xl lg:rounded-2xl bg-[var(--pv-marble)] shadow-inner min-w-0">
                      <span className="text-[9px] lg:text-[10px] font-bold text-[var(--pv-gold)] uppercase tracking-widest block mb-0.5 lg:mb-1 truncate">Total Consultas</span>
                      <div className="text-xs lg:text-sm font-bold text-[var(--pv-ink)] truncate">{selectedClientData.totalAppointments}</div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] lg:text-[10px] font-bold text-[var(--pv-gold)] uppercase tracking-widest ml-3 lg:ml-4">Nombre Completo</label>
                      <input
                        className="neo-input !py-2 lg:!py-3 text-xs lg:text-sm"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[var(--pv-gold)] uppercase tracking-widest ml-4">Correo Electrónico</label>
                      <input
                        type="email"
                        className="neo-input"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: normalizeEmail(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[var(--pv-gold)] uppercase tracking-widest ml-4">Número de Teléfono</label>
                      <input
                        className="neo-input"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: normalizePhone(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[var(--pv-gold)] uppercase tracking-widest ml-4">NIE / Pasaporte</label>
                      <input
                        className="neo-input"
                        value={editForm.nie}
                        onChange={(e) => setEditForm({ ...editForm, nie: normalizeNie(e.target.value) })}
                      />
                    </div>
                  </div>
                )}
                {saveMessage && <div className="mt-4 text-sm font-bold text-emerald-600 bg-emerald-50 p-3 rounded-xl flex items-center gap-2 animate-fade-in"><Check size={16} /> {saveMessage}</div>}
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                 {/* AI Analyzer */}
                <DocumentAnalyzer 
                  clientEmail={selectedClient} 
                  onAnalysisComplete={() => loadClientNotes(selectedClient)} 
                />

                <ClientDocumentsPanel clientEmail={selectedClient} />
              </div>

              {/* Client history / Notes */}
              <div className="neo-card !p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[var(--pv-navy)] text-white rounded-xl">
                      <FileText size={20} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold font-roman uppercase text-[var(--pv-ink)]">Bitácora de Seguimiento</h3>
                      <p className="text-xs text-[var(--pv-navy)] opacity-40">Historial cronológico de acciones y notas internas.</p>
                    </div>
                  </div>
                  <div className="bg-[var(--pv-marble)] px-4 py-2 rounded-xl shadow-inner text-xs font-bold text-[var(--pv-gold)]">
                    {clientNotes.length} ENTRADAS
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="p-6 rounded-2xl bg-[var(--pv-marble)] shadow-inner border border-white/50">
                    <textarea
                      className="w-full bg-transparent border-none outline-none text-sm text-[var(--pv-navy)] min-h-[120px] resize-none placeholder-[var(--pv-navy)]/30"
                      placeholder="Escriba aquí los avances del caso, notas de reuniones o instrucciones..."
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
                    />
                    
                    <div className="flex flex-wrap gap-2 mb-6">
                      {NOTE_TEMPLATES.map((template) => (
                        <button
                          key={template}
                          type="button"
                          onClick={() => applyTemplate(template)}
                          className="text-[10px] px-3 py-1.5 rounded-lg border border-[var(--pv-gold)]/30 text-[var(--pv-navy)] hover:bg-[var(--pv-gold)] hover:text-white hover:border-[var(--pv-gold)] transition-all font-bold uppercase tracking-wider"
                        >
                          {template}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end pt-4 border-t border-white/40">
                      <div>
                        <label className="text-[10px] font-bold text-[var(--pv-gold)] uppercase tracking-widest block mb-2 ml-2">Estado del Caso</label>
                        <select
                          className="neo-input !py-2.5 !bg-white"
                          value={noteStatus}
                          onChange={(e) => setNoteStatus(e.target.value)}
                        >
                          {NOTE_STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-[var(--pv-gold)] uppercase tracking-widest block mb-2 ml-2">Etiquetas</label>
                        <input
                          className="neo-input !py-2.5 !bg-white"
                          value={noteTags}
                          onChange={(e) => setNoteTags(e.target.value)}
                          placeholder="p.ej: presupuesto, docs"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl shadow-sm border border-white/50">
                          <span className="text-[10px] font-bold text-[var(--pv-gold)] uppercase tracking-widest">Pública</span>
                          <input
                            type="checkbox"
                            className="w-5 h-5 accent-[var(--pv-gold)] rounded-lg cursor-pointer"
                            checked={noteIsPublic}
                            onChange={(e) => setNoteIsPublic(e.target.checked)}
                          />
                        </div>
                        <button
                          onClick={handleAddNote}
                          disabled={noteSaving}
                          className="btn-roman !py-2.5 px-6 text-sm flex-1"
                        >
                          {noteSaving ? '...' : <><PlusCircle size={18} /> Añadir</>}
                        </button>
                      </div>
                    </div>
                  </div>

                  {noteError && <div className="text-xs font-bold text-red-600 bg-red-50 p-3 rounded-xl flex items-center gap-2"><X size={14} /> {noteError}</div>}
                  {!noteError && noteMessage && <div className="text-xs font-bold text-emerald-600 bg-emerald-50 p-3 rounded-xl flex items-center gap-2"><Check size={14} /> {noteMessage}</div>}

                  {notesLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="w-8 h-8 border-3 border-[var(--pv-gold)] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : clientNotes.length === 0 ? (
                    <div className="text-center py-12 bg-white/30 rounded-2xl border border-dashed border-[var(--pv-gold)]/30">
                      <p className="text-sm text-[var(--pv-navy)] opacity-40">No hay entradas en la bitácora todavía.</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                      {clientNotes.map((note) => {
                        const isEditing = editingNoteId === note.id;
                        const statusMeta = getStatusMeta(note.status);
                        return (
                          <div key={note.id} className={`group p-6 rounded-2xl border transition-all duration-300 ${note.isPublic ? 'bg-blue-50/40 border-blue-200' : 'bg-white border-white/50 hover:shadow-md shadow-sm'}`}>
                            <div className="flex items-start justify-between gap-4 mb-4">
                              <div className="flex flex-wrap items-center gap-3">
                                <span className="text-[10px] font-bold text-[var(--pv-navy)] opacity-40 uppercase tracking-widest">{formatDateTime(note.createdAt)}</span>
                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${statusMeta.color}`}>
                                  {statusMeta.label}
                                </span>
                                {note.isPublic && (
                                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-100 px-2.5 py-1 rounded-lg">
                                    <ExternalLink size={10} /> Visible p/ Cliente
                                  </span>
                                )}
                              </div>
                              {!isEditing && (
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => startEditNote(note)}
                                    className="p-2 text-[var(--pv-gold)] hover:bg-[var(--pv-gold)]/10 rounded-lg transition-colors"
                                    title="Editar nota"
                                  >
                                    <Edit3 size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteNote(note.id)}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Eliminar nota"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              )}
                            </div>

                            {!isEditing ? (
                              <div className="space-y-4">
                                <div className="text-sm text-[var(--pv-navy)] leading-relaxed whitespace-pre-wrap">{note.content}</div>
                                {note.tags && note.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-2">
                                    {note.tags.map((tag) => (
                                      <span
                                        key={`${note.id}-${tag}`}
                                        className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-md bg-[var(--pv-marble)] text-[var(--pv-navy)] opacity-60 border border-white/50"
                                      >
                                        #{tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-4 animate-fade-in">
                                <textarea
                                  className="w-full neo-input !bg-[var(--pv-marble)] min-h-[100px] text-sm"
                                  value={editingNoteValue}
                                  onChange={(e) => setEditingNoteValue(e.target.value)}
                                />
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                                  <div>
                                    <label className="text-[10px] font-bold text-[var(--pv-gold)] uppercase tracking-widest block mb-1 ml-2">Estado</label>
                                    <select
                                      className="neo-input !py-2 !text-xs bg-white"
                                      value={editingNoteStatus}
                                      onChange={(e) => setEditingNoteStatus(e.target.value)}
                                    >
                                      {NOTE_STATUS_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                          {option.label}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="text-[10px] font-bold text-[var(--pv-gold)] uppercase tracking-widest block mb-1 ml-2">Etiquetas</label>
                                    <input
                                      className="neo-input !py-2 !text-xs bg-white"
                                      value={editingNoteTags}
                                      onChange={(e) => setEditingNoteTags(e.target.value)}
                                    />
                                  </div>
                                  <div className="flex items-center gap-3 h-10 px-4 bg-white rounded-xl shadow-sm border border-white/50">
                                    <span className="text-[10px] font-bold text-[var(--pv-gold)] uppercase tracking-widest">Pública</span>
                                    <input
                                      type="checkbox"
                                      className="w-4 h-4 accent-[var(--pv-gold)]"
                                      checked={editingNoteIsPublic}
                                      onChange={(e) => setEditingNoteIsPublic(e.target.checked)}
                                    />
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={handleUpdateNote}
                                    disabled={noteSaving}
                                    className="btn-roman !py-2 px-6 text-xs flex-1"
                                  >
                                    Actualizar Entrada
                                  </button>
                                  <button
                                    onClick={() => setEditingNoteId(null)}
                                    className="px-6 py-2 rounded-xl text-xs font-bold bg-[var(--pv-marble)] text-[var(--pv-navy)] hover:bg-stone-200 transition-all"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Client appointments */}
              <div className="neo-card !p-8">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2 bg-[var(--pv-gold)] text-white rounded-xl">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold font-roman uppercase text-[var(--pv-ink)]">Historial de Citas</h3>
                    <p className="text-xs text-[var(--pv-navy)] opacity-40">Registro de todas las sesiones presenciales y virtuales.</p>
                  </div>
                </div>

                {clientAppointments.length === 0 ? (
                  <div className="text-center py-10 bg-[var(--pv-marble)]/50 rounded-2xl border border-dashed border-[var(--pv-gold)]/20">
                    <p className="text-sm text-[var(--pv-navy)] opacity-40">No hay citas registradas para este cliente.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {clientAppointments.map((appt) => {
                      const dateStr = typeof appt.date === 'string' ? appt.date.split('T')[0] : new Date(appt.date).toISOString().split('T')[0];
                      return (
                        <div key={appt.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-white/50 shadow-sm hover:shadow-md transition-all duration-300">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-[var(--pv-marble)] rounded-xl flex flex-col items-center justify-center border border-white shadow-inner">
                                <span className="text-[10px] font-bold text-[var(--pv-gold)] uppercase tracking-tighter">{formatDateShort(dateStr).split(' ')[1]}</span>
                                <span className="text-sm font-black text-[var(--pv-ink)] leading-none">{formatDateShort(dateStr).split(' ')[0]}</span>
                             </div>
                             <div>
                                <div className="text-sm font-bold text-[var(--pv-ink)]">{appt.service?.name || 'Consulta Legal'}</div>
                                <div className="text-xs text-[var(--pv-navy)] opacity-60 font-medium">Inicia a las {appt.startTime}</div>
                             </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-3">
                            <span className={`text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg border ${appt.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                              {appt.paymentStatus === 'PAID' ? 'Saldado' : 'Pendiente Pago'}
                            </span>
                            <span className={`text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg border shadow-sm ${STATUS_COLORS[appt.status] || ''}`}>
                              {STATUS_LABELS[appt.status] || appt.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
