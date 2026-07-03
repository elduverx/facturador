'use client';

import { forwardRef } from 'react';
import { DocumentType, InvoiceData } from '@/types';
import { formatCurrency, formatDate } from '@/lib/storage';

interface InvoicePreviewProps {
  data: InvoiceData;
  documentType: DocumentType;
  logo: string | null;
  brandName: string;
  onLogoClick: () => void;
  onBrandNameChange: (value: string) => void;
}

const normalizeDisplayText = (value?: string) => {
  if (!value) return '';
  return value
    .replace(/([a-záéíóúüñ])([A-ZÁÉÍÓÚÜÑ])/g, '$1 $2')
    .replace(/([A-Za-zÁÉÍÓÚÜÑáéíóúüñ])(\d)/g, '$1 $2')
    .replace(/(\d)([A-Za-zÁÉÍÓÚÜÑáéíóúüñ])/g, '$1 $2')
    .replace(/\bS\.?\s*L\.?\b/g, 'S.L.')
    .replace(/([A-Za-zÁÉÍÓÚÜÑáéíóúüñ])\s+(S\.L\.)/g, '$1, $2')
    .replace(/\s{2,}/g, ' ')
    .trim();
};

export const InvoicePreview = forwardRef<HTMLDivElement, InvoicePreviewProps>(
  ({ data, documentType, logo, brandName, onLogoClick, onBrandNameChange }, ref) => {
    const subtotal = data.items.reduce((acc, item) => acc + item.quantity * item.price, 0);
    const totalIVA = data.items.reduce((acc, item) => {
      const base = item.quantity * item.price;
      return acc + (base * item.iva) / 100;
    }, 0);
    const irpfAmount = data.applyIRPF ? subtotal * (data.irpfPercent / 100) : 0;
    const total = subtotal + totalIVA - irpfAmount;
    const paymentLabel = {
      tarjeta: 'Tarjeta',
      efectivo: 'Efectivo',
      transferencia: 'Transferencia bancaria',
    }[data.paymentMethod];
    const isProforma = documentType === 'proforma';
    const documentLabel = isProforma ? 'Factura proforma' : 'Factura';
    const legalText = isProforma
      ? 'Documento proforma sin validez fiscal como factura.'
      : 'Factura emitida conforme a la normativa espanola de facturacion (RD 1619/2012)';
    const uniqueIvaRates = Array.from(new Set(data.items.map((item) => item.iva)));
    const ivaLabel = uniqueIvaRates.length === 1 ? `IVA ${uniqueIvaRates[0]}%` : 'IVA';

    return (
      <div className="invoice-preview-frame">
        <div ref={ref} className="invoice-paper">
          <div className="invoice-header">
            <div onClick={onLogoClick} className="cursor-pointer" title="Clic para subir logo">
              {logo ? (
                <img src={logo} alt="Logo" className="invoice-logo" />
              ) : (
                <div className="logo-placeholder">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                  <span className="mt-1 text-[10px]">Subir logo</span>
                </div>
              )}
            </div>
            <div className="invoice-heading">
              <h2 className="invoice-title">
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => onBrandNameChange(e.target.value)}
                  className="w-full border-0 bg-transparent p-0 text-right text-3xl text-[var(--pv-gold)] focus:outline-none sm:text-4xl"
                  placeholder={documentLabel}
                  title="Editar nombre"
                />
              </h2>
              <div className="invoice-number">N. {data.number || '---'}</div>
            </div>
          </div>

          <div className="invoice-meta-grid">
            <div className="meta-item">
              <label>{documentLabel} nº</label>
              <span>{data.number || '---'}</span>
            </div>
            <div className="meta-item">
              <label>Fecha emision</label>
              <span>{formatDate(data.date)}</span>
            </div>
            <div className="meta-item">
              <label>Forma de pago</label>
              <span>{paymentLabel}</span>
            </div>
          </div>

          <div className="invoice-parties">
            <div className="party-block">
              <h4>Emisor</h4>
              <p className="name">{normalizeDisplayText(data.emisor.name) || '---'}</p>
              <p>NIF: {data.emisor.nif || '---'}</p>
              <p>{normalizeDisplayText(data.emisor.address) || '---'}</p>
              <p>{normalizeDisplayText([data.emisor.cp, data.emisor.city, data.emisor.province].filter(Boolean).join(', ')) || '---'}</p>
            </div>
            <div className="party-block">
              <h4>Cliente</h4>
              <p className="name">{normalizeDisplayText(data.client.name) || '---'}</p>
              <p>NIF: {data.client.nif || '---'}</p>
              <p>{normalizeDisplayText(data.client.address) || '---'}</p>
              <p>{normalizeDisplayText([data.client.cp, data.client.city, data.client.province].filter(Boolean).join(', ')) || '---'}</p>
            </div>
          </div>

          <table className="invoice-items-table">
            <thead>
              <tr>
                <th>Descripcion</th>
                <th>Cant.</th>
                <th>Precio</th>
                <th>IVA</th>
                <th>Importe</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => (
                <tr key={item.id}>
                  <td className="desc">{normalizeDisplayText(item.description) || '---'}</td>
                  <td>{item.quantity}</td>
                  <td>{formatCurrency(item.price)}</td>
                  <td>{item.iva}%</td>
                  <td>{formatCurrency(item.quantity * item.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="invoice-summary">
            <div className="totals-box">
              <div className="totals-row subtotal">
                <span>Base imponible</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="totals-row">
                <span>{ivaLabel}</span>
                <span>{formatCurrency(totalIVA)}</span>
              </div>
              {data.applyIRPF && (
                <div className="totals-row irpf">
                  <span>Retencion IRPF ({data.irpfPercent}%)</span>
                  <span>-{formatCurrency(irpfAmount)}</span>
                </div>
              )}
              <div className="totals-row total">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          <div className="invoice-footer">
            <div className="payment-info">
              <h4>Forma de pago</h4>
              <p>{paymentLabel}</p>
              {data.paymentMethod === 'transferencia' && <p>IBAN: {data.emisor.iban || '---'}</p>}
            </div>
            {data.notes && <div className="invoice-notes">{normalizeDisplayText(data.notes)}</div>}
          </div>

          <div className="legal-text">
            {legalText}
          </div>
        </div>
      </div>
    );
  }
);

InvoicePreview.displayName = 'InvoicePreview';
