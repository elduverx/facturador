'use client';

import { useEffect, useState } from 'react';
import { formatDateShort } from '@/lib/constants';
import { FileText, Download, RefreshCw, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

type ClientDocument = {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  description: string | null;
  status: string;
  adminNotes: string | null;
  aiAnalysis: unknown;
  matchedEmail: string | null;
  matchedScore: number | null;
  amountDue: number | null;
  isPaid: boolean;
  createdAt: string;
};

interface ClientDocumentsPanelProps {
  clientEmail: string;
}

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pendiente', icon: Clock, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { value: 'REVIEWED', label: 'Revisado', icon: CheckCircle2, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { value: 'ACCEPTED', label: 'Aceptado', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { value: 'REJECTED', label: 'Rechazado', icon: AlertCircle, color: 'text-red-600 bg-red-50 border-red-200' },
];

const formatSize = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function ClientDocumentsPanel({ clientEmail }: ClientDocumentsPanelProps) {
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  
  // Admin Upload State
  const [file, setFile] = useState<File | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [amountDue, setAmountDue] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');

  const loadDocuments = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/admin/client-documents?email=${encodeURIComponent(clientEmail)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'No se pudieron cargar los documentos.');

      setDocuments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los documentos.');
    } finally {
      setLoading(false);
    }
  };

  const uploadDocument = async () => {
    if (!file) {
      setError('Selecciona un documento para enviar al cliente.');
      return;
    }
    setUploading(true);
    setError('');
    setUploadMessage('');

    try {
      const formData = new FormData();
      formData.append('email', clientEmail);
      formData.append('file', file);
      formData.append('adminNotes', adminNotes);
      if (amountDue && !isNaN(Number(amountDue))) {
        formData.append('amountDue', amountDue);
      }

      const res = await fetch('/api/admin/client-documents', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data?.error || 'Error subiendo el documento.');

      setFile(null);
      setAdminNotes('');
      setAmountDue('');
      setUploadMessage('Documento subido con éxito.');
      setTimeout(() => setUploadMessage(''), 3000);
      await loadDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error subiendo el documento.');
    } finally {
      setUploading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    setSavingId(id);
    setError('');

    try {
      const res = await fetch(`/api/admin/client-documents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('No se pudo actualizar el estado.');

      setDocuments((prev) => prev.map((doc) => (doc.id === id ? { ...doc, status: newStatus } : doc)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el estado.');
    } finally {
      setSavingId(null);
    }
  };

  useEffect(() => {
    if (clientEmail) {
      loadDocuments();
    }
  }, [clientEmail]);

  return (
    <div className="space-y-6">
      <div className="bg-[var(--pv-marble)]/50 rounded-xl p-4 border border-[var(--pv-marble)]">
        <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--pv-ink)] mb-3">Subir nuevo documento al portal del cliente</h4>
        <div className="space-y-3">
          <input
            type="file"
            className="neo-input !py-2 !text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--pv-gold)] file:px-3 file:py-1 file:text-[10px] file:font-bold file:uppercase file:text-white"
            accept=".pdf,image/jpeg,image/png,image/webp"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            disabled={uploading}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <textarea
              className="neo-input !text-xs min-h-[60px]"
              placeholder="Nota o instrucción para el cliente (opcional)..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              disabled={uploading}
            />
            <div>
              <label className="block text-[10px] font-bold text-[var(--pv-navy)] uppercase tracking-widest mb-1.5">Bloquear con pago (opcional)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="neo-input !py-2 !text-xs"
                placeholder="Ej: 50.00"
                value={amountDue}
                onChange={(e) => setAmountDue(e.target.value)}
                disabled={uploading}
              />
            </div>
          </div>
          <button 
            onClick={uploadDocument} 
            disabled={uploading || !file} 
            className="btn-roman w-full !py-2.5 !text-[10px] !uppercase !tracking-widest disabled:opacity-50"
          >
            {uploading ? 'Subiendo...' : 'Subir documento'}
          </button>
          {uploadMessage && <div className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg p-2 font-medium">{uploadMessage}</div>}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="font-roman text-sm font-bold uppercase tracking-widest text-[var(--pv-ink)] flex items-center gap-2">
          <FileText size={16} className="text-[var(--pv-gold)]" />
          Documentos del expediente
        </h3>
        <button
          onClick={loadDocuments}
          disabled={loading}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--pv-navy)] hover:text-[var(--pv-gold)] transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {error && <div className="p-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl">{error}</div>}

      <div className="space-y-4">
        {loading && documents.length === 0 ? (
          <div className="p-8 text-center text-xs text-[var(--pv-navy)]/50 font-bold uppercase tracking-widest animate-pulse">
            Cargando documentos...
          </div>
        ) : documents.length === 0 ? (
          <div className="p-8 bg-[var(--pv-marble)]/30 rounded-2xl border-2 border-dashed border-[var(--pv-marble)] text-center">
            <FileText size={24} className="mx-auto text-[var(--pv-navy)]/30 mb-2" />
            <div className="text-xs text-[var(--pv-navy)]/50 font-bold uppercase tracking-widest">
              No hay documentos registrados
            </div>
          </div>
        ) : (
          documents.map((document) => {
            const statusConfig = STATUS_OPTIONS.find((s) => s.value === document.status) || STATUS_OPTIONS[0];
            const StatusIcon = statusConfig.icon;

            return (
              <div key={document.id} className="p-5 bg-white rounded-2xl border border-[var(--pv-marble)] shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-[var(--pv-ink)] truncate" title={document.fileName}>
                      {document.fileName}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 text-[10px] font-bold text-[var(--pv-navy)]/50 uppercase tracking-widest">
                      <span>{formatDateShort(document.createdAt.split('T')[0])}</span>
                      <span>&bull;</span>
                      <span>{formatSize(document.sizeBytes)}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${statusConfig.color}`}>
                      <StatusIcon size={12} />
                      {statusConfig.label}
                    </span>
                    <a
                      href={`/api/admin/client-documents/${document.id}/download`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[10px] font-bold text-[var(--pv-navy)] hover:text-[var(--pv-gold)] uppercase tracking-widest transition-colors"
                    >
                      <Download size={12} />
                      Descargar
                    </a>
                  </div>
                </div>

                {document.description && (
                  <div className="mt-4 p-3 bg-[var(--pv-marble)]/50 rounded-xl border border-white text-xs text-[var(--pv-navy)] italic">
                    "{document.description}"
                  </div>
                )}

                {document.amountDue !== null && document.amountDue > 0 && (
                  <div className="mt-4 flex items-center gap-2 p-3 bg-red-50/50 border border-red-100 rounded-xl">
                    <div className={`w-2 h-2 rounded-full ${document.isPaid ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--pv-ink)]">
                      Cobro Extra: {document.amountDue}€ 
                      <span className={document.isPaid ? 'text-emerald-600 ml-1' : 'text-red-600 ml-1'}>
                        ({document.isPaid ? 'PAGADO' : 'PENDIENTE'})
                      </span>
                    </span>
                  </div>
                )}

                {typeof document.matchedScore === 'number' && (
                  <div className="mt-4 flex items-center gap-2">
                    <div className="h-1 flex-1 bg-[var(--pv-marble)] rounded-full overflow-hidden">
                       <div 
                        className="h-full bg-emerald-500" 
                        style={{ width: `${Math.round(document.matchedScore * 100)}%` }}
                       />
                    </div>
                    <span className="text-[10px] font-bold text-[var(--pv-gold)] uppercase tracking-tighter">
                      Match {Math.round(document.matchedScore * 100)}%
                    </span>
                  </div>
                )}

                {document.adminNotes && (
                  <div className="mt-4 p-4 text-xs font-medium text-[var(--pv-navy)] bg-white border border-[var(--pv-gold)]/10 rounded-xl shadow-inner whitespace-pre-wrap">
                    <span className="text-[9px] font-bold text-[var(--pv-gold)] uppercase block mb-1">Nota de Control</span>
                    {document.adminNotes}
                  </div>
                )}

                <div className="mt-6 flex flex-wrap gap-2 pt-4 border-t border-[var(--pv-marble)]">
                  {STATUS_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => updateStatus(document.id, option.value)}
                      disabled={savingId === document.id || document.status === option.value}
                      className={`text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg border transition-all ${
                        document.status === option.value
                          ? 'bg-[var(--pv-gold)] text-white border-[var(--pv-gold)]'
                          : 'bg-white border-[var(--pv-gold)]/20 text-[var(--pv-gold)] hover:bg-[var(--pv-gold)]/10'
                      } disabled:opacity-50`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
