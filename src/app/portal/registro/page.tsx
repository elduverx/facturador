'use client';

import { ArrowLeft, UserPlus, ShieldCheck, Mail } from 'lucide-react';
import Link from 'next/link';

export default function RegistroPortalPage() {
  return (
    <div className="min-h-screen bg-[var(--pv-marble)] relative font-sans text-[var(--pv-ink)] selection:bg-[var(--pv-gold)] selection:text-white">
      {/* Header */}
      <header className="relative z-50 bg-white/80 backdrop-blur-md border-b border-[var(--glass-border)] shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-[var(--pv-gold)] rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(196,161,115,0.4)] transform rotate-12 group-hover:rotate-0 transition-transform duration-500">
              <ShieldCheck className="text-white w-6 h-6" />
            </div>
            <div>
              <div className="font-roman text-lg font-bold tracking-tight text-[var(--pv-navy)] drop-shadow-sm">PV ABOGADAS</div>
              <p className="text-[9px] uppercase tracking-[0.2em] text-[var(--pv-gold)] font-bold">Área privada</p>
            </div>
          </Link>
          
          <nav className="flex items-center gap-6">
             <Link href="/portal" className="text-[10px] uppercase tracking-[0.2em] font-bold text-[var(--pv-navy)] hover:text-[var(--pv-gold)] transition-colors flex items-center gap-2">
                <ArrowLeft size={14} />
                Volver al portal
             </Link>
          </nav>
        </div>
      </header>

      <main className="relative z-20 max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="mb-10 text-center animate-fade-in-up">
          <div className="inline-flex items-center justify-center gap-2 mb-4 px-4 py-1.5 rounded-full bg-[var(--pv-gold)]/10 border border-[var(--pv-gold)]/20 text-[10px] font-bold uppercase tracking-widest text-[var(--pv-gold)] backdrop-blur-md">
            <UserPlus size={14} />
            Nuevo Registro
          </div>
          <h1 className="font-roman text-3xl sm:text-4xl font-bold uppercase tracking-tight text-[var(--pv-navy)] mb-4">
            Completar mi <span className="text-[var(--pv-gold)]">Registro</span>
          </h1>
          <p className="text-sm sm:text-base leading-relaxed text-[var(--pv-navy)]/70">
            Si ya eres cliente pero no tienes cuenta en nuestro portal, completa los siguientes datos para vincular tu expediente y poder acceder a tus documentos, estados y citas.
          </p>
        </div>

        <div className="bg-white rounded-[2rem] p-6 sm:p-10 shadow-xl border border-[var(--glass-border)] relative overflow-hidden animate-fade-in-up">
          <div className="absolute top-0 left-0 w-64 h-64 bg-[var(--pv-gold)] rounded-full mix-blend-multiply filter blur-[100px] opacity-5 pointer-events-none"></div>
          
          <form className="relative z-10 space-y-6" action="/api/portal/registro" method="POST" onSubmit={(e) => { e.preventDefault(); alert('Registro enviado para validación.'); window.location.href='/portal'; }}>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-[var(--pv-gold)] ml-2">
                  Nombre Completo
                </label>
                <input 
                  type="text" 
                  name="fullName"
                  required
                  placeholder="Tu nombre y apellidos"
                  className="w-full px-5 py-3 rounded-xl border border-gray-200 bg-[var(--pv-marble)] focus:bg-white focus:border-[var(--pv-gold)]/40 focus:ring-2 focus:ring-[var(--pv-gold)]/15 outline-none transition duration-300 text-[var(--pv-ink)] shadow-inner"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-[var(--pv-gold)] ml-2">
                  Número de NIE / DNI
                </label>
                <input 
                  type="text" 
                  name="nie"
                  required
                  placeholder="Ej: Y1234567Z"
                  className="w-full px-5 py-3 rounded-xl border border-gray-200 bg-[var(--pv-marble)] focus:bg-white focus:border-[var(--pv-gold)]/40 focus:ring-2 focus:ring-[var(--pv-gold)]/15 outline-none transition duration-300 text-[var(--pv-ink)] shadow-inner"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-[var(--pv-gold)] ml-2">
                  Email
                </label>
                <input 
                  type="email" 
                  name="email"
                  required
                  placeholder="ejemplo@correo.com"
                  className="w-full px-5 py-3 rounded-xl border border-gray-200 bg-[var(--pv-marble)] focus:bg-white focus:border-[var(--pv-gold)]/40 focus:ring-2 focus:ring-[var(--pv-gold)]/15 outline-none transition duration-300 text-[var(--pv-ink)] shadow-inner"
                />
                <p className="text-[10px] text-[var(--pv-navy)]/50 ml-2 mt-1">Usa el mismo email de tus trámites</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-[var(--pv-gold)] ml-2">
                  Teléfono Móvil
                </label>
                <input 
                  type="tel" 
                  name="phone"
                  required
                  placeholder="600000000"
                  pattern="[0-9]*"
                  maxLength={9}
                  className="w-full px-5 py-3 rounded-xl border border-gray-200 bg-[var(--pv-marble)] focus:bg-white focus:border-[var(--pv-gold)]/40 focus:ring-2 focus:ring-[var(--pv-gold)]/15 outline-none transition duration-300 text-[var(--pv-ink)] shadow-inner"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-[var(--glass-border)]">
              <button type="submit" className="relative overflow-hidden px-7 py-4 w-full rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 bg-gradient-to-br from-[#d4af37] to-[var(--pv-gold)] text-white shadow-[0_4px_10px_rgba(197,160,89,0.25)] hover:brightness-105 hover:shadow-[0_6px_15px_rgba(197,160,89,0.35)] hover:-translate-y-px active:scale-[0.98]">
                Completar Registro
              </button>
            </div>
            
            <p className="text-center text-[10px] text-[var(--pv-navy)]/50 mt-4 leading-relaxed">
              Al registrarte, confirmas que eres cliente actual del despacho. Tus datos serán validados con nuestro sistema para darte acceso a tus expedientes.
            </p>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 py-8 border-t border-[var(--glass-border)] bg-white/50 text-center backdrop-blur-md">
         <p className="text-[10px] uppercase tracking-[0.4em] text-[var(--pv-navy)]/50 font-bold">
            PV ABOGADAS &copy; {new Date().getFullYear()} - Consultorio de Extranjería
         </p>
      </footer>
    </div>
  );
}
