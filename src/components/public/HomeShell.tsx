import { BookingWizard } from '@/components/booking/BookingWizard';
import { HomeNavbar } from '@/components/public/HomeNavbar';

const SERVICES = [
  ['Arraigo', 'Regularizacion por arraigo social, laboral o familiar con estrategia documental.'],
  ['NIE / TIE', 'Asignacion, renovacion, duplicados y acompanamiento administrativo.'],
  ['Renovaciones', 'Control de plazos, documentacion y presentacion de permisos.'],
  ['Nacionalidad', 'Solicitud, pruebas, seguimiento y preparacion hasta jura o promesa.'],
  ['Reagrupacion', 'Tramitacion para conyuges, hijos y familiares dependientes.'],
  ['Asilo y refugio', 'Proteccion internacional y defensa de derechos en procedimientos urgentes.'],
];

const PROCESS = [
  ['01', 'Diagnostico', 'Estudiamos tu situacion, antecedentes y documentacion disponible.'],
  ['02', 'Estrategia', 'Definimos la via legal mas conveniente y los documentos necesarios.'],
  ['03', 'Seguimiento', 'Controlamos plazos, avances y comunicaciones hasta la resolucion.'],
];

const PROOF = [
  ['500+', 'Casos resueltos'],
  ['10+', 'Anos de experiencia'],
  ['98%', 'Tasa de exito'],
  ['2000+', 'Clientes satisfechos'],
];

const FAQS = [
  ['Necesito cita previa?', 'Si. Trabajamos con cita previa para estudiar cada caso con tiempo y preparar la consulta.'],
  ['Que documentos debo aportar?', 'Depende del tramite. Tras reservar, podras subir documentacion desde Mi Portal.'],
  ['Puedo consultar mi expediente online?', 'Si. Mi Portal permite ver citas, pagos, documentos y actualizaciones publicas.'],
  ['Atienden urgencias?', 'Si, especialmente en expedientes con plazos, requerimientos u ordenes de expulsion.'],
];

export function HomeShell() {
  return (
    <div className="pv-page">
      <header className="pv-dark-panel border-b border-[rgba(200,170,106,0.42)]">
        <div className="pv-shell py-5">
          <div className="flex items-center justify-between gap-4">
            <a href="/" className="flex items-center gap-3">
              <div className="pv-seal w-12 h-12 rounded-full flex items-center justify-center font-legal text-lg font-bold">PV</div>
              <div>
                <div className="font-legal text-xl sm:text-2xl tracking-wide text-[#f8f1df]">PV Abogadas</div>
                <p className="text-[11px] sm:text-xs uppercase tracking-[0.22em] text-[#c8aa6a]">Extranjeria e inmigracion</p>
              </div>
            </a>
            <HomeNavbar />
          </div>
        </div>
      </header>

      <main>
        <section className="pv-shell py-8 sm:py-12">
          <div className="pv-frame pv-paper px-5 py-8 sm:px-10 sm:py-12">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.72fr] gap-10 items-center">
              <div>
                <div className="pv-ribbon px-5 py-2 text-xs sm:text-sm">Derecho de extranjeria</div>
                <h1 className="font-legal text-4xl sm:text-6xl mt-6 text-[var(--pv-navy)] leading-tight">
                  Asesoria legal clara para vivir y trabajar en Espana
                </h1>
                <p className="mt-5 text-base sm:text-lg leading-relaxed text-[var(--pv-muted)] max-w-2xl">
                  Acompanamos tramites de extranjeria con una metodologia ordenada: diagnostico, estrategia, documentacion y seguimiento.
                </p>
                <div className="mt-7 flex flex-col sm:flex-row gap-3">
                  <a href="#reservar" className="btn btn-primary justify-center">Reservar cita</a>
                  <a href="/portal" className="btn btn-secondary justify-center">Entrar a Mi Portal</a>
                </div>
              </div>

              <aside className="pv-dark-panel pv-frame p-6">
                <div className="relative z-10">
                  <div className="pv-seal w-16 h-16 rounded-full flex items-center justify-center font-legal text-2xl font-bold">PV</div>
                  <h2 className="font-legal text-2xl text-white mt-5">Metodo de trabajo</h2>
                  <div className="space-y-4 mt-5">
                    {PROCESS.map(([num, title, desc]) => (
                      <div key={num} className="border-t border-[#c8aa6a]/30 pt-4">
                        <div className="text-xs uppercase tracking-[0.2em] text-[#c8aa6a]">{num} - {title}</div>
                        <p className="text-sm text-[#d8c7a0] mt-1">{desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section id="servicios" className="pv-shell pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-[0.38fr_0.62fr] gap-6">
            <div className="pv-dark-panel pv-frame p-6 sm:p-8">
              <div className="relative z-10">
                <p className="font-legal text-xs uppercase tracking-[0.24em] text-[var(--pv-gold-soft)]">Servicios</p>
                <h2 className="font-legal text-3xl text-white mt-3">Tramites principales</h2>
                <p className="mt-4 text-sm leading-relaxed text-[#d8c7a0]">
                  Seleccionamos la via juridica adecuada y preparamos cada expediente con criterios de viabilidad, plazo y documentacion.
                </p>
              </div>
            </div>

            <div className="pv-frame pv-paper p-5 sm:p-7">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SERVICES.map(([name, desc]) => (
                  <article key={name} className="border border-[var(--pv-line)] bg-[#fff8e8]/70 rounded-md p-4">
                    <h3 className="font-legal text-base text-[var(--pv-navy)]">{name}</h3>
                    <p className="mt-2 text-sm text-[var(--pv-muted)] leading-relaxed">{desc}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="nosotras" className="pv-shell pb-12">
          <div className="pv-frame pv-paper p-5 sm:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-[0.62fr_0.38fr] gap-8 items-start">
              <div>
                <div className="pv-ribbon px-4 py-2 text-xs">Sobre PV Abogadas</div>
                <h2 className="font-legal text-3xl sm:text-4xl text-[var(--pv-navy)] mt-5">Especialistas en expedientes de extranjeria</h2>
                <p className="mt-4 text-sm sm:text-base text-[var(--pv-muted)] leading-relaxed">
                  Nuestro trabajo combina estrategia juridica, orden documental y comunicacion constante. Cada cliente tiene un expediente, una prioridad y una ruta de seguimiento.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {PROOF.map(([value, label]) => (
                  <div key={label} className="text-center border border-[var(--pv-line)] bg-[#fff8e8]/70 rounded-md p-4">
                    <div className="font-legal text-2xl text-[var(--pv-navy)]">{value}</div>
                    <div className="text-[11px] uppercase tracking-wide text-[var(--pv-muted)] mt-1">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="reservar" className="pv-shell pb-12">
          <div className="pv-frame pv-paper p-5 sm:p-8">
            <div className="max-w-2xl mb-6">
              <div className="pv-ribbon px-4 py-2 text-xs">Reserva online</div>
              <h2 className="font-legal text-3xl sm:text-4xl text-[var(--pv-navy)] mt-5">Agenda tu consulta</h2>
              <p className="mt-3 text-sm text-[var(--pv-muted)]">Elige el servicio, selecciona fecha disponible y confirma tus datos.</p>
            </div>
            <BookingWizard />
          </div>
        </section>

        <section id="proceso" className="pv-shell pb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PROCESS.map(([num, title, desc]) => (
              <article key={num} className="pv-frame pv-paper p-5">
                <div className="font-legal text-4xl text-[rgba(11,31,45,0.18)]">{num}</div>
                <h3 className="font-legal text-xl text-[var(--pv-navy)] mt-2">{title}</h3>
                <p className="mt-2 text-sm text-[var(--pv-muted)] leading-relaxed">{desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="faq" className="pv-shell pb-12">
          <div className="pv-frame pv-paper p-5 sm:p-8">
            <div className="max-w-2xl mb-6">
              <div className="pv-ribbon px-4 py-2 text-xs">FAQ</div>
              <h2 className="font-legal text-3xl sm:text-4xl text-[var(--pv-navy)] mt-5">Preguntas frecuentes</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {FAQS.map(([question, answer]) => (
                <article key={question} className="border border-[var(--pv-line)] bg-[#fff8e8]/70 rounded-md p-5">
                  <h3 className="font-legal text-sm uppercase tracking-wide text-[var(--pv-navy)]">{question}</h3>
                  <p className="mt-2 text-sm text-[var(--pv-muted)] leading-relaxed">{answer}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[rgba(200,170,106,0.34)]">
        <div className="pv-shell py-7 text-center text-xs uppercase tracking-[0.22em] text-[#c8aa6a]">
          PV Abogadas - Derecho de extranjeria e inmigracion
        </div>
      </footer>
    </div>
  );
}
