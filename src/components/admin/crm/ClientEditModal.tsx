import { useState } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';

interface ClientEditModalProps {
  client: {
    name: string;
    email: string;
    phone: string;
    nie: string | null;
  };
  onClose: () => void;
  onSuccess: (updatedClient: any) => void;
}

export function ClientEditModal({ client, onClose, onSuccess }: ClientEditModalProps) {
  const [formData, setFormData] = useState({
    name: client.name || '',
    email: client.email || '',
    phone: client.phone || '',
    nie: client.nie || '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/clients/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldEmail: client.email,
          newName: formData.name,
          newEmail: formData.email,
          newPhone: formData.phone,
          newNie: formData.nie,
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Error al actualizar el cliente');
      }

      onSuccess(data.client);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--pv-ink)]/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
        <div className="flex items-center justify-between p-6 border-b border-[var(--pv-marble)]">
          <h2 className="font-roman text-xl font-bold uppercase tracking-widest text-[var(--pv-ink)]">
            Editar Cliente
          </h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--pv-marble)] text-[var(--pv-navy)]/60 hover:text-[var(--pv-ink)] hover:bg-[var(--glass-border)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--pv-navy)]/60 ml-2">
              Nombre y Apellidos
            </label>
            <input 
              type="text" 
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-3 rounded-xl bg-[var(--pv-marble)] border-none text-sm text-[var(--pv-ink)] focus:ring-2 focus:ring-[var(--pv-gold)]/50 transition-all outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--pv-navy)]/60 ml-2">
              Email
            </label>
            <input 
              type="email" 
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-4 py-3 rounded-xl bg-[var(--pv-marble)] border-none text-sm text-[var(--pv-ink)] focus:ring-2 focus:ring-[var(--pv-gold)]/50 transition-all outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--pv-navy)]/60 ml-2">
              Teléfono
            </label>
            <input 
              type="tel" 
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="w-full px-4 py-3 rounded-xl bg-[var(--pv-marble)] border-none text-sm text-[var(--pv-ink)] focus:ring-2 focus:ring-[var(--pv-gold)]/50 transition-all outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--pv-navy)]/60 ml-2">
              NIE / DNI / Pasaporte
            </label>
            <input 
              type="text" 
              value={formData.nie}
              onChange={(e) => setFormData({...formData, nie: e.target.value.toUpperCase()})}
              className="w-full px-4 py-3 rounded-xl bg-[var(--pv-marble)] border-none text-sm text-[var(--pv-ink)] focus:ring-2 focus:ring-[var(--pv-gold)]/50 transition-all outline-none uppercase"
            />
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full btn-roman py-4 flex items-center justify-center gap-2 mt-4"
          >
            <Save size={18} />
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </form>
      </div>
    </div>
  );
}
