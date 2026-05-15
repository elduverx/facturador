'use client';

import { useEffect, useState } from 'react';
import { formatDateShort } from '@/lib/constants';

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
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'REVIEWED', label: 'Revisado' },
  { value: 'ACCEPTED', label: 'Aceptado' },
  { value: 'REJECTED', label: 'Rechazado' },
];

const STATUS_CLASS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
  REVIEWED: 'bg-blue-100 text-blue-700 border-blue-200',
  ACCEPTED: 'bg-green-100 text-green-700 border-green-200',
  REJECTED: 'bg-red-100 text-red-700 border-red-200',
};

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
    <div className="card">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="font-semibold text-sm">Documentacion del cliente</h3>
          <p className="text-xs text-stone-500">Archivos subidos desde el portal y lectura automatica de Claude</p>
        </div>
        <button onClick={loadDocuments} className="btn btn-secondary text-xs" disabled={loading}>
          {loading ? 'Cargando...' : 'Actualizar'}
        </button>
      </div>

      {error && <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-2 mb-3">{error}</div>}

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : documents.length === 0 ? (
        <p className="text-xs text-stone-400">Sin documentos subidos por el cliente.</p>
      ) : (
        <div className="space-y-3">
          {documents.map((document) => (
            <div key={document.id} className="p-3 rounded-lg border border-stone-200 bg-white">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-stone-800 truncate">{document.fileName}</div>
                  <div className="text-xs text-stone-400">
                    {formatDateShort(document.createdAt.split('T')[0])} · {formatSize(document.sizeBytes)}
                  </div>
                  {document.description && <p className="text-xs text-stone-600 mt-2">{document.description}</p>}
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${STATUS_CLASS[document.status] || STATUS_CLASS.PENDING}`}>
                    {STATUS_OPTIONS.find((option) => option.value === document.status)?.label || document.status}
                  </span>
                  <a
                    href={`/api/admin/client-documents/${document.id}/download`}
                    className="btn btn-secondary text-xs"
                  >
                    Descargar
                  </a>
                </div>
              </div>

              {typeof document.matchedScore === 'number' && (
                <div className="mt-2 text-[11px] text-stone-500">
                  Match DB: <span className="font-semibold">{Math.round(document.matchedScore * 100)}%</span>
                  {document.matchedEmail ? ` · ${document.matchedEmail}` : ''}
                </div>
              )}

              {document.adminNotes && (
                <div className="mt-3 text-xs text-stone-700 bg-stone-50 border border-stone-100 rounded-lg p-3 whitespace-pre-wrap">
                  {document.adminNotes}
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => updateStatus(document.id, option.value)}
                    disabled={savingId === document.id || document.status === option.value}
                    className="text-[11px] px-2 py-1 rounded-lg border border-stone-200 text-stone-600 hover:border-teal-300 hover:text-teal-700 disabled:opacity-50"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
