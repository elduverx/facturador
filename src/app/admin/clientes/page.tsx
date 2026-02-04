'use client';

import { useState, useEffect } from 'react';
import { AppointmentData } from '@/types/booking';
import { STATUS_LABELS, STATUS_COLORS, formatDateShort } from '@/lib/constants';
import { normalizeEmail, normalizeNie, normalizePhone } from '@/lib/validation';

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
  { value: 'PENDING', label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { value: 'IN_PROGRESS', label: 'En proceso', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'WAITING', label: 'En espera', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { value: 'DONE', label: 'Finalizado', color: 'bg-green-100 text-green-700 border-green-200' },
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
  const [noteError, setNoteError] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteMessage, setNoteMessage] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteValue, setEditingNoteValue] = useState('');
  const [editingNoteStatus, setEditingNoteStatus] = useState('PENDING');
  const [editingNoteTags, setEditingNoteTags] = useState('');

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
    setNoteError('');
    setNoteMessage('');
    setEditingNoteId(null);
    setEditingNoteValue('');
    setEditingNoteStatus('PENDING');
    setEditingNoteTags('');
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
        }),
      });
      if (!res.ok) throw new Error();
      setNoteInput('');
      setNoteTags('');
      setNoteStatus('PENDING');
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
        <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold">Clientes</h1>
        <p className="text-sm text-stone-500">Directorio de clientes del consultorio</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        {/* Client list */}
        <div className="card !p-3">
          <div className="mb-3">
            <input
              type="text"
              placeholder="Buscar cliente..."
              className="form-input text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {filteredClients.length === 0 ? (
            <p className="text-sm text-stone-400 text-center py-6">No hay clientes</p>
          ) : (
            <div className="space-y-1 max-h-[600px] overflow-y-auto">
              {filteredClients.map((client) => (
                <button
                  key={client.email}
                  onClick={() => setSelectedClient(client.email)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedClient === client.email
                      ? 'bg-teal-50 border border-teal-200'
                      : 'hover:bg-stone-50 border border-transparent'
                  }`}
                >
                  <div className="text-sm font-medium">{client.name}</div>
                  <div className="text-xs text-stone-500">{client.email}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-stone-400">{client.totalAppointments} citas</span>
                    <span className="text-[10px] text-stone-400">Ultima: {formatDateShort(client.lastVisit)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Client detail */}
        <div>
          {!selectedClient ? (
            <div className="card text-center py-12">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#A8A29E" strokeWidth="1.5" className="mx-auto mb-3">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
              </svg>
              <p className="text-sm text-stone-400">Seleccione un cliente para ver su historial</p>
            </div>
          ) : selectedClientData ? (
            <div className="space-y-4">
              {/* Client info */}
              <div className="card">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <h2 className="font-semibold text-lg">{selectedClientData.name}</h2>
                  <div className="flex gap-2">
                    {!editMode ? (
                      <button onClick={() => setEditMode(true)} className="btn btn-secondary text-xs">Editar</button>
                    ) : (
                      <>
                        <button onClick={handleCancelEdit} className="btn btn-secondary text-xs">Cancelar</button>
                        <button onClick={handleSaveClient} disabled={saving} className="btn btn-primary text-xs disabled:opacity-60">
                          {saving ? 'Guardando...' : 'Guardar'}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {!editMode ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-stone-400 text-xs">Email</span>
                      <div>{selectedClientData.email}</div>
                    </div>
                    <div>
                      <span className="text-stone-400 text-xs">Telefono</span>
                      <div>{selectedClientData.phone}</div>
                    </div>
                    {selectedClientData.nie && (
                      <div>
                        <span className="text-stone-400 text-xs">NIE/Pasaporte</span>
                        <div>{selectedClientData.nie}</div>
                      </div>
                    )}
                    <div>
                      <span className="text-stone-400 text-xs">Total citas</span>
                      <div>{selectedClientData.totalAppointments}</div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <label className="form-label block text-xs">Nombre</label>
                      <input
                        className="form-input text-sm"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="form-label block text-xs">Email</label>
                      <input
                        type="email"
                        className="form-input text-sm"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: normalizeEmail(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label className="form-label block text-xs">Telefono</label>
                      <input
                        className="form-input text-sm"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: normalizePhone(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label className="form-label block text-xs">NIE/Pasaporte</label>
                      <input
                        className="form-input text-sm"
                        value={editForm.nie}
                        onChange={(e) => setEditForm({ ...editForm, nie: normalizeNie(e.target.value) })}
                      />
                    </div>
                  </div>
                )}
                {saveMessage && <div className="text-xs text-stone-500 mt-3">{saveMessage}</div>}
              </div>

              {/* Client history */}
              <div className="card">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="font-semibold text-sm">Historial de consulta</h3>
                    <p className="text-xs text-stone-500">Notas internas sobre el progreso del trabajo</p>
                  </div>
                  <span className="text-xs text-stone-400">{clientNotes.length} entradas</span>
                </div>

                <textarea
                  className="form-input text-sm min-h-[90px]"
                  placeholder="Ej: Se envio presupuesto, pendiente de documentacion..."
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                />
                <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-3 mt-3">
                  <div>
                    <label className="form-label block text-xs">Estado</label>
                    <select
                      className="form-input text-sm"
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
                    <label className="form-label block text-xs">Etiquetas (coma)</label>
                    <input
                      className="form-input text-sm"
                      value={noteTags}
                      onChange={(e) => setNoteTags(e.target.value)}
                      placeholder="presupuesto, docs, seguimiento"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {NOTE_TEMPLATES.map((template) => (
                    <button
                      key={template}
                      type="button"
                      onClick={() => applyTemplate(template)}
                      className="text-[11px] px-2 py-1 rounded-full border border-stone-200 text-stone-600 hover:border-teal-300 hover:text-teal-700 transition-colors"
                    >
                      {template}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <button
                    onClick={handleAddNote}
                    disabled={noteSaving}
                    className="btn btn-secondary text-xs disabled:opacity-60"
                  >
                    {noteSaving ? 'Guardando...' : 'Agregar nota'}
                  </button>
                  {noteError && <span className="text-xs text-red-600">{noteError}</span>}
                  {!noteError && noteMessage && <span className="text-xs text-stone-500">{noteMessage}</span>}
                </div>

                {notesLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : clientNotes.length === 0 ? (
                  <p className="text-xs text-stone-400 mt-4">Sin notas por ahora.</p>
                ) : (
                  <div className="space-y-2 mt-4">
                    {clientNotes.map((note) => {
                      const isEditing = editingNoteId === note.id;
                      const statusMeta = getStatusMeta(note.status);
                      return (
                        <div key={note.id} className="p-3 rounded-lg border border-stone-200">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2 text-xs text-stone-400">
                              <span>{formatDateTime(note.createdAt)}</span>
                              <span className={`px-2 py-0.5 rounded-full border ${statusMeta.color}`}>
                                {statusMeta.label}
                              </span>
                            </div>
                            {!isEditing && (
                              <div className="flex items-center gap-2 text-xs">
                                <button
                                  onClick={() => startEditNote(note)}
                                  className="text-teal-700 hover:text-teal-800"
                                >
                                  Editar
                                </button>
                                <button
                                  onClick={() => handleDeleteNote(note.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  Eliminar
                                </button>
                              </div>
                            )}
                          </div>

                          {!isEditing ? (
                            <div className="mt-2">
                              <div className="text-sm text-stone-700 whitespace-pre-wrap">{note.content}</div>
                              {note.tags && note.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {note.tags.map((tag) => (
                                    <span
                                      key={`${note.id}-${tag}`}
                                      className="text-[11px] px-2 py-0.5 rounded-full border border-stone-200 text-stone-600"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="mt-2">
                              <textarea
                                className="form-input text-sm min-h-[90px]"
                                value={editingNoteValue}
                                onChange={(e) => setEditingNoteValue(e.target.value)}
                              />
                              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-3 mt-3">
                                <div>
                                  <label className="form-label block text-xs">Estado</label>
                                  <select
                                    className="form-input text-sm"
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
                                  <label className="form-label block text-xs">Etiquetas (coma)</label>
                                  <input
                                    className="form-input text-sm"
                                    value={editingNoteTags}
                                    onChange={(e) => setEditingNoteTags(e.target.value)}
                                    placeholder="presupuesto, docs, seguimiento"
                                  />
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 mt-2">
                                <button
                                  onClick={handleUpdateNote}
                                  disabled={noteSaving}
                                  className="btn btn-secondary text-xs disabled:opacity-60"
                                >
                                  {noteSaving ? 'Guardando...' : 'Guardar cambios'}
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingNoteId(null);
                                    setEditingNoteValue('');
                                    setEditingNoteStatus('PENDING');
                                    setEditingNoteTags('');
                                    setNoteError('');
                                  }}
                                  className="btn btn-ghost text-xs"
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

              {/* Client appointments */}
              <div className="card">
                <h3 className="font-semibold text-sm mb-3">Historial de citas</h3>
                {clientAppointments.length === 0 ? (
                  <p className="text-sm text-stone-400 text-center py-4">Sin citas registradas</p>
                ) : (
                  <div className="space-y-2">
                    {clientAppointments.map((appt) => {
                      const dateStr = typeof appt.date === 'string' ? appt.date.split('T')[0] : new Date(appt.date).toISOString().split('T')[0];
                      return (
                        <div key={appt.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border border-stone-100">
                          <div>
                            <div className="text-sm font-medium">{appt.service?.name || 'Servicio'}</div>
                            <div className="text-xs text-stone-500">{formatDateShort(dateStr)} a las {appt.startTime}</div>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full border self-start sm:self-center ${STATUS_COLORS[appt.status] || ''}`}>
                            {STATUS_LABELS[appt.status] || appt.status}
                          </span>
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
