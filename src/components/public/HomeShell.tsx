'use client';

import { useEffect, useState } from 'react';
import { BookingWizard } from '@/components/booking/BookingWizard';
import { AppointmentLookup } from '@/components/booking/AppointmentLookup';
import { BlogSection } from '@/components/blog/BlogSection';
import { HomeNavbar } from '@/components/public/HomeNavbar';

export function HomeShell() {
  const [showConsult, setShowConsult] = useState(false);

  useEffect(() => {
    if (showConsult) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [showConsult]);

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-gradient-to-br from-teal-700 via-teal-600 to-teal-500 text-white">
        <div className="max-w-5xl mx-auto px-4 py-4 sm:py-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
              </div>
              <div>
                <h1 className="font-serif text-xl sm:text-2xl">Abogados PV</h1>
                <p className="text-teal-100 text-xs sm:text-sm">Reserva tu cita en minutos.</p>
              </div>
            </div>
            <HomeNavbar onOpenConsult={() => setShowConsult(true)} />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 sm:py-10 space-y-6 sm:space-y-8">
        <section id="reservar" className="space-y-3 sm:space-y-4">
          <div>
            <h2 className="text-base sm:text-lg font-semibold">Reserva tu cita</h2>
            <p className="text-xs sm:text-sm text-stone-500">Selecciona el servicio y el horario disponible.</p>
          </div>
          <BookingWizard />
        </section>

        <section id="consultar" className="space-y-3 sm:space-y-4 hidden sm:block">
          <div>
            <h2 className="text-base sm:text-lg font-semibold">Consultar cita ya agendada</h2>
            <p className="text-xs sm:text-sm text-stone-500">Revisa tus reservas futuras con email y telefono.</p>
          </div>
          <AppointmentLookup />
        </section>
      </main>

      <div id="blog">
        <BlogSection />
      </div>

      <footer className="border-t border-stone-200 bg-white">
        <div className="max-w-3xl mx-auto px-4 py-6 text-center">
          <p className="text-xs text-stone-400">Consultorio de Abogadas de Extranjeria</p>
        </div>
      </footer>

      {showConsult && (
        <div
          className="sm:hidden fixed inset-0 z-50 bg-black/40 flex items-end"
          onClick={() => setShowConsult(false)}
        >
          <div
            className="bg-white w-full rounded-t-2xl p-4 max-h-[92vh] overflow-y-auto"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold">Consultar cita</h3>
                <p className="text-xs text-stone-500">Usa el email y telefono de tu reserva.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowConsult(false)}
                className="text-xs text-stone-500 hover:text-stone-700"
              >
                Cerrar
              </button>
            </div>
            <AppointmentLookup />
          </div>
        </div>
      )}
    </div>
  );
}
