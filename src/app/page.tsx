'use client';

import { useState, useEffect, useRef, createRef } from 'react';
import { createRoot } from 'react-dom/client';
import { InvoiceData, InvoiceItem, Emisor, Client, Settings, InvoiceRecord } from '@/types';
import { storage, generateInvoiceNumber, formatCurrency, formatDate } from '@/lib/storage';
import { InvoicePreview } from '@/components/InvoicePreview';
import { SettingsModal } from '@/components/SettingsModal';
import { ItemsTable } from '@/components/ItemsTable';

const emptyEmisor: Emisor = {
  name: '', nif: '', address: '', cp: '', city: '', province: '', email: '', phone: '', iban: ''
};

const emptyClient: Client = {
  name: '', nif: '', address: '', cp: '', city: '', province: '', email: '', phone: ''
};

const defaultItem: InvoiceItem = {
  id: '1', description: '', quantity: 1, price: 0, iva: 21
};

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'emisor' | 'cliente' | 'historial'>('emisor');
  const [showSettings, setShowSettings] = useState(false);
  const [logo, setLogo] = useState<string | null>(null);
  const [savedClients, setSavedClients] = useState<Client[]>([]);
  const [historyClients, setHistoryClients] = useState<Client[]>([]);
  const [selectedHistoryClient, setSelectedHistoryClient] = useState<Client | null>(null);
  const [historyInvoices, setHistoryInvoices] = useState<InvoiceRecord[]>([]);
  const [settings, setSettings] = useState<Settings>({ series: '2025-', nextNumber: 1, brandName: 'Factura' });
  
  const [invoiceData, setInvoiceData] = useState<InvoiceData>({
    number: '',
    date: '',
    dueDate: '',
    emisor: emptyEmisor,
    client: emptyClient,
    items: [{ ...defaultItem }],
    applyIRPF: false,
    irpfPercent: 15,
    notes: '',
  });

  const invoiceRef = useRef<HTMLDivElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Load saved data on mount
  useEffect(() => {
    setMounted(true);
    const savedEmisor = storage.getEmisor();
    const savedSettings = storage.getSettings();
    const savedLogo = storage.getLogo();
    const recentClients = storage.getRecentClients();

    const today = new Date().toISOString().split('T')[0];
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    setSettings(savedSettings);
    setSavedClients(recentClients);
    setLogo(savedLogo);

    setInvoiceData(prev => ({
      ...prev,
      number: generateInvoiceNumber(savedSettings),
      date: today,
      dueDate: dueDate.toISOString().split('T')[0],
      emisor: savedEmisor || emptyEmisor,
    }));

    refreshHistory();
  }, []);

  useEffect(() => {
    if (!selectedHistoryClient) {
      setHistoryInvoices([]);
      return;
    }
    setHistoryInvoices(storage.getInvoicesByClient(selectedHistoryClient.nif));
  }, [selectedHistoryClient]);

  const updateEmisor = (field: keyof Emisor, value: string) => {
    setInvoiceData(prev => ({
      ...prev,
      emisor: { ...prev.emisor, [field]: value }
    }));
  };

  const updateClient = (field: keyof Client, value: string) => {
    setInvoiceData(prev => ({
      ...prev,
      client: { ...prev.client, [field]: value }
    }));
  };

  const saveEmisor = () => {
    storage.saveEmisor(invoiceData.emisor);
    alert('Datos guardados correctamente');
  };

  const saveClient = () => {
    if (!invoiceData.client.name || !invoiceData.client.nif) {
      alert('Por favor, introduce al menos nombre y NIF del cliente');
      return;
    }
    storage.saveClient(invoiceData.client);
    storage.saveRecentClient(invoiceData.client);
    setSavedClients(storage.getRecentClients());
    alert('Cliente guardado correctamente');
  };

  const loadClient = (client: Client) => {
    setInvoiceData(prev => ({ ...prev, client }));
    storage.saveRecentClient(client);
    setSavedClients(storage.getRecentClients());
  };

  const handleLogoClick = () => {
    logoInputRef.current?.click();
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        storage.saveLogo(base64);
        setLogo(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const calculateTotals = (data: InvoiceData) => {
    const subtotal = data.items.reduce((acc, item) => acc + (item.quantity * item.price), 0);
    const totalIVA = data.items.reduce((acc, item) => {
      const base = item.quantity * item.price;
      return acc + (base * item.iva / 100);
    }, 0);
    const irpfAmount = data.applyIRPF ? subtotal * (data.irpfPercent / 100) : 0;
    const total = subtotal + totalIVA - irpfAmount;
    return { subtotal, totalIVA, irpfAmount, total };
  };

  const isInvoiceReady = (data: InvoiceData) => {
    const hasEmisor = data.emisor.name && data.emisor.nif;
    const hasClient = data.client.name && data.client.nif;
    const hasItems = data.items.some(item => item.description && item.price > 0);
    return data.number && data.date && hasEmisor && hasClient && hasItems;
  };

  const buildHistoryClients = (invoices: InvoiceRecord[]) => {
    const map = new Map<string, { client: Client; last: string }>();
    invoices.forEach((invoice) => {
      const { client } = invoice.data;
      const current = map.get(client.nif);
      if (!current || invoice.createdAt > current.last) {
        map.set(client.nif, { client, last: invoice.createdAt });
      }
    });
    return Array.from(map.values())
      .sort((a, b) => b.last.localeCompare(a.last))
      .map((entry) => entry.client);
  };

  const refreshHistory = () => {
    const invoices = storage.getInvoices();
    const clients = buildHistoryClients(invoices);
    setHistoryClients(clients);

    if (selectedHistoryClient) {
      const exists = clients.some(client => client.nif === selectedHistoryClient.nif);
      if (exists) {
        setHistoryInvoices(storage.getInvoicesByClient(selectedHistoryClient.nif));
      } else {
        setSelectedHistoryClient(clients[0] || null);
      }
    } else if (clients.length > 0) {
      setSelectedHistoryClient(clients[0]);
    }
  };

  const recordInvoice = (allowDraft = false) => {
    const hasEmisor = invoiceData.emisor.name && invoiceData.emisor.nif;
    const hasClient = invoiceData.client.name && invoiceData.client.nif;
    const hasItems = invoiceData.items.some(item => item.description && item.price > 0);

    if (!invoiceData.number || !invoiceData.date) return;
    if (!hasEmisor || !hasClient) return;
    if (!allowDraft && !hasItems) return;

    const record: InvoiceRecord = {
      id: `${invoiceData.number}-${invoiceData.client.nif}`,
      createdAt: new Date().toISOString(),
      data: { ...invoiceData },
      brandName: settings.brandName,
    };

    storage.saveInvoice(record);
    storage.saveRecentClient(invoiceData.client);
    setSavedClients(storage.getRecentClients());
    refreshHistory();
  };

  const handleBrandNameChange = (value: string) => {
    const updated = { ...settings, brandName: value };
    setSettings(updated);
    storage.saveSettings(updated);
  };

  const captureElementToPDFBlob = async (element: HTMLElement): Promise<Blob | null> => {
    const html2canvas = (await import('html2canvas')).default;
    const { jsPDF } = await import('jspdf');

    // Suprimir errores de consola de html2canvas temporalmente
    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      // Ignorar errores de color lab() de html2canvas
      if (args[0]?.toString().includes('Attempting to parse an unsupported color function')) {
        return;
      }
      originalConsoleError(...args);
    };

    try {
      const canvas = await html2canvas(element, {
        scale: 1.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
        onclone: (doc) => {
          const style = doc.createElement('style');
          style.textContent = ':root{--color-teal-500:#00baa7;--color-teal-600:#009588;--color-teal-700:#00776e;--color-stone-100:#f5f5f4;--color-stone-200:#e7e5e4;--color-stone-400:#a6a09b;--color-stone-500:#79716b;--color-stone-800:#292524;--color-white:#fff;}';
          doc.head.appendChild(style);
        },
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.82);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;

      pdf.addImage(
        imgData,
        'JPEG',
        imgX,
        imgY,
        imgWidth * ratio * 0.95,
        imgHeight * ratio * 0.95,
        undefined,
        'FAST'
      );

      return pdf.output('blob');
    } catch (error: any) {
      originalConsoleError('Error generando PDF:', error);
      alert('Error al generar el PDF. Intentalo de nuevo.');
      return null;
    } finally {
      console.error = originalConsoleError;
    }
  };

  const generatePDFBlob = async (): Promise<Blob | null> => {
    if (!invoiceRef.current) return null;
    return captureElementToPDFBlob(invoiceRef.current);
  };

  const generatePDFBlobFromData = async (
    data: InvoiceData,
    brandNameValue: string
  ): Promise<Blob | null> => {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-10000px';
    container.style.top = '0';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '-1';

    const previewWidth = invoiceRef.current?.offsetWidth;
    if (previewWidth) {
      container.style.width = `${previewWidth}px`;
    }

    document.body.appendChild(container);

    const previewRef = createRef<HTMLDivElement>();
    const root = createRoot(container);
    const safeBrandName = brandNameValue || 'Factura';

    root.render(
      <InvoicePreview
        ref={previewRef}
        data={data}
        logo={logo}
        brandName={safeBrandName}
        onLogoClick={() => {}}
        onBrandNameChange={() => {}}
      />
    );

    try {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      const target = previewRef.current;
      if (!target) return null;

      const logoImage = target.querySelector('img') as HTMLImageElement | null;
      if (logoImage && !logoImage.complete) {
        await new Promise<void>((resolve) => {
          logoImage.onload = () => resolve();
          logoImage.onerror = () => resolve();
        });
      }

      return await captureElementToPDFBlob(target);
    } finally {
      root.unmount();
      container.remove();
    }
  };

  const generatePDF = async () => {
    const pdfBlob = await generatePDFBlob();
    if (!pdfBlob) return;

    const pdfUrl = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `${invoiceData.number || 'factura'}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => URL.revokeObjectURL(pdfUrl), 1500);

    recordInvoice(true);

    storage.incrementInvoiceNumber();
    const newSettings = storage.getSettings();
    setSettings(newSettings);
    setInvoiceData(prev => ({
      ...prev,
      number: generateInvoiceNumber(newSettings),
    }));
  };

  const downloadInvoiceRecord = async (record: InvoiceRecord) => {
    const brandNameValue = record.brandName || settings.brandName;
    const pdfBlob = await generatePDFBlobFromData(record.data, brandNameValue);
    if (!pdfBlob) return;

    const pdfUrl = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `${record.data.number || 'factura'}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => URL.revokeObjectURL(pdfUrl), 1500);
  };

  const sendByEmail = async () => {
    if (!invoiceData.client.email) {
      alert('Necesitas introducir el email del cliente en el formulario antes de enviar.');
      return;
    }

    const pdfBlob = await generatePDFBlob();
    if (!pdfBlob) return;

    const pdfUrl = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `${invoiceData.number || 'factura'}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(pdfUrl), 1500);

    recordInvoice(true);

    const { subtotal, totalIVA, irpfAmount, total } = calculateTotals(invoiceData);

    const subject = invoiceData.number ? `Factura ${invoiceData.number}` : 'Factura';
    const invoiceLabel = invoiceData.number ? `la factura ${invoiceData.number}` : 'la factura';
    const greeting = invoiceData.client.name ? `Hola ${invoiceData.client.name},` : 'Hola,';
    const body = [
      greeting,
      '',
      `Adjunto ${invoiceLabel}.`,
      'Por favor, adjunta el PDF descargado a este correo.',
      '',
      'Detalles:',
      `Base imponible: ${formatCurrency(subtotal)}`,
      `IVA: ${formatCurrency(totalIVA)}`,
      invoiceData.applyIRPF ? `Retencion IRPF (${invoiceData.irpfPercent}%): -${formatCurrency(irpfAmount)}` : null,
      `Total: ${formatCurrency(total)}`,
      '',
      `Fecha de vencimiento: ${formatDate(invoiceData.dueDate)}`,
      '',
      `${invoiceData.emisor.name}`,
      invoiceData.emisor.email ? invoiceData.emisor.email : null,
    ].filter(Boolean).join('\n');

    const recipient = invoiceData.client.email.trim();
    const mailtoUrl = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setTimeout(() => {
      window.location.href = mailtoUrl;
    }, 300);
  };

  const sendByWhatsApp = async () => {
    if (!invoiceData.client.name) {
      alert('Necesitas introducir al menos el nombre del cliente');
      return;
    }

    const pdfBlob = await generatePDFBlob();
    if (!pdfBlob) return;

    const pdfUrl = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `${invoiceData.number || 'factura'}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(pdfUrl), 1500);

    recordInvoice(true);

    const { subtotal, totalIVA, irpfAmount, total } = calculateTotals(invoiceData);

    const message = [
      `Hola ${invoiceData.client.name},`,
      '',
      `Te envio la factura *${invoiceData.number}*`,
      '',
      'Detalles:',
      `Base imponible: ${formatCurrency(subtotal)}`,
      `IVA: ${formatCurrency(totalIVA)}`,
      invoiceData.applyIRPF ? `Retencion IRPF (${invoiceData.irpfPercent}%): -${formatCurrency(irpfAmount)}` : null,
      '',
      `Total: ${formatCurrency(total)}`,
      '',
      `Fecha de vencimiento: ${formatDate(invoiceData.dueDate)}`,
      '',
      'Saludos,',
      `${invoiceData.emisor.name}`,
    ].filter(Boolean).join('\n');

    const whatsappUrl = invoiceData.client.phone
      ? `https://wa.me/${invoiceData.client.phone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    setTimeout(() => {
      window.open(whatsappUrl, '_blank');
    }, 500);
  };

  const isReady = () => isInvoiceReady(invoiceData);

  if (!mounted) return null;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 lg:mb-12 pb-4 sm:pb-6 border-b border-stone-200 sticky-header gap-4 sm:gap-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-teal-500 to-teal-700 rounded-lg flex items-center justify-center text-white font-bold text-lg sm:text-xl">
            F
          </div>
          <div>
            <h1 className="font-serif text-xl sm:text-2xl">Facturador</h1>
            <span className="text-[10px] sm:text-xs text-stone-400 uppercase tracking-wider">Autónomos España</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
          <button onClick={() => setShowSettings(true)} className="btn btn-secondary flex-1 sm:flex-initial min-w-[44px]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-[18px] sm:h-[18px]">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            <span className="hidden sm:inline">Configuración</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-4 sm:gap-6 lg:gap-8">
        {/* Form Area */}
        <div className="space-y-4 sm:space-y-6">
          {/* Invoice Data */}
          <div className="card animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 pb-4 border-b border-stone-200 gap-2 sm:gap-0">
              <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-teal-600 sm:w-5 sm:h-5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                Datos de la Factura
              </h3>
              <span className={`status-badge text-xs ${isReady() ? 'ready' : 'draft'}`}>
                {isReady() ? 'Lista' : 'Borrador'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className="form-label block text-xs sm:text-sm">Número de Factura *</label>
                <input
                  type="text"
                  className="form-input text-sm"
                  placeholder="2025-001"
                  value={invoiceData.number}
                  onChange={(e) => setInvoiceData(prev => ({ ...prev, number: e.target.value }))}
                />
              </div>
              <div>
                <label className="form-label block text-xs sm:text-sm">Fecha de Emisión *</label>
                <input
                  type="date"
                  className="form-input text-sm"
                  value={invoiceData.date}
                  onChange={(e) => setInvoiceData(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div className="sm:col-span-2 md:col-span-1">
                <label className="form-label block text-xs sm:text-sm">Fecha de Vencimiento</label>
                <input
                  type="date"
                  className="form-input text-sm"
                  value={invoiceData.dueDate}
                  onChange={(e) => setInvoiceData(prev => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Emisor & Client */}
          <div className="card animate-fade-in">
            <div className="flex gap-1 p-1 bg-stone-100 rounded-lg mb-4 sm:mb-6">
              <button
                className={`tab text-xs sm:text-sm ${activeTab === 'emisor' ? 'active' : ''}`}
                onClick={() => setActiveTab('emisor')}
              >
                <span className="hidden sm:inline">Emisor (Tu)</span>
                <span className="sm:hidden">Emisor</span>
              </button>
              <button
                className={`tab text-xs sm:text-sm ${activeTab === 'cliente' ? 'active' : ''}`}
                onClick={() => setActiveTab('cliente')}
              >
                Cliente
              </button>
              <button
                className={`tab text-xs sm:text-sm ${activeTab === 'historial' ? 'active' : ''}`}
                onClick={() => setActiveTab('historial')}
              >
                Historial
              </button>
            </div>

            {activeTab === 'emisor' && (
              <div className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="form-label block text-xs sm:text-sm">Nombre / Razón Social *</label>
                    <input
                      type="text"
                      className="form-input text-sm"
                      placeholder="Tu nombre o empresa"
                      value={invoiceData.emisor.name}
                      onChange={(e) => updateEmisor('name', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label block text-xs sm:text-sm">NIF/CIF *</label>
                    <input
                      type="text"
                      className="form-input text-sm"
                      placeholder="12345678A"
                      value={invoiceData.emisor.nif}
                      onChange={(e) => updateEmisor('nif', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label block text-xs sm:text-sm">Dirección Fiscal *</label>
                  <input
                    type="text"
                    className="form-input text-sm"
                    placeholder="Calle, número, piso"
                    value={invoiceData.emisor.address}
                    onChange={(e) => updateEmisor('address', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                  <div>
                    <label className="form-label block text-xs sm:text-sm">Código Postal</label>
                    <input
                      type="text"
                      className="form-input text-sm"
                      placeholder="28001"
                      value={invoiceData.emisor.cp}
                      onChange={(e) => updateEmisor('cp', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label block text-xs sm:text-sm">Ciudad</label>
                    <input
                      type="text"
                      className="form-input text-sm"
                      placeholder="Madrid"
                      value={invoiceData.emisor.city}
                      onChange={(e) => updateEmisor('city', e.target.value)}
                    />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="form-label block text-xs sm:text-sm">Provincia</label>
                    <input
                      type="text"
                      className="form-input text-sm"
                      placeholder="Madrid"
                      value={invoiceData.emisor.province}
                      onChange={(e) => updateEmisor('province', e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="form-label block text-xs sm:text-sm">Email</label>
                    <input
                      type="email"
                      className="form-input text-sm"
                      placeholder="tu@email.com"
                      value={invoiceData.emisor.email}
                      onChange={(e) => updateEmisor('email', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label block text-xs sm:text-sm">Teléfono</label>
                    <input
                      type="tel"
                      className="form-input text-sm"
                      placeholder="+34 600 000 000"
                      value={invoiceData.emisor.phone}
                      onChange={(e) => updateEmisor('phone', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label block text-xs sm:text-sm">IBAN (para datos de pago)</label>
                  <input
                    type="text"
                    className="form-input text-sm"
                    placeholder="ES00 0000 0000 0000 0000 0000"
                    value={invoiceData.emisor.iban}
                    onChange={(e) => updateEmisor('iban', e.target.value)}
                  />
                </div>
                <button onClick={saveEmisor} className="btn btn-secondary w-full sm:w-auto">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                    <polyline points="7 3 7 8 15 8"></polyline>
                  </svg>
                  Guardar mis datos
                </button>
              </div>
            )}

            {activeTab === 'cliente' && (
              <div className="space-y-3 sm:space-y-4">
                {savedClients.length > 0 && (
                  <div className="space-y-2 mb-4">
                    <div className="section-title">Clientes recientes</div>
                    {savedClients.map((client, index) => (
                      <div
                        key={index}
                        className="saved-item"
                        onClick={() => loadClient(client)}
                      >
                        <div>
                          <div className="font-medium">{client.name}</div>
                          <div className="text-xs text-stone-400">{client.nif} • {client.city || 'Sin ciudad'}</div>
                        </div>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="form-label block text-xs sm:text-sm">Nombre / Razón Social *</label>
                    <input
                      type="text"
                      className="form-input text-sm"
                      placeholder="Nombre del cliente"
                      value={invoiceData.client.name}
                      onChange={(e) => updateClient('name', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label block text-xs sm:text-sm">NIF/CIF *</label>
                    <input
                      type="text"
                      className="form-input text-sm"
                      placeholder="B12345678"
                      value={invoiceData.client.nif}
                      onChange={(e) => updateClient('nif', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label block text-xs sm:text-sm">Dirección Fiscal *</label>
                  <input
                    type="text"
                    className="form-input text-sm"
                    placeholder="Calle, número, piso"
                    value={invoiceData.client.address}
                    onChange={(e) => updateClient('address', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                  <div>
                    <label className="form-label block text-xs sm:text-sm">Código Postal</label>
                    <input
                      type="text"
                      className="form-input text-sm"
                      placeholder="28001"
                      value={invoiceData.client.cp}
                      onChange={(e) => updateClient('cp', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label block text-xs sm:text-sm">Ciudad</label>
                    <input
                      type="text"
                      className="form-input text-sm"
                      placeholder="Madrid"
                      value={invoiceData.client.city}
                      onChange={(e) => updateClient('city', e.target.value)}
                    />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="form-label block text-xs sm:text-sm">Provincia</label>
                    <input
                      type="text"
                      className="form-input text-sm"
                      placeholder="Madrid"
                      value={invoiceData.client.province}
                      onChange={(e) => updateClient('province', e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="form-label block text-xs sm:text-sm">Email</label>
                    <input
                      type="email"
                      className="form-input text-sm"
                      placeholder="cliente@email.com"
                      value={invoiceData.client.email || ''}
                      onChange={(e) => updateClient('email', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label block text-xs sm:text-sm">Teléfono/WhatsApp</label>
                    <input
                      type="tel"
                      className="form-input text-sm"
                      placeholder="34600123456"
                      value={invoiceData.client.phone || ''}
                      onChange={(e) => updateClient('phone', e.target.value)}
                    />
                  </div>
                </div>
                <button onClick={saveClient} className="btn btn-secondary w-full sm:w-auto">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="8.5" cy="7" r="4"></circle>
                    <line x1="20" y1="8" x2="20" y2="14"></line>
                    <line x1="23" y1="11" x2="17" y2="11"></line>
                  </svg>
                  Guardar cliente
                </button>
              </div>
            )}

            {activeTab === 'historial' && (
              <div className="space-y-3 sm:space-y-4">
                {historyClients.length === 0 ? (
                  <div className="text-sm text-stone-500">No hay facturas guardadas.</div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-4 sm:gap-6">
                    <div className="space-y-2">
                      <div className="section-title">Clientes</div>
                      {historyClients.map((client) => (
                        <button
                          key={client.nif}
                          type="button"
                          className={`saved-item w-full text-left ${selectedHistoryClient?.nif === client.nif ? 'ring-1 ring-teal-500' : ''}`}
                          onClick={() => setSelectedHistoryClient(client)}
                        >
                          <div>
                            <div className="font-medium">{client.name}</div>
                            <div className="text-xs text-stone-400">{client.nif} - {client.city || 'Sin ciudad'}</div>
                          </div>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="9 18 15 12 9 6"></polyline>
                          </svg>
                        </button>
                      ))}
                    </div>
                    <div className="space-y-4">
                      {selectedHistoryClient ? (
                        <>
                          <div>
                            <div className="section-title">Datos del cliente</div>
                            <div className="rounded-lg border border-stone-200 p-3 sm:p-4 text-sm space-y-1">
                              <div className="font-medium">{selectedHistoryClient.name || '---'}</div>
                              <div className="text-stone-500">NIF: {selectedHistoryClient.nif || '---'}</div>
                              <div className="text-stone-500">{selectedHistoryClient.address || '---'}</div>
                              <div className="text-stone-500">
                                {[selectedHistoryClient.cp, selectedHistoryClient.city, selectedHistoryClient.province].filter(Boolean).join(', ') || '---'}
                              </div>
                              {selectedHistoryClient.email && (
                                <div className="text-stone-500">Email: {selectedHistoryClient.email}</div>
                              )}
                              {selectedHistoryClient.phone && (
                                <div className="text-stone-500">Tel: {selectedHistoryClient.phone}</div>
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="section-title">Historial de facturacion</div>
                            {historyInvoices.length === 0 ? (
                              <div className="text-sm text-stone-500">Sin facturas para este cliente.</div>
                            ) : (
                              <div className="space-y-2">
                                {historyInvoices.map((invoice) => {
                                  const totals = calculateTotals(invoice.data);
                                  return (
                                    <div
                                      key={invoice.id}
                                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border border-stone-200 p-3"
                                    >
                                      <div>
                                        <div className="text-sm font-medium">{invoice.data.number || 'Sin numero'}</div>
                                        <div className="text-xs text-stone-500">
                                          Emitida {formatDate(invoice.data.date)} - Vence {formatDate(invoice.data.dueDate)}
                                        </div>
                                      </div>
                                      <div className="flex flex-col sm:items-end gap-2">
                                        <div className="text-sm font-semibold">{formatCurrency(totals.total)}</div>
                                        <button
                                          onClick={() => downloadInvoiceRecord(invoice)}
                                          className="btn btn-secondary w-full sm:w-auto"
                                        >
                                          Descargar PDF
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="text-sm text-stone-500">Selecciona un cliente para ver su historial.</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

            )}
          </div>

          {/* Items */}
          <div className="card animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 pb-4 border-b border-stone-200 gap-2 sm:gap-0">
              <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-teal-600 w-4 h-4 sm:w-5 sm:h-5">
                  <line x1="8" y1="6" x2="21" y2="6"></line>
                  <line x1="8" y1="12" x2="21" y2="12"></line>
                  <line x1="8" y1="18" x2="21" y2="18"></line>
                </svg>
                Conceptos
              </h3>
              <span className="info-badge text-[10px] sm:text-xs">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
                IVA según tipo
              </span>
            </div>

            <div className="overflow-x-auto">
              <ItemsTable
                items={invoiceData.items}
                onChange={(items) => setInvoiceData(prev => ({ ...prev, items }))}
              />
            </div>
          </div>

          {/* Options */}
          <div className="card animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 pb-4 border-b border-stone-200 gap-2 sm:gap-0">
              <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-teal-600 w-4 h-4 sm:w-5 sm:h-5">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
                Opciones
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="applyIRPF"
                  className="w-5 h-5 accent-teal-600"
                  checked={invoiceData.applyIRPF}
                  onChange={(e) => setInvoiceData(prev => ({ ...prev, applyIRPF: e.target.checked }))}
                />
                <label htmlFor="applyIRPF" className="text-xs sm:text-sm cursor-pointer">Aplicar retención IRPF</label>
              </div>
              <div>
                <label className="form-label block text-xs sm:text-sm">Porcentaje IRPF</label>
                <select
                  className="form-input text-sm"
                  value={invoiceData.irpfPercent}
                  onChange={(e) => setInvoiceData(prev => ({ ...prev, irpfPercent: parseInt(e.target.value) }))}
                >
                  <option value="15">15% (General)</option>
                  <option value="7">7% (Primeros 3 años)</option>
                  <option value="2">2% (Módulos)</option>
                  <option value="19">19% (Profesionales)</option>
                </select>
              </div>
            </div>

            <div>
              <div className="section-title">Notas adicionales</div>
              <textarea
                className="form-input text-sm min-h-[100px]"
                placeholder="Condiciones de pago, observaciones, etc."
                value={invoiceData.notes}
                onChange={(e) => setInvoiceData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="xl:sticky xl:top-8 xl:self-start">
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoUpload}
          />
          <InvoicePreview
            ref={invoiceRef}
            data={invoiceData}
            logo={logo}
            brandName={settings.brandName}
            onLogoClick={handleLogoClick}
            onBrandNameChange={handleBrandNameChange}
          />
        </div>
      </div>

      <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3">
        <button onClick={generatePDF} className="btn btn-primary w-full sm:w-auto">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Descargar PDF
        </button>
        <button onClick={sendByWhatsApp} className="btn btn-secondary w-full sm:w-auto" title="Compartir por WhatsApp">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          WhatsApp
        </button>
        <button onClick={sendByEmail} className="btn btn-secondary w-full sm:w-auto" title="Enviar por email">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
            <polyline points="22,6 12,13 2,6"></polyline>
          </svg>
          Email
        </button>
      </div>

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSave={(newSettings) => {
          setSettings(newSettings);
          setInvoiceData(prev => ({
            ...prev,
            number: generateInvoiceNumber(newSettings),
          }));
        }}
        onLogoChange={setLogo}
        onClearAll={() => {
          const resetSettings = storage.getSettings();
          const today = new Date().toISOString().split('T')[0];
          const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

          setSettings(resetSettings);
          setInvoiceData({
            number: generateInvoiceNumber(resetSettings),
            date: today,
            dueDate,
            emisor: emptyEmisor,
            client: emptyClient,
            items: [{ ...defaultItem }],
            applyIRPF: false,
            irpfPercent: 15,
            notes: '',
          });
          setLogo(null);
          setSavedClients([]);
          setHistoryClients([]);
          setHistoryInvoices([]);
          setSelectedHistoryClient(null);
        }}
      />
    </div>
  );
}
