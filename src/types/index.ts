export interface Emisor {
  name: string;
  nif: string;
  address: string;
  cp: string;
  city: string;
  province: string;
  email: string;
  phone: string;
  iban: string;
}

export interface Client {
  name: string;
  nif: string;
  address: string;
  cp: string;
  city: string;
  province: string;
  email?: string;
  phone?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
  iva: number;
}

export type PaymentMethod = 'tarjeta' | 'efectivo' | 'transferencia';

export interface InvoiceData {
  number: string;
  date: string;
  paymentMethod: PaymentMethod;
  emisor: Emisor;
  client: Client;
  items: InvoiceItem[];
  applyIRPF: boolean;
  irpfPercent: number;
  notes: string;
}

export interface Settings {
  series: string;
  nextNumber: number;
  brandName: string;
}

export interface InvoiceRecord {
  id: string;
  createdAt: string;
  data: InvoiceData;
  brandName?: string;
}
