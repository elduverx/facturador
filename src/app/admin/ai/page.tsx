import { AiChatInterface } from '@/components/admin/AiChatInterface';

export const metadata = {
  title: 'IA Asistente | Admin',
};

export default function AiAdminPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-legal font-bold text-[#f8f1df]">IA Asistente</h1>
        <p className="text-[#c8aa6a] text-sm mt-1">Gestiona, verifica y consulta con la inteligencia artificial de PV Abogadas.</p>
      </header>

      <AiChatInterface />
    </div>
  );
}
