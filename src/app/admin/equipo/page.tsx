'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck, UserPlus, Mail, User, Shield, Power, BadgeCheck } from 'lucide-react';

type StaffUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
};

const roleCopy: Record<string, { label: string; detail: string }> = {
  OWNER: { label: 'Socio / Abogado principal', detail: 'Acceso total, finanzas, expedientes y configuración global del imperio.' },
  LAWYER: { label: 'Abogado', detail: 'Gestión legal completa, plazos y expedientes sin administración global.' },
  PARALEGAL: { label: 'Paralegal', detail: 'Documentos, citas, plazos y seguimiento operativo del despacho.' },
  ADMIN: { label: 'Administrativo', detail: 'Agenda, documentos y comunicaciones operativas no sensibles.' },
};

export default function EquipoPage() {
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [draft, setDraft] = useState({ name: '', email: '', role: 'PARALEGAL' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const loadStaff = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/staff');
      const data = await res.json();
      setStaff(Array.isArray(data) ? data : []);
    } catch {
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadStaff();
  }, []);

  const submit = async () => {
    setMessage('');
    const res = await fetch('/api/admin/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data?.error || 'No se pudo guardar el usuario.');
      return;
    }
    setDraft({ name: '', email: '', role: 'PARALEGAL' });
    setMessage('Usuario guardado.');
    await loadStaff();
    setTimeout(() => setMessage(''), 3000);
  };

  const update = async (id: string, updates: Record<string, unknown>) => {
    await fetch(`/api/admin/staff/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    await loadStaff();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-roman uppercase text-[var(--pv-ink)] tracking-tight">Cuerpo Diplomático y Equipo</h1>
        <p className="text-sm text-[var(--pv-navy)] opacity-60">Gestión de roles y permisos para la expansión del despacho.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-8 items-start">
        {/* Registration Section */}
        <section className="neo-card !p-4 lg:!p-6 border-l-8 border-l-[var(--pv-gold)] shadow-xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-[var(--pv-gold)] text-white rounded-2xl shadow-lg shadow-[var(--pv-gold)]/20">
              <UserPlus size={22} />
            </div>
            <div>
               <h2 className="font-bold font-roman uppercase text-[var(--pv-ink)]">Alta de usuario</h2>
               <p className="text-[10px] font-bold text-[var(--pv-gold)] uppercase tracking-widest">Añadir Personal</p>
            </div>
          </div>
          
          <div className="space-y-5">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[var(--pv-gold)] uppercase tracking-widest ml-4">Nombre Real</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--pv-gold)]" size={16} />
                <input className="neo-input pl-12" placeholder="P. ej: Marcus Aurelius" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[var(--pv-gold)] uppercase tracking-widest ml-4">Email Corporativo</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--pv-gold)]" size={16} />
                <input className="neo-input pl-12" placeholder="marcus@pvabogadas.com" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[var(--pv-gold)] uppercase tracking-widest ml-4">Rango / Permisos</label>
              <div className="relative">
                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--pv-gold)]" size={16} />
                <select className="neo-input pl-12 bg-white" value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })}>
                  {Object.entries(roleCopy).map(([role, copy]) => <option key={role} value={role}>{copy.label}</option>)}
                </select>
              </div>
            </div>

            <button className="btn-roman w-full py-4 mt-4 shadow-xl shadow-[var(--pv-gold)]/20" onClick={submit}>
              Inscribir en el Equipo
            </button>
            
            {message && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold text-center animate-fade-in flex items-center justify-center gap-2">
                 <BadgeCheck size={16} /> {message}
              </div>
            )}
          </div>
        </section>

        {/* Staff List Grid */}
        <section className="space-y-6">
          {loading ? (
             <div className="neo-card !p-20 flex flex-col items-center justify-center gap-4">
                <div className="w-10 h-10 border-4 border-[var(--pv-gold)] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-bold text-[var(--pv-gold)] uppercase tracking-widest animate-pulse">Convocando Miembros...</p>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {staff.map((user) => (
                <div key={user.id} className={`neo-card !p-4 lg:!p-6 group transition-all duration-500 relative overflow-hidden ${user.active ? 'border-white/50' : 'opacity-60 grayscale'}`}>
                  {!user.active && <div className="absolute top-0 right-0 p-3 text-red-500"><Power size={18} /></div>}
                  
                  <div className="flex items-start justify-between gap-6 mb-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:rotate-6 transition-all duration-500 ${user.active ? 'bg-[var(--pv-gold)] text-white' : 'bg-stone-300 text-stone-500'}`}>
                         <User size={28} />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-[var(--pv-ink)]">{user.name}</h3>
                        <p className="text-xs text-[var(--pv-navy)] opacity-40 font-medium">{user.email}</p>
                      </div>
                    </div>
                    <div className={user.active ? 'text-[var(--pv-gold)]' : 'text-stone-400'}>
                      <ShieldCheck size={24} />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                       <label className="text-[9px] font-bold text-[var(--pv-gold)] uppercase tracking-widest ml-2">Asignación de Rango</label>
                       <select className="neo-input !py-2 !text-xs !bg-[var(--pv-marble)]" value={user.role} onChange={(e) => update(user.id, { role: e.target.value })}>
                        {Object.entries(roleCopy).map(([role, copy]) => <option key={role} value={role}>{copy.label}</option>)}
                      </select>
                    </div>
                    
                    <p className="text-[11px] font-medium text-[var(--pv-navy)] opacity-60 leading-relaxed bg-white/50 p-3 rounded-xl border border-white/50 italic">
                      "{roleCopy[user.role]?.detail}"
                    </p>

                    <div className="pt-4 flex justify-end">
                      <button 
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          user.active 
                            ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                        }`} 
                        onClick={() => update(user.id, { active: !user.active })}
                      >
                        <Power size={12} />
                        {user.active ? 'Suspender Acceso' : 'Restaurar Privilegios'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {staff.length === 0 && (
                <div className="md:col-span-2 neo-card !p-20 text-center border-2 border-dashed border-[var(--pv-gold)]/20">
                   <User size={40} className="mx-auto text-[var(--pv-gold)] opacity-20 mb-4" />
                   <p className="text-sm font-bold text-[var(--pv-navy)] opacity-40 uppercase tracking-widest">No hay miembros registrados en el equipo operativo.</p>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
      
      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
