'use client';

import { useEffect, useState } from 'react';
import { STATUS_LABELS, formatDateShort } from '@/lib/constants';
import { ClientDocumentUploader } from './ClientDocumentUploader';
import { 
  Briefcase,
  FileText
} from 'lucide-react';

export function MatterDetail({ matterId }: { matterId: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/portal/matters/${matterId}`)
      .then(res => res.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [matterId]);

  if (loading) return <div className="text-center p-12 animate-pulse text-white">Cargando expediente...</div>;
  if (error) return <div className="p-4 bg-red-50 text-red-700 rounded-xl m-4">{error}</div>;
  if (!data?.matter) return <div className="p-4 bg-red-50 text-red-700 rounded-xl m-4">Expediente no encontrado</div>;

  const { matter, documents } = data;

  return (
    <div className="space-y-4 animate-fade-in pb-4">
      {/* Hero Matter Section */}
      <div className="flex flex-col items-center text-center relative z-10 mb-8">
        <h2 className="text-xl sm:text-2xl font-roman uppercase tracking-widest text-white mb-2 font-bold drop-shadow-lg">
          {matter.title}
        </h2>
        <div className="inline-flex items-center gap-2 text-[10px] font-bold text-white/80 uppercase tracking-widest bg-white/5 border border-white/10 px-3 py-1.5 rounded-full backdrop-blur-md shadow-lg">
          {matter.reference}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-3 border-t border-white/10">
        {/* Timeline / Matter status */}
        <section>
          <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50 mb-3 flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-[var(--pv-gold)]/20 flex items-center justify-center">
              <Briefcase size={10} className="text-[var(--pv-gold)]" />
            </div>
            Seguimiento del Caso
          </h3>
          <div className="space-y-3 pl-1">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-roman text-sm font-bold uppercase text-white">Estado Actual</div>
              </div>
              <div className="inline-flex rounded-full bg-white/10 border border-white/10 px-2 py-1 text-[8px] font-black uppercase tracking-widest text-white/80">
                {STATUS_LABELS[matter.status] || matter.status}
              </div>
            </div>
            {matter.timeline && matter.timeline.length > 0 && (
              <div className="pl-3 border-l border-white/10 space-y-3 pt-2">
                {matter.timeline.map((item: any) => (
                  <div key={item.id} className="relative group">
                    <div className="absolute -left-[15px] top-1 w-2 h-2 rounded-full bg-[var(--pv-gold)] shadow-[0_0_8px_rgba(196,161,115,0.5)]"></div>
                    <div className="text-[8px] font-bold text-[var(--pv-gold)]/80 uppercase tracking-widest mb-0.5">
                      {formatDateShort(item.createdAt.split('T')[0])}
                    </div>
                    <div className="font-bold text-xs text-white/90 leading-tight">{item.title}</div>
                    {item.content && <p className="text-[9px] text-white/50 leading-tight mt-1">{item.content}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Documents */}
        {documents && documents.length > 0 && (
          <section>
            <div className="mb-3">
              <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50 flex items-center gap-2">
                 <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center">
                   <FileText size={10} className="text-blue-400" />
                 </div>
                 Documentos Asociados
              </h3>
            </div>
            <div className="bg-white/5 rounded-2xl p-3 border border-white/10 backdrop-blur-sm">
               <ClientDocumentUploader documents={documents} compact={true} />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
