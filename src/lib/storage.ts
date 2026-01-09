import { Emisor, Client, Settings, InvoiceRecord } from '@/types';

const KEYS = {
  EMISOR: 'facturadorEmisor',
  CLIENTS: 'facturadorClients',
  RECENT_CLIENTS: 'facturadorRecentClients',
  INVOICES: 'facturadorInvoices',
  SETTINGS: 'facturadorSettings',
  LOGO: 'facturadorLogo',
};

const DEFAULT_SETTINGS: Settings = {
  series: '2025-',
  nextNumber: 1,
  brandName: 'Factura',
};

export const storage = {
  // Emisor
  getEmisor: (): Emisor | null => {
    if (typeof window === 'undefined') return null;
    const data = localStorage.getItem(KEYS.EMISOR);
    return data ? JSON.parse(data) : null;
  },
  
  saveEmisor: (emisor: Emisor): void => {
    localStorage.setItem(KEYS.EMISOR, JSON.stringify(emisor));
  },

  // Clients
  getClients: (): Client[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(KEYS.CLIENTS);
    return data ? JSON.parse(data) : [];
  },
  
  saveClient: (client: Client): void => {
    const clients = storage.getClients();
    const existingIndex = clients.findIndex(c => c.nif === client.nif);
    
    if (existingIndex >= 0) {
      clients[existingIndex] = client;
    } else {
      clients.push(client);
    }
    
    localStorage.setItem(KEYS.CLIENTS, JSON.stringify(clients));
  },

  getRecentClients: (): Client[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(KEYS.RECENT_CLIENTS);
    return data ? JSON.parse(data) : [];
  },

  saveRecentClient: (client: Client, limit = 8): void => {
    const recent = storage.getRecentClients();
    const next = [client, ...recent.filter(c => c.nif !== client.nif)];
    localStorage.setItem(KEYS.RECENT_CLIENTS, JSON.stringify(next.slice(0, limit)));
  },
  
  deleteClient: (nif: string): void => {
    const clients = storage.getClients().filter(c => c.nif !== nif);
    localStorage.setItem(KEYS.CLIENTS, JSON.stringify(clients));
  },

  // Settings
  getSettings: (): Settings => {
    if (typeof window === 'undefined') return { ...DEFAULT_SETTINGS };
    const data = localStorage.getItem(KEYS.SETTINGS);
    if (!data) return { ...DEFAULT_SETTINGS };
    try {
      const parsed = JSON.parse(data);
      return { ...DEFAULT_SETTINGS, ...parsed };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  },
  
  saveSettings: (settings: Settings): void => {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  },
  
  incrementInvoiceNumber: (): void => {
    const settings = storage.getSettings();
    settings.nextNumber += 1;
    storage.saveSettings(settings);
  },

  getInvoices: (): InvoiceRecord[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(KEYS.INVOICES);
    return data ? JSON.parse(data) : [];
  },

  saveInvoice: (invoice: InvoiceRecord): void => {
    const invoices = storage.getInvoices();
    const existingIndex = invoices.findIndex(existing =>
      existing.data.number &&
      existing.data.number === invoice.data.number &&
      existing.data.client.nif === invoice.data.client.nif
    );

    if (existingIndex >= 0) {
      invoices[existingIndex] = { ...invoice, createdAt: invoices[existingIndex].createdAt };
    } else {
      invoices.unshift(invoice);
    }

    localStorage.setItem(KEYS.INVOICES, JSON.stringify(invoices));
  },

  getInvoicesByClient: (nif: string): InvoiceRecord[] => {
    return storage.getInvoices()
      .filter(invoice => invoice.data.client.nif === nif)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  // Logo
  getLogo: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(KEYS.LOGO);
  },
  
  saveLogo: (base64: string): void => {
    localStorage.setItem(KEYS.LOGO, base64);
  },
  
  deleteLogo: (): void => {
    localStorage.removeItem(KEYS.LOGO);
  },

  // Clear all
  clearAll: (): void => {
    Object.values(KEYS).forEach(key => localStorage.removeItem(key));
  },
};

export const formatCurrency = (num: number): string => {
  return num.toLocaleString('es-ES', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  }) + ' €';
};

export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '--/--/----';
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-ES');
};

export const generateInvoiceNumber = (settings: Settings): string => {
  return settings.series + String(settings.nextNumber).padStart(3, '0');
};
