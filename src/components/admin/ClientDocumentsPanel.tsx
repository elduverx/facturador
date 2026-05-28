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
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [clientEmail]);

  const updateStatus = async (documentId: string, status: string) => {
    setSavingId(documentId);
    setError('');

    try {
      const res = await fetch(`/api/admin/client-documents/${documentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const updated = await res.json();
      if (!res.ok) throw new Error(updated?.error || 'No se pudo actualizar el documento.');
      setDocuments((current) => current.map((document) => document.id === documentId ? updated : document));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el documento.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="neo-card !p-8 h-full flex flex-col">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[var(--pv-gold)] text-white rounded-xl shadow-lg">
            <FileText size={22} />
          </div>
          <div>
            <h3 className="text-xl font-bold font-roman uppercase text-[var(--pv-ink)]">Archivo Documental</h3>
            <p className="text-xs text-[var(--pv-navy)] opacity-40">Documentos aportados por el cliente vía portal.</p>
          </div>
        </div>
        <button 
          onClick={loadDocuments} 
          className={`p-2.5 rounded-xl border border-[var(--pv-gold)]/20 text-[var(--pv-gold)] hover:bg-[var(--pv-gold)] hover:text-white transition-all ${loading ? 'animate-spin' : ''}`}
          disabled={loading}
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {error && (
        <div className="text-xs font-bold text-red-600 bg-red-50 border border-red-100 rounded-xl p-4 mb-6 flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-[var(--pv-gold)] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-bold text-[var(--pv-gold)] uppercase tracking-widest animate-pulse">Cargando Archivo...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-20 bg-[var(--pv-marble)] rounded-2xl border border-dashed border-[var(--pv-gold)]/20">
            <p className="text-sm text-[var(--pv-navy)] opacity-40">Sin documentos en el repositorio.</p>
          </div>
        ) : (
          documents.map((document) => {
            const currentStatus = STATUS_OPTIONS.find(s => s.value === document.status) || STATUS_OPTIONS[0];
            return (
              <div key={document.id} className="p-5 rounded-2xl bg-white border border-white/50 shadow-sm hover:shadow-md transition-all duration-300 group">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-[var(--pv-marble)] rounded-xl flex items-center justify-center text-[var(--pv-gold)] shadow-inner group-hover:bg-[var(--pv-gold)] group-hover:text-white transition-all duration-500">
                       <FileText size={24} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-[var(--pv-ink)] truncate max-w-[200px]">{document.fileName}</div>
                      <div className="text-[10px] font-bold text-[var(--pv-navy)] opacity-40 uppercase tracking-widest mt-1">
                        {formatDateShort(document.createdAt.split('T')[0])} · {formatSize(document.sizeBytes)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 ${currentStatus.color}`}>
                      <currentStatus.icon size={12} />
                      {currentStatus.label}
                    </span>
                    <a
                      href={`/api/admin/client-documents/${document.id}/download`}
                      className="p-2 rounded-lg bg-[var(--pv-marble)] text-[var(--pv-navy)] hover:bg-[var(--pv-gold)] hover:text-white transition-all shadow-sm"
                      title="Descargar Documento"
                    >
                      <Download size={16} />
                    </a>
                  </div>
                </div>

                {document.description && (
                  <div className="mt-4 p-3 bg-[var(--pv-marble)]/50 rounded-xl border border-white text-xs text-[var(--pv-navy)] italic">
                    "{document.description}"
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
