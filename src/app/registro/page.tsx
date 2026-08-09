'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, AlertCircle, ArrowLeft } from 'lucide-react';
import { HomeNavbar } from '@/components/public/HomeNavbar';

export default function RegistroPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    nie: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Error al registrar la cuenta');
      }

      // Registro exitoso, ir al portal
      router.push('/portal');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] font-sans flex flex-col relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[url('/loginm.png')] bg-cover bg-center mix-blend-overlay opacity-30"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a]/90 via-[#0f172a]/95 to-[#0f172a]"></div>
      </div>

      <header className="relative z-50 bg-transparent py-6">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-white/20 overflow-hidden shrink-0">
              <img src="/logopv.jpeg" alt="PV Abogadas" className="w-full h-full object-cover" />
            </div>
            <div className="font-roman text-lg font-bold tracking-tight text-white uppercase">
              PV Abogadas
            </div>
          </Link>
          <HomeNavbar />
        </div>
      </header>

      <main className="flex-1 relative z-10 flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-fade-in-up">
          <Link href="/portal" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors mb-8">
            <ArrowLeft size={14} /> Volver al Login
          </Link>

          <div className="w-16 h-16 bg-[var(--pv-gold)] rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(196,161,115,0.3)]">
            <ShieldCheck size={32} className="text-white" />
          </div>
          <h1 className="font-roman text-3xl sm:text-4xl font-bold uppercase tracking-widest text-white mb-2">
            Crear Cuenta
          </h1>
          <p className="text-sm text-white/50 mb-10">
            Regístrate para acceder a tu portal privado y poder realizar tus trámites o agendar consultas.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
               <label className="text-[10px] font-black uppercase tracking-widest text-[var(--pv-gold)] ml-2">Nombre completo</label>
               <input
                type="text"
                name="name"
                placeholder="Tu nombre y apellidos"
                className="w-full px-5 py-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder:text-gray-400 focus:border-[var(--pv-gold)] focus:ring-1 focus:ring-[var(--pv-gold)] outline-none transition-all"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-1.5">
               <label className="text-[10px] font-black uppercase tracking-widest text-[var(--pv-gold)] ml-2">Teléfono</label>
               <input
                type="tel"
                name="phone"
                placeholder="+34 600 000 000"
                className="w-full px-5 py-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder:text-gray-400 focus:border-[var(--pv-gold)] focus:ring-1 focus:ring-[var(--pv-gold)] outline-none transition-all"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-1.5">
               <label className="text-[10px] font-black uppercase tracking-widest text-[var(--pv-gold)] ml-2">Email</label>
               <input
                type="email"
                name="email"
                placeholder="ejemplo@correo.com"
                className="w-full px-5 py-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder:text-gray-400 focus:border-[var(--pv-gold)] focus:ring-1 focus:ring-[var(--pv-gold)] outline-none transition-all"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-1.5">
               <label className="text-[10px] font-black uppercase tracking-widest text-[var(--pv-gold)] ml-2">NIE / DNI / Pasaporte</label>
               <input
                type="text"
                name="nie"
                placeholder="Y1234567Z"
                className="w-full px-5 py-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder:text-gray-400 focus:border-[var(--pv-gold)] focus:ring-1 focus:ring-[var(--pv-gold)] outline-none transition-all uppercase"
                value={formData.nie}
                onChange={handleChange}
                required
              />
            </div>
            
            <button 
              type="submit" 
              className="w-full py-4 mt-6 rounded-2xl bg-[var(--pv-gold)] hover:bg-[#b8914b] text-white font-bold uppercase tracking-widest transition-colors shadow-lg" 
              disabled={loading}
            >
              {loading ? 'Creando cuenta...' : 'Registrarme'}
            </button>
          </form>

          {error && (
            <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold flex items-center gap-2 animate-shake">
              <AlertCircle size={16} /> {error}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
