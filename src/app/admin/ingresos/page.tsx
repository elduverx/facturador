'use client';

import { useState, useEffect } from 'react';
import { formatDateShort } from '@/lib/constants';
import Link from 'next/link';
import { Wallet, Search, Filter, CalendarCheck, FileText, FileSpreadsheet, ArrowRight } from 'lucide-react';

type IncomeType = 'APPOINTMENT' | 'DOCUMENT' | 'INVOICE';

interface IncomeItem {
  id: string;
  type: IncomeType;
  date: string;
  amount: number;
  concept: string;
  clientName: string;
  clientEmail: string;
  paymentMethod: string;
}

export default function IngresosPage() {
  const [incomes, setIncomes] = useState<IncomeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<IncomeType | 'ALL'>('ALL');

  useEffect(() => {
    const fetchIncomes = async () => {
      try {
        const res = await fetch('/api/admin/income');
        const data = await res.json();
        setIncomes(data);
      } catch (err) {
        console.error('Error cargando ingresos:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchIncomes();
  }, []);

  const getIcon = (type: IncomeType) => {
    switch (type) {
      case 'APPOINTMENT': return <CalendarCheck size={16} className="text-emerald-500" />;
      case 'DOCUMENT': return <FileText size={16} className="text-blue-500" />;
      case 'INVOICE': return <FileSpreadsheet size={16} className="text-[var(--pv-gold)]" />;
    }
  };

  const getTypeLabel = (type: IncomeType) => {
    switch (type) {
      case 'APPOINTMENT': return 'CITA';
      case 'DOCUMENT': return 'DOC';
      case 'INVOICE': return 'FACTURA';
    }
  };

  const filteredIncomes = incomes.filter(inc => {
    if (typeFilter !== 'ALL' && inc.type !== typeFilter) return false;
    if (search && !inc.clientName.toLowerCase().includes(search.toLowerCase()) && !inc.clientEmail.toLowerCase().includes(search.toLowerCase()) && !inc.concept.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  const totalAmount = filteredIncomes.reduce((sum, current) => sum + current.amount, 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl p-6 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--pv-gold)]/10 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
          <div className="flex items-center gap-3 text-[var(--pv-gold)] mb-2">
            <Wallet size={24} />
            <h3 className="font-roman text-sm font-bold uppercase tracking-widest">Total Ingresos</h3>
          </div>
          <p className="text-3xl font-black text-[var(--pv-ink)]">{totalAmount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</p>
          <p className="text-xs font-medium text-[var(--pv-navy)]/60 mt-1 uppercase tracking-widest">{filteredIncomes.length} transacciones listadas</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white border border-[var(--pv-marble)] p-2 sm:p-3 rounded-2xl shadow-sm">
        <div className="relative w-full sm:w-1/2">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--pv-navy)]/40" />
          <input
            type="text"
            placeholder="Buscar por cliente, email o concepto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[var(--pv-marble)]/30 border-none rounded-xl py-2.5 pl-9 pr-4 text-xs focus:ring-1 focus:ring-[var(--pv-gold)]"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button 
            onClick={() => setTypeFilter('ALL')}
            className={`shrink-0 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${typeFilter === 'ALL' ? 'bg-[var(--pv-navy)] text-white' : 'bg-[var(--pv-marble)]/50 text-[var(--pv-navy)] hover:bg-[var(--pv-marble)]'}`}
          >
            Todos
          </button>
          <button 
            onClick={() => setTypeFilter('APPOINTMENT')}
            className={`shrink-0 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${typeFilter === 'APPOINTMENT' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
          >
            Citas
          </button>
          <button 
            onClick={() => setTypeFilter('DOCUMENT')}
            className={`shrink-0 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${typeFilter === 'DOCUMENT' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
          >
            Documentos
          </button>
          <button 
            onClick={() => setTypeFilter('INVOICE')}
            className={`shrink-0 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${typeFilter === 'INVOICE' ? 'bg-[var(--pv-gold)] text-white' : 'bg-[var(--pv-gold)]/10 text-[var(--pv-gold)] hover:bg-[var(--pv-gold)]/20'}`}
          >
            Facturas
          </button>
        </div>
      </div>

      {/* List */}
      <div className="bg-white border border-[var(--pv-marble)] rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[var(--pv-navy)]/50 text-xs font-bold uppercase tracking-widest animate-pulse">
            Cargando ingresos...
          </div>
        ) : filteredIncomes.length === 0 ? (
          <div className="p-12 text-center">
            <Wallet size={32} className="mx-auto text-[var(--pv-navy)]/20 mb-3" />
            <p className="text-[var(--pv-navy)]/60 text-xs font-bold uppercase tracking-widest">No se encontraron ingresos</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--pv-marble)]">
            {filteredIncomes.map((item) => (
              <Link 
                href={`/admin/clientes?email=${encodeURIComponent(item.clientEmail)}`} 
                key={`${item.type}-${item.id}`}
                className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-5 hover:bg-[var(--pv-marble)]/20 transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-full bg-white border border-[var(--pv-marble)] shadow-sm flex items-center justify-center shrink-0">
                    {getIcon(item.type)}
                  </div>
                  <div className="min-w-0 pr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-[var(--pv-marble)] text-[var(--pv-navy)]">
                        {getTypeLabel(item.type)}
                      </span>
                      <span className="text-[10px] font-medium text-[var(--pv-navy)]/60 uppercase tracking-widest">
                        {formatDateShort(item.date.split('T')[0])}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-[var(--pv-ink)] truncate">{item.clientName}</p>
                    <p className="text-xs text-[var(--pv-navy)]/80 truncate mt-0.5">{item.concept}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-3 sm:mt-0 w-full sm:w-auto justify-end sm:pl-4 sm:border-l border-[var(--pv-marble)]">
                  <div className="text-right">
                    <p className="text-base font-black text-[var(--pv-ink)]">{item.amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</p>
                    <p className="text-[9px] font-bold text-[var(--pv-navy)]/50 uppercase tracking-widest mt-0.5">{item.paymentMethod}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[var(--pv-gold)]/10 text-[var(--pv-gold)] flex items-center justify-center shrink-0 group-hover:bg-[var(--pv-gold)] group-hover:text-white transition-colors">
                    <ArrowRight size={14} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
