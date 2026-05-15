'use client';

import { forwardRef } from 'react';
import { InvoiceData } from '@/types';
import { formatCurrency, formatDate } from '@/lib/storage';

interface InvoicePreviewProps {
  data: InvoiceData;
  logo: string | null;
  brandName: string;
  onLogoClick: () => void;
  onBrandNameChange: (value: string) => void;
}

export const InvoicePreview = forwardRef<HTMLDivElement, InvoicePreviewProps>(
  ({ data, logo, brandName, onLogoClick, onBrandNameChange }, ref) => {
    // Calculate totals
    const subtotal = data.items.reduce((acc, item) => acc + (item.quantity * item.price), 0);
    const totalIVA = data.items.reduce((acc, item) => {
      const base = item.quantity * item.price;
      return acc + (base * item.iva / 100);
    }, 0);
    const irpfAmount = data.applyIRPF ? subtotal * (data.irpfPercent / 100) : 0;
    const total = subtotal + totalIVA - irpfAmount;

    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div ref={ref} className="invoice-paper">
          {/* Header */}
          <div className="invoice-header">
            <div onClick={onLogoClick} className="cursor-pointer" title="Clic para subir logo">
              {logo ? (
                <img src={logo} alt="Logo" className="max-w-[120px] max-h-[60px] object-contain" />
              ) : (
                <div className="logo-placeholder">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                  <span className="text-[10px] mt-1">Subir logo</span>
                </div>
              )}
            </div>
            <div className="text-right">
              <h2 className="invoice-title">
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => onBrandNameChange(e.target.value)}
                  className="font-serif text-2xl sm:text-4xl text-teal-600 bg-transparent border-0 p-0 text-right w-full focus:outline-none"
                  placeholder="Factura"
                  title="Editar nombre"
                />
              </h2>
              <div className="text-stone-500">Nº {data.number || '---'}</div>
            </div>
          </div>

          {/* Parties */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div className="party-block">
              <h4>Emisor</h4>
              <p className="name">{data.emisor.name || '---'}</p>
              <p>NIF: {data.emisor.nif || '---'}</p>
              <p>{data.emisor.address || '---'}</p>
              <p>{[data.emisor.cp, data.emisor.city, data.emisor.province].filter(Boolean).join(', ') || '---'}</p>
            </div>
            <div className="party-block">
              <h4>Cliente</h4>
              <p className="name">{data.client.name || '---'}</p>
              <p>NIF: {data.client.nif || '---'}</p>
              <p>{data.client.address || '---'}</p>
              <p>{[data.client.cp, data.client.city, data.client.province].filter(Boolean).join(', ') || '---'}</p>
            </div>
          </div>

          {/* Meta */}
          <div className="invoice-meta">
            <div className="meta-item">
              <label>Fecha emisión</label>
              <span>{formatDate(data.date)}</span>
            </div>
          </div>

          {/* Items */}
          <table className="invoice-items-table">
            <thead>
              <tr>
                <th>Descripción</th>
                <th>Cant.</th>
                <th>Precio</th>
                <th>IVA</th>
                <th>Importe</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => (
                <tr key={item.id}>
                  <td className="desc">{item.description || '---'}</td>
                  <td>{item.quantity}</td>
                  <td>{formatCurrency(item.price)}</td>
                  <td>{item.iva}%</td>
                  <td>{formatCurrency(item.quantity * item.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-56">
              <div className="totals-row subtotal">
                <span>Base imponible</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="totals-row">
                <span>IVA</span>
                <span>{formatCurrency(totalIVA)}</span>
              </div>
              {data.applyIRPF && (
                <div className="totals-row irpf">
                  <span>Retención IRPF ({data.irpfPercent}%)</span>
                  <span>-{formatCurrency(irpfAmount)}</span>
                </div>
              )}
              <div className="totals-row total">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-stone-200">
            <div className="payment-info">
              <h4>Forma de pago</h4>
              <p>{{ tarjeta: 'Tarjeta', efectivo: 'Efectivo', transferencia: 'Transferencia bancaria' }[data.paymentMethod]}</p>
              {data.paymentMethod === 'transferencia' && (
                <p>IBAN: {data.emisor.iban || '---'}</p>
              )}
            </div>
            {data.notes && (
              <div className="invoice-notes">{data.notes}</div>
            )}
          </div>

          <div className="legal-text">
            Factura emitida conforme a la normativa española de facturación (RD 1619/2012)
          </div>
        </div>
      </div>
    );
  }
);

InvoicePreview.displayName = 'InvoicePreview';
