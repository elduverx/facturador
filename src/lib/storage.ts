import { DocumentType, Emisor, Client, Settings, InvoiceRecord } from '@/types';

const KEYS = {
  EMISOR: 'facturadorEmisor',
  CLIENTS: 'facturadorClients',
  RECENT_CLIENTS: 'facturadorRecentClients',
  INVOICES: 'facturadorInvoices',
  SETTINGS: 'facturadorSettings',
  LOGO: 'facturadorLogo',
};

const DEFAULT_SETTINGS: Settings = {
  series: 'F-2026-',
  nextNumber: 1,
  brandName: 'Factura',
  proformaSeries: 'P-2026-',
  proformaNextNumber: 1,
  proformaBrandName: 'Factura proforma',
};

type SessionPayload = {
  emisor?: Emisor | null;
  clients?: Client[];
  recentClients?: Client[];
  invoices?: InvoiceRecord[];
  settings?: Settings;
  logo?: string | null;
};

const SESSION_ENDPOINT = '/api/session';

const setJSON = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage errors (quota, blocked storage).
  }
};

const getJSON = <T>(key: string, fallback: T): T => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
};

const setRaw = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore storage errors (quota, blocked storage).
  }
};

const removeKey = (key: string) => {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore storage errors (quota, blocked storage).
  }
};

const persistSession = (payload: Partial<SessionPayload>) => {
  if (typeof window === 'undefined') return;

  fetch(SESSION_ENDPOINT, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {
    // Ignore network errors to keep UI responsive.
  });
};

const deleteSession = () => {
  if (typeof window === 'undefined') return;

  fetch(SESSION_ENDPOINT, { method: 'DELETE' }).catch(() => {
    // Ignore network errors to keep UI responsive.
  });
};

export const storage = {
  syncSession: async (): Promise<SessionPayload | null> => {
    if (typeof window === 'undefined') return null;

    try {
      const response = await fetch(SESSION_ENDPOINT, { cache: 'no-store' });
      if (!response.ok) return null;
      const data = (await response.json()) as SessionPayload;

      if ('emisor' in data) {
        if (data.emisor) {
          setJSON(KEYS.EMISOR, data.emisor);
        } else {
          removeKey(KEYS.EMISOR);
        }
      }
      if ('clients' in data) {
        if (data.clients) {
          setJSON(KEYS.CLIENTS, data.clients);
        } else {
          removeKey(KEYS.CLIENTS);
        }
      }
      if ('recentClients' in data) {
        if (data.recentClients) {
          setJSON(KEYS.RECENT_CLIENTS, data.recentClients);
        } else {
          removeKey(KEYS.RECENT_CLIENTS);
        }
      }
      if ('invoices' in data) {
        if (data.invoices) {
          setJSON(KEYS.INVOICES, data.invoices);
        } else {
          removeKey(KEYS.INVOICES);
        }
      }
      if ('settings' in data) {
        if (data.settings) {
          setJSON(KEYS.SETTINGS, data.settings);
        } else {
          removeKey(KEYS.SETTINGS);
        }
      }
      if ('logo' in data) {
        if (data.logo) {
          setRaw(KEYS.LOGO, data.logo);
        } else {
          removeKey(KEYS.LOGO);
        }
      }

      return data;
    } catch {
      return null;
    }
  },

  // Emisor
  getEmisor: (): Emisor | null => {
    if (typeof window === 'undefined') return null;
    return getJSON<Emisor | null>(KEYS.EMISOR, null);
  },
  
  saveEmisor: (emisor: Emisor): void => {
    setJSON(KEYS.EMISOR, emisor);
    persistSession({ emisor });
  },

  // Clients
  getClients: (): Client[] => {
    if (typeof window === 'undefined') return [];
    return getJSON<Client[]>(KEYS.CLIENTS, []);
  },
  
  saveClient: (client: Client): void => {
    const clients = storage.getClients();
    const existingIndex = clients.findIndex(c => c.nif === client.nif);
    
    if (existingIndex >= 0) {
      clients[existingIndex] = client;
    } else {
      clients.push(client);
    }
    
    setJSON(KEYS.CLIENTS, clients);
    persistSession({ clients });
  },

  getRecentClients: (): Client[] => {
    if (typeof window === 'undefined') return [];
    return getJSON<Client[]>(KEYS.RECENT_CLIENTS, []);
  },

  saveRecentClient: (client: Client, limit = 8): void => {
    const recent = storage.getRecentClients();
    const next = [client, ...recent.filter(c => c.nif !== client.nif)];
    const trimmed = next.slice(0, limit);
    setJSON(KEYS.RECENT_CLIENTS, trimmed);
    persistSession({ recentClients: trimmed });
  },
  
  deleteClient: (nif: string): void => {
    const clients = storage.getClients().filter(c => c.nif !== nif);
    setJSON(KEYS.CLIENTS, clients);
    persistSession({ clients });
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
    setJSON(KEYS.SETTINGS, settings);
    persistSession({ settings });
  },
  
  incrementInvoiceNumber: (): void => {
    const settings = storage.getSettings();
    settings.nextNumber += 1;
    storage.saveSettings(settings);
  },

  incrementDocumentNumber: (type: DocumentType): void => {
    const settings = storage.getSettings();
    if (type === 'proforma') {
      settings.proformaNextNumber = (settings.proformaNextNumber || 1) + 1;
    } else {
      settings.nextNumber += 1;
    }
    storage.saveSettings(settings);
  },

  getInvoices: (type?: DocumentType): InvoiceRecord[] => {
    if (typeof window === 'undefined') return [];
    const invoices = getJSON<InvoiceRecord[]>(KEYS.INVOICES, []);
    if (!type) return invoices;
    return invoices.filter(invoice => (invoice.type || 'invoice') === type);
  },

  saveInvoice: (invoice: InvoiceRecord): void => {
    const invoiceType = invoice.type || 'invoice';
    const invoices = storage.getInvoices();
    const existingIndex = invoices.findIndex(existing =>
      (existing.type || 'invoice') === invoiceType &&
      existing.data.number &&
      existing.data.number === invoice.data.number &&
      existing.data.client.nif === invoice.data.client.nif
    );

    if (existingIndex >= 0) {
      invoices[existingIndex] = { ...invoice, createdAt: invoices[existingIndex].createdAt };
    } else {
      invoices.unshift(invoice);
    }

    setJSON(KEYS.INVOICES, invoices);
    persistSession({ invoices });
  },

  getInvoicesByClient: (nif: string, type?: DocumentType): InvoiceRecord[] => {
    return storage.getInvoices()
      .filter(invoice => invoice.data.client.nif === nif && (!type || (invoice.type || 'invoice') === type))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  // Logo
  getLogo: (): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(KEYS.LOGO);
    } catch {
      return null;
    }
  },
  
  saveLogo: (base64: string): void => {
    setRaw(KEYS.LOGO, base64);
    persistSession({ logo: base64 });
  },
  
  deleteLogo: (): void => {
    removeKey(KEYS.LOGO);
    persistSession({ logo: null });
  },

  // Clear all
  clearAll: (): void => {
    Object.values(KEYS).forEach(key => removeKey(key));
    deleteSession();
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
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const generateInvoiceNumber = (settings: Settings): string => {
  return settings.series + String(settings.nextNumber).padStart(3, '0');
};

export const generateDocumentNumber = (settings: Settings, type: DocumentType): string => {
  if (type === 'proforma') {
    return (settings.proformaSeries || 'P-2026-') + String(settings.proformaNextNumber || 1).padStart(3, '0');
  }
  return generateInvoiceNumber(settings);
};
