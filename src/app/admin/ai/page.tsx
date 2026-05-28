import { AiChatInterface } from '@/components/admin/AiChatInterface';
import { Sparkles } from 'lucide-react';

export const metadata = {
  title: 'IA Asistente | PV Abogadas',
};

export default function AiAdminPage() {
  return (
    <div className="space-y-8">
      <header className="neo-card !p-8 border-l-4 border-l-[var(--pv-gold)] bg-gradient-to-r from-[var(--glass-bg)] to-transparent">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[var(--pv-gold)] bg-opacity-10 flex items-center justify-center text-[var(--pv-gold)]">
            <Sparkles size={24} />
          </div>
          <h1 className="text-3xl font-roman font-bold text-[var(--pv-ink)] uppercase tracking-tight">IA Asistente</h1>
        </div>
        <p className="text-[var(--pv-navy)] opacity-60 text-lg ml-14">
          Consulta con tu asistente de inteligencia artificial. Gestiona, verifica y automatiza tus expedientes de extranjería.
        </p>
      </header>

      <div className="neo-card !p-0 overflow-hidden shadow-2xl">
        <AiChatInterface />
      </div>
    </div>
  );
}
