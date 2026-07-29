import { PublicHeader } from '@/components/public/PublicHeader';
import { HomeFooter } from '@/components/public/HomeFooter';
import { WhatsAppButton } from '@/components/public/WhatsAppButton';
import { ShieldCheck } from 'lucide-react';

export default function PoliticaPrivacidadPage() {
  return (
    <div className="min-h-screen bg-[var(--pv-marble)] font-sans flex flex-col relative">
      <PublicHeader />
      
      <main className="flex-1 max-w-4xl mx-auto px-6 py-32 sm:py-40 w-full relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--pv-gold)]/10 text-[var(--pv-gold)] text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-6 border border-[var(--pv-gold)]/20 shadow-sm">
            <ShieldCheck size={14} /> Protección de Datos
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-roman uppercase text-[var(--pv-navy)] tracking-tight">Política de Privacidad</h1>
        </div>
        
        <div className="neo-card bg-white p-8 sm:p-12 shadow-2xl">
          <div className="prose prose-stone prose-lg max-w-none prose-headings:font-roman prose-headings:uppercase prose-headings:text-[var(--pv-navy)] prose-a:text-[var(--pv-gold)] text-[var(--pv-ink)]">
            <p className="lead font-medium opacity-80">
              En <strong>PV Abogadas</strong> estamos comprometidos con la protección de la privacidad y el uso correcto de los datos personales de nuestros clientes y visitantes.
            </p>
            
            <hr className="border-[var(--glass-border)] my-8" />
            
            <h2 className="flex items-center gap-3"><span className="text-[var(--pv-gold)]">1.</span> Responsable del Tratamiento</h2>
            <p>
              Sus datos serán tratados por PV Abogadas, con domicilio en C/ de Sant Ignasi de Loiola, 21, Entresuelo, Extramurs, 46008 València, Valencia.
            </p>

            <h2 className="flex items-center gap-3"><span className="text-[var(--pv-gold)]">2.</span> Finalidad del Tratamiento</h2>
            <ul className="bg-[var(--pv-marble)] p-6 rounded-2xl list-none space-y-3">
              <li className="flex gap-2"><strong>✓</strong> Gestionar la reserva de citas y consultas.</li>
              <li className="flex gap-2"><strong>✓</strong> Ofrecer los servicios de asesoramiento legal solicitados.</li>
              <li className="flex gap-2"><strong>✓</strong> Tareas de facturación y administración de expedientes.</li>
            </ul>

            <h2 className="flex items-center gap-3"><span className="text-[var(--pv-gold)]">3.</span> Legitimación</h2>
            <p>
              La base legal para el tratamiento de sus datos es la ejecución del contrato de prestación de servicios legales, así como el consentimiento explícito prestado al rellenar los formularios de nuestra página web o portal de clientes.
            </p>

            <h2 className="flex items-center gap-3"><span className="text-[var(--pv-gold)]">4.</span> Derechos de los Usuarios</h2>
            <p>
              Cualquier persona tiene derecho a obtener confirmación sobre si estamos tratando datos personales que les conciernan. Usted puede ejercer sus derechos de:
            </p>
            <ul className="list-disc pl-5">
              <li><strong>Acceso</strong> a sus datos personales.</li>
              <li><strong>Rectificación</strong> de datos inexactos.</li>
              <li><strong>Supresión</strong> y olvido cuando los datos ya no sean necesarios.</li>
              <li><strong>Portabilidad</strong> y limitación u oposición a su tratamiento.</li>
            </ul>
            <p>
              Puede ejercer estos derechos contactando con nosotros en nuestro domicilio o a través del correo electrónico <a href="mailto:info@pvabogadas.com">info@pvabogadas.com</a>.
            </p>
          </div>
        </div>
      </main>

      <HomeFooter />
      <WhatsAppButton />
    </div>
  );
}
