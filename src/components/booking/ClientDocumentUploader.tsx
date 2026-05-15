'use client';

import { useState } from 'react';
import { formatDateShort } from '@/lib/constants';

export type PublicDocument = {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  description: string | null;
  status: string;
  adminNotes: string | null;
  createdAt: string;
};

interface ClientDocumentUploaderProps {
  email: string;
  phone: string;
  documents: PublicDocument[];
  onUploaded: (document: PublicDocument) => void;
  compact?: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Recibido',
  REVIEWED: 'Revisado',
  ACCEPTED: 'Aceptado',
  REJECTED: 'Rechazado',
};

const STATUS_CLASS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  REVIEWED: 'bg-blue-100 text-blue-700',
  ACCEPTED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
};

const formatSize = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function ClientDocumentUploader({ email, phone, documents, onUploaded, compact = false }: ClientDocumentUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const uploadDocument = async () => {
    if (!file) {
      setError('Selecciona un documento.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('phone', phone);
      formData.append('description', description);
      formData.append('file', file);

      const res = await fetch('/api/client-documents', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || 'No se pudo subir el documento.');
      }

      onUploaded(data.document);
      setFile(null);
      setDescription('');
      setMessage(data.aiAnalyzed ? 'Documento recibido y analizado automaticamente.' : 'Documento recibido.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir el documento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${compact ? 'space-y-2 min-h-0 flex flex-col' : 'space-y-4'}`}>
      <div className={`${compact ? 'p-3' : 'p-4'} bg-[#fff8e8]/70 rounded-md border border-[var(--pv-line)] shadow-sm shrink-0`}>
        <h3 className="font-legal text-sm uppercase tracking-wide text-[var(--pv-navy)] flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-teal-600">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          Subir documentos
        </h3>
        {!compact && <p className="text-xs text-stone-500 mt-1">PDF o imagen. Maximo 10 MB por archivo.</p>}

        <div className={`${compact ? 'mt-2 space-y-2' : 'mt-3 space-y-3'}`}>
          <input
            type="file"
            className="form-input text-xs"
            accept=".pdf,image/jpeg,image/png,image/webp"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
            disabled={loading}
          />
          <textarea
            className={`form-input text-sm ${compact ? 'min-h-[48px]' : 'min-h-[70px]'}`}
            placeholder="Indica que documento estas enviando o cualquier aclaracion para el abogado..."
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            disabled={loading}
          />
          <button onClick={uploadDocument} disabled={loading} className="btn btn-primary text-xs disabled:opacity-60">
            {loading ? 'Subiendo y analizando...' : 'Enviar documento'}
          </button>
          {error && <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-2">{error}</div>}
          {message && <div className="text-xs text-teal-700 bg-teal-50 border border-teal-100 rounded-lg p-2">{message}</div>}
        </div>
      </div>

      <div className={`${compact ? 'space-y-2 min-h-0 flex flex-col' : 'space-y-3'}`}>
        <h3 className="font-legal text-sm uppercase tracking-wide text-[var(--pv-navy)] px-1">Documentos enviados</h3>
        {documents.length === 0 ? (
          <div className="p-3 bg-[#fff8e8]/70 rounded-md border border-[var(--pv-line)] text-xs text-[var(--pv-muted)] text-center">
            Todavia no hay documentos subidos.
          </div>
        ) : (
          <div className={`${compact ? 'overflow-y-auto pr-1' : ''} space-y-2`}>
          {documents.map((document) => (
            <div key={document.id} className="p-3 bg-[#fff8e8]/70 rounded-md border border-[var(--pv-line)] shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[var(--pv-navy)] truncate">{document.fileName}</div>
                  <div className="text-xs text-stone-400">
                    {formatDateShort(document.createdAt.split('T')[0])} · {formatSize(document.sizeBytes)}
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_CLASS[document.status] || STATUS_CLASS.PENDING}`}>
                  {STATUS_LABELS[document.status] || document.status}
                </span>
              </div>
              {document.description && <p className="text-xs text-stone-600 mt-2">{document.description}</p>}
              {document.adminNotes && (
                <div className="mt-2 text-xs text-stone-600 bg-stone-50 border border-stone-100 rounded-lg p-2 whitespace-pre-wrap">
                  {document.adminNotes}
                </div>
              )}
            </div>
          ))}
          </div>
        )}
      </div>
    </div>
  );
}
