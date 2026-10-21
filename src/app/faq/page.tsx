import { PublicHeader } from '@/components/public/PublicHeader';
import { HomeFooter } from '@/components/public/HomeFooter';
import { WhatsAppButton } from '@/components/public/WhatsAppButton';
import { ChevronRight, HelpCircle } from 'lucide-react';
import Link from 'next/link';

const FAQS = [
  {
    q: '¿Qué incluye tu consulta?',
    a: (
      <div className="space-y-2">
        <ul className="space-y-1.5">
          <li className="flex items-start gap-2">
            <span className="text-[var(--pv-gold)] font-black leading-none">•</span>
            <span>Evaluación jurídica completa de tu caso individual.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[var(--pv-gold)] font-black leading-none">•</span>
            <span>Revisión de los documentos que aportes a la cita.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[var(--pv-gold)] font-black leading-none">•</span>
            <span>Viabilidad legal, requisitos exactos y hoja de ruta.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[var(--pv-gold)] font-black leading-none">•</span>
            <span>Presupuesto cerrado si decides iniciar el trámite.</span>
          </li>
        </ul>
        <p className="text-xs italic opacity-75 pt-2">
          (La consulta cubre el asesoramiento y diagnóstico durante la sesión; no incluye la presentación de trámites ni recursos, que se presupuestan aparte).
        </p>
      </div>
    ),
  },
  {
    q: 'Importante sobre otros casos o familiares',
    a: (
      <div className="space-y-2">
        <ul className="space-y-1.5">
          <li className="flex items-start gap-2">
            <span className="text-[var(--pv-gold)] font-black leading-none">•</span>
            <span>Cada consulta es para <strong>una sola persona / expediente</strong>.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[var(--pv-gold)] font-black leading-none">•</span>
            <span>Consultar por el caso de un familiar, pareja o amigo requiere abonar una consulta adicional.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[var(--pv-gold)] font-black leading-none">•</span>
            <span>Si ya eres cliente, el seguimiento de tu expediente activo es gratuito, pero un caso nuevo o de otra persona se abona aparte.</span>
          </li>
        </ul>
      </div>
    ),
  },
  {
    q: 'Si mi trámite incluye a mi familia (ej. Reagrupación Familiar o Divorcio), ¿se paga una consulta por cada uno?',
    a: (
      <>
        <strong>No</strong> cuando se trata de <strong>un único procedimiento legal conjunto</strong> en el que tú eres el solicitante principal (por ejemplo, si vas a reagrupar a tu cónyuge e hijos, o en un convenio de divorcio con medidas sobre los hijos en común). En cambio, <strong>sí se abona una consulta por cada persona</strong> cuando se trata de <strong>expedientes individuales e independientes</strong> (por ejemplo, dos familiares o amigos que quieren evaluar cada uno su propio permiso de residencia, arraigo o despido).
      </>
    ),
  },
  {
    q: '¿Puedo acudir acompañado a la consulta?',
    a: (
      <>
        Sí, puedes venir con un acompañante de confianza si lo deseas para sentirte más cómodo. Sin embargo, toda la sesión estará dedicada exclusivamente a evaluar <strong>tu caso</strong>. Si la persona que te acompaña desea aprovechar para hacer preguntas sobre su propia situación legal, deberá abonar su correspondiente consulta.
      </>
    ),
  },
  {
    q: '¿Qué pasa si tengo dos problemas legales distintos a la vez (por ejemplo, Extranjería y un Despido Laboral)?',
    a: (
      <>
        Cada área legal requiere un análisis normativo y documental específico. Si necesitas evaluar dos casos de distinta naturaleza (por ejemplo, un expediente de extranjería y paralelamente una demanda por despido o un divorcio), al tratarse de dos estudios jurídicos independientes se requiere reservar tiempo y tarifa para dos consultas.
      </>
    ),
  },
  {
    q: '¿Cuánto cuesta la consulta y cómo se realiza el pago?',
    a: (
      <>
        Durante el proceso de reserva podrás ver el importe exacto según el tipo de asesoría seleccionada. Actualmente el pago se realiza directamente en la consulta. Nuestro compromiso es la transparencia total desde el primer minuto. Puedes <Link href="/reservar" className="text-[var(--pv-gold)] font-bold hover:underline">reservar tu cita inicial aquí</Link>.
      </>
    ),
  },
  {
    q: '¿Necesito pedir cita previa y qué pasa si llego tarde?',
    a: (
      <>
        Sí, trabajamos exclusivamente con <Link href="/reservar" className="text-[var(--pv-gold)] font-bold hover:underline">cita previa</Link> para dedicar a cada cliente el tiempo que merece. Te rogamos puntualidad: si llegas tarde, la consulta deberá ajustarse al tiempo restante de tu franja horaria para no retrasar a los siguientes clientes. Si necesitas cambiar o cancelar tu cita, avísanos con al menos 24 horas de antelación.
      </>
    ),
  },
  {
    q: '¿Puedo hacer la consulta online (videollamada) o presencial?',
    a: (
      <>
        Sí. Durante el proceso de <Link href="/reservar" className="text-[var(--pv-gold)] font-bold hover:underline">reserva de cita</Link> podrás elegir la modalidad que prefieras: <strong>Presencial en nuestro despacho</strong> o <strong>Online mediante videollamada</strong>, con exactamente las mismas condiciones y rigor profesional.
      </>
    ),
  },
  {
    q: '¿Qué áreas legales cubren exactamente?',
    a: 'Somos especialistas en tres pilares fundamentales: Extranjería e Inmigración (arraigos, nacionalidad, visados, renovaciones, familiares de comunitarios), Derecho Laboral (despidos, reclamación de salarios, sanciones) y Derecho de Familia (divorcios, guarda y custodia, convenios reguladores).',
  },
  {
    q: '¿Dónde está ubicada la oficina?',
    a: (
      <>
        Nos encontramos en Valencia: <a href="https://www.google.com/maps/search/?api=1&query=C/+de+Sant+Ignasi+de+Loiola,+21,+46008+Valencia" target="_blank" rel="noopener noreferrer" className="text-[var(--pv-gold)] font-bold hover:underline">C/ de Sant Ignasi de Loiola, 21, Entresuelo, Extramurs, 46008 València</a>.
      </>
    ),
  },
  {
    q: 'Ya soy cliente, ¿cómo puedo ver el estado de mi expediente o subir documentos?',
    a: (
      <>
        Puedes acceder en cualquier momento a nuestro <Link href="/portal" className="text-[var(--pv-gold)] font-bold hover:underline">Portal de Cliente</Link> introduciendo tu email y NIE/DNI. Desde tu área privada podrás consultar el estado de tus expedientes en tiempo real y subir de forma segura cualquier documento que te hayamos solicitado.
      </>
    ),
  },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-[var(--pv-marble)] font-sans flex flex-col relative">
      <PublicHeader />
      
      <main className="flex-1 max-w-4xl mx-auto px-6 py-32 sm:py-40 w-full relative z-10">
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1 rounded-full bg-[var(--pv-gold)]/10 text-[var(--pv-gold)] text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-4 sm:mb-6 border border-[var(--pv-gold)]/20">
             <HelpCircle size={14} />
             Dudas Comunes
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold font-roman uppercase text-[var(--pv-navy)] tracking-tight mb-4">Preguntas Frecuentes</h1>
          <p className="text-sm sm:text-base text-[var(--pv-navy)] opacity-60 max-w-2xl mx-auto">
            Encuentra respuestas rápidas y transparentes a las dudas más habituales sobre nuestras consultas y servicios legales.
          </p>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {FAQS.map((faq, i) => (
            <details key={i} className="bg-white rounded-2xl shadow-sm border border-[var(--glass-border)] group cursor-pointer marker:content-[''] hover:shadow-md transition-all p-4 sm:p-6">
               <summary className="flex items-center justify-between font-bold text-[var(--pv-navy)] text-sm sm:text-lg list-none outline-none pr-2">
                  <span className="pr-4">{faq.q}</span>
                  <span className="text-[var(--pv-gold)] shrink-0 transform transition-transform duration-300 group-open:rotate-90">
                     <ChevronRight size={16} className="sm:w-5 sm:h-5" />
                  </span>
               </summary>
               <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-[var(--glass-border)] text-xs sm:text-base text-[var(--pv-navy)] opacity-75 leading-relaxed">
                  {faq.a}
               </div>
            </details>
          ))}
        </div>
      </main>

      <HomeFooter />
      <WhatsAppButton />
    </div>
  );
}
