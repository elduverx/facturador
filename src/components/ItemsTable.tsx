'use client';

import { InvoiceItem } from '@/types';
import { formatCurrency } from '@/lib/storage';

interface ItemsTableProps {
  items: InvoiceItem[];
  onChange: (items: InvoiceItem[]) => void;
}

export function ItemsTable({ items, onChange }: ItemsTableProps) {
  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    const updated = items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    );
    onChange(updated);
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      price: 0,
      iva: 21,
    };
    onChange([...items, newItem]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      onChange(items.filter(item => item.id !== id));
    }
  };

  const calculateLineTotal = (item: InvoiceItem) => {
    const base = item.quantity * item.price;
    const iva = base * (item.iva / 100);
    return base + iva;
  };

  return (
    <div>
      <table className="items-table">
        <thead>
          <tr>
            <th>Descripción</th>
            <th className="w-20">Cant.</th>
            <th className="w-28">Precio</th>
            <th className="w-24">IVA %</th>
            <th className="w-28">Total</th>
            <th className="w-12"></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Descripción del servicio"
                  value={item.description}
                  onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                />
              </td>
              <td>
                <input
                  type="number"
                  className="form-input text-center"
                  value={item.quantity}
                  min="1"
                  onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                />
              </td>
              <td>
                <input
                  type="number"
                  className="form-input"
                  placeholder="0.00"
                  step="0.01"
                  value={item.price || ''}
                  onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                />
              </td>
              <td>
                <select
                  className="form-input"
                  value={item.iva}
                  onChange={(e) => updateItem(item.id, 'iva', parseInt(e.target.value))}
                >
                  <option value="21">21%</option>
                  <option value="10">10%</option>
                  <option value="4">4%</option>
                  <option value="0">0%</option>
                </select>
              </td>
              <td className="font-semibold text-stone-800">
                {formatCurrency(calculateLineTotal(item))}
              </td>
              <td>
                <button
                  className="btn-icon"
                  onClick={() => removeItem(item.id)}
                  title="Eliminar"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button className="btn-add-item" onClick={addItem}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        Añadir concepto
      </button>
    </div>
  );
}
