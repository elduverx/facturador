'use client';

import { formatDateShort } from '@/lib/constants';
import { FileText, Download } from 'lucide-react';

export type PublicDocument = {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  description: string | null;
  status: string;
  adminNotes: string | null;
  amountDue?: number | null;
  isPaid?: boolean;
  createdAt: string;
};

interface ClientDocumentUploaderProps {
  documents: PublicDocument[];
  compact?: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Disponible',
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

export function ClientDocumentUploader({ documents, compact = false }: ClientDocumentUploaderProps) {
  const handleDownload = (docId: string) => {
    window.open(`/api/client-documents/${docId}/download`, '_blank');
  };

  const handlePay = (docId: string) => {
    window.location.href = `/api/payments/redsys-document?documentId=${docId}`;
  };

  return (
    <div className="space-y-4">
      {documents.length === 0 ? (
        <div className="p-6 bg-[var(--pv-marble)]/60 rounded-xl border-2 border-dashed border-[var(--pv-gold)]/20 text-xs text-[var(--pv-navy)]/50 text-center font-bold tracking-widest uppercase">
          Aún no tienes documentos de la abogada.
        </div>
      ) : (
        <div className={`${compact ? 'max-h-[400px] overflow-y-auto pr-2 custom-scrollbar' : ''} space-y-4`}>
          {documents.map((document) => {
            const requiresPayment = document.amountDue && document.amountDue > 0 && !document.isPaid;
            
            return (
            <div key={document.id} className="group relative rounded-[20px] bg-white border border-[var(--pv-marble)] shadow-sm hover:shadow-xl hover:border-[var(--pv-gold)]/30 transition-all duration-500 overflow-hidden p-4 sm:p-5">
              {/* Decorative Background */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--pv-gold)]/5 rounded-bl-[100px] -z-10 transition-transform duration-700 group-hover:scale-110"></div>
              
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--pv-marble)] border border-white shadow-inner flex items-center justify-center shrink-0 group-hover:bg-[var(--pv-gold)] transition-colors duration-500">
                    <FileText size={20} className="text-[var(--pv-navy)] group-hover:text-white transition-colors duration-500" />
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <h4 className="font-roman text-sm font-bold text-[var(--pv-ink)] truncate mb-1.5">{document.fileName}</h4>
                    <div className="flex flex-wrap items-center gap-2 text-[9px] font-black text-[var(--pv-navy)]/50 uppercase tracking-[0.2em]">
                      <span className="bg-[var(--pv-marble)] px-2 py-1 rounded-md">{formatDateShort(document.createdAt.split('T')[0])}</span>
                      <span>·</span>
                      <span className="bg-[var(--pv-marble)] px-2 py-1 rounded-md">{formatSize(document.sizeBytes)}</span>
                      {requiresPayment && (
                        <>
                          <span>·</span>
                          <span className="bg-red-50 text-red-600 border border-red-100 px-2 py-1 rounded-md">Pago requerido: {document.amountDue!.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
                        </>
                      )}
                    </div>

                    {document.description && (
                      <p className="text-xs text-[var(--pv-navy)]/80 mt-3.5 font-medium leading-relaxed">
                        {document.description}
                      </p>
                    )}
                  </div>
                </div>

                {requiresPayment ? (
                  <button 
                    onClick={() => handlePay(document.id)}
                    className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 px-6 py-3 sm:py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 hover:-translate-y-0.5 transition-all shadow-md active:scale-95"
                    title="Pagar para descargar"
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest">Pagar</span>
                  </button>
                ) : (
                  <button 
                    onClick={() => handleDownload(document.id)}
                    className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 rounded-xl bg-[var(--pv-navy)] text-white hover:bg-[var(--pv-gold)] hover:-translate-y-0.5 transition-all shadow-md active:scale-95"
                    title="Descargar documento"
                  >
                    <Download size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Descargar</span>
                  </button>
                )}
              </div>
              
              {document.adminNotes && (
                <div className="mt-4 sm:ml-16 relative animate-fade-in-up">
                  {/* Speech bubble arrow */}
                  <div className="absolute -top-2 left-4 w-4 h-4 bg-[var(--pv-gold)]/10 border-t border-l border-[var(--pv-gold)]/20 rotate-45"></div>
                  
                  <div className="relative text-[11px] text-[var(--pv-ink)] bg-[var(--pv-gold)]/10 border border-[var(--pv-gold)]/20 rounded-xl rounded-tl-none p-4 whitespace-pre-wrap font-medium">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 rounded-full bg-[var(--pv-gold)] flex items-center justify-center text-white text-[9px] font-black font-roman shadow-sm">PV</div>
                      <span className="text-[9px] uppercase tracking-widest text-[var(--pv-gold)] font-black">Nota de la abogada</span>
                    </div>
                    {document.adminNotes}
                  </div>
                </div>
              )}
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
