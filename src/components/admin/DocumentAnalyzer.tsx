'use client';

import { useCallback, useState } from 'react';
import { Sparkles, UploadCloud, Check, AlertCircle } from 'lucide-react';

interface DocumentAnalyzerProps {
  clientEmail: string;
  onAnalysisComplete: () => void;
}

export function DocumentAnalyzer({ clientEmail, onAnalysisComplete }: DocumentAnalyzerProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isOver, setIsOver] = useState(false);

  const processFile = useCallback(
    async (file?: File) => {
      if (!file) return;

      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setError('Solo se admiten PDFs e imagenes (JPG, PNG, WebP)');
        setMessage(null);
        return;
      }

      setAnalyzing(true);
      setError(null);
      setMessage(null);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('email', clientEmail);

        const res = await fetch('/api/admin/documents/analyze', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error || 'Error en el servidor al analizar el documento');
        }

        if (data.success) {
          setMessage(data.message || 'Documento analizado y nota creada automaticamente.');
          onAnalysisComplete();
        }
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'No se pudo procesar el documento. Intentalo de nuevo.');
      } finally {
        setAnalyzing(false);
      }
    },
    [clientEmail, onAnalysisComplete]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsOver(false);
      processFile(e.dataTransfer.files[0]);
    },
    [processFile]
  );

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsOver(true);
        }}
        onDragLeave={() => setIsOver(false)}
        onDrop={handleDrop}
        className={`relative neo-card !p-8 border-2 border-dashed transition-all duration-300 text-center flex flex-col items-center justify-center min-h-[220px] ${
          analyzing
            ? 'opacity-60 cursor-wait bg-[var(--pv-marble)] border-[var(--pv-gold)]'
            : isOver
              ? 'border-[var(--pv-gold)] bg-[var(--pv-gold)]/5 scale-[1.02] shadow-xl'
              : 'border-[var(--pv-gold)]/30 hover:border-[var(--pv-gold)] hover:bg-white/50'
        }`}
      >
        <input
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-wait"
          onChange={(e) => processFile(e.target.files?.[0])}
          disabled={analyzing}
          accept=".pdf,image/*"
        />

        <div className="flex flex-col items-center gap-4">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-500 ${
              analyzing ? 'bg-[var(--pv-gold)] text-white' : isOver ? 'bg-[var(--pv-gold)] text-white rotate-12' : 'bg-white text-[var(--pv-gold)]'
            }`}
          >
            {analyzing ? (
              <Sparkles className="w-8 h-8 animate-pulse" />
            ) : (
              <UploadCloud className="w-8 h-8" />
            )}
          </div>

          <div className="max-w-xs">
            <h4 className="text-lg font-bold font-roman uppercase tracking-tight text-[var(--pv-ink)]">
              {analyzing ? 'Analizando documento...' : 'Análisis de documentos'}
            </h4>
            <p className="text-xs text-[var(--pv-navy)] opacity-60 mt-2 font-medium">
              Arrastra resoluciones, requerimientos o tasas para que la IA los procese y categorice automáticamente.
            </p>
          </div>
        </div>

        {analyzing && (
          <div className="absolute inset-x-0 bottom-0 h-1.5 bg-[var(--pv-marble)] overflow-hidden rounded-b-2xl">
            <div className="h-full bg-[var(--pv-gold)] animate-[loading_2s_infinite_linear]" style={{ width: '40%' }}></div>
          </div>
        )}
      </div>

      {error && (
        <div className="text-xs font-bold text-red-600 bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-3 animate-shake">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {message && (
        <div className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-center gap-3 animate-fade-in">
          <Check size={18} />
          {message}
        </div>
      )}

      <style jsx>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(250%); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.4s ease-in-out; }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
