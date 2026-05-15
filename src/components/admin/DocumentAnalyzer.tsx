'use client';

import { useCallback, useState } from 'react';

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
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsOver(true);
        }}
        onDragLeave={() => setIsOver(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 text-center ${
          analyzing
            ? 'opacity-60 cursor-wait'
            : isOver
              ? 'border-teal-500 bg-teal-50/50 scale-[1.01]'
              : 'border-stone-200 hover:border-stone-300'
        }`}
      >
        <input
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-wait"
          onChange={(e) => processFile(e.target.files?.[0])}
          disabled={analyzing}
          accept=".pdf,image/*"
        />

        <div className="flex flex-col items-center gap-3">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              isOver ? 'bg-teal-100 text-teal-600' : 'bg-stone-100 text-stone-400'
            }`}
          >
            {analyzing ? (
              <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
            )}
          </div>

          <div>
            <p className="text-sm font-bold text-stone-700">
              {analyzing ? 'Analizando con IA...' : 'Analizar documento con IA'}
            </p>
            <p className="text-xs text-stone-400 mt-1">Arrastra o haz clic para subir resolucion, requerimiento o tasa</p>
          </div>
        </div>

        {analyzing && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-stone-100 overflow-hidden rounded-b-xl">
            <div className="h-full bg-teal-500 animate-[loading_1.5s_infinite_linear]" style={{ width: '30%' }}></div>
          </div>
        )}
      </div>

      {error && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-100 p-2 rounded-lg text-center animate-shake">
          {error}
        </div>
      )}

      {message && (
        <div className="text-xs text-teal-700 bg-teal-50 border border-teal-100 p-2 rounded-lg text-center">
          {message}
        </div>
      )}

      <style jsx>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.4s ease-in-out; }
      `}</style>
    </div>
  );
}
