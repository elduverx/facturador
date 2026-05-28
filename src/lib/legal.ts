const BUSINESS_DAY_SET = new Set([1, 2, 3, 4, 5]);

export function generateMatterReference(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `PV-${y}${m}${d}-${suffix}`;
}

export function addLegalDays(start: Date, days: number, kind: 'BUSINESS_DAYS' | 'CALENDAR_DAYS') {
  const result = new Date(start);
  result.setHours(12, 0, 0, 0);

  if (days <= 0) return result;

  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    if (kind === 'CALENDAR_DAYS' || BUSINESS_DAY_SET.has(result.getDay())) {
      added += 1;
    }
  }

  return result;
}

export function daysUntil(date: Date, now = new Date()) {
  const start = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const end = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.ceil((end - start) / 86_400_000);
}

export function calculateBillingTotal(input: {
  baseAmount: number;
  vatPercent: number;
  irpfPercent: number;
  expenseAmount: number;
}) {
  const base = Number.isFinite(input.baseAmount) ? input.baseAmount : 0;
  const vat = base * ((Number.isFinite(input.vatPercent) ? input.vatPercent : 0) / 100);
  const irpf = base * ((Number.isFinite(input.irpfPercent) ? input.irpfPercent : 0) / 100);
  const expenses = Number.isFinite(input.expenseAmount) ? input.expenseAmount : 0;
  return Math.round((base + vat - irpf + expenses) * 100) / 100;
}

export function renderTemplate(content: string, values: Record<string, string | number | null | undefined>) {
  return content.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_, key: string) => {
    const value = values[key];
    return value === null || value === undefined ? '' : String(value);
  });
}

export const DEFAULT_DOCUMENT_TEMPLATES = [
  {
    name: 'Requerimiento de documentacion',
    procedureType: 'General',
    description: 'Solicitud formal de documentos pendientes al cliente.',
    content:
      'Estimado/a {{clientName}},\n\nPara avanzar con el expediente {{reference}} - {{title}}, necesitamos que aporte la siguiente documentacion:\n\n- Pasaporte completo en vigor\n- NIE/TIE si dispone de el\n- Certificado de empadronamiento actualizado\n- Documentacion especifica del tramite {{procedureType}}\n\nQuedamos atentos.\n\nPV Abogadas',
  },
  {
    name: 'Hoja de encargo base',
    procedureType: 'General',
    description: 'Borrador de hoja de encargo firmable.',
    content:
      'HOJA DE ENCARGO PROFESIONAL\n\nCliente: {{clientName}}\nNIE/Pasaporte: {{clientNie}}\nExpediente: {{reference}}\nTramite: {{procedureType}}\n\nObjeto del encargo:\nPrestacion de servicios profesionales para {{title}}.\n\nHonorarios y provisiones:\nSegun presupuesto aceptado por el cliente y calendario de pagos asociado al expediente.\n\nFirma cliente: ____________________\nFirma despacho: ____________________',
  },
  {
    name: 'Escrito de seguimiento',
    procedureType: 'Extranjeria',
    description: 'Borrador para informar estado procesal del expediente.',
    content:
      'Asunto: Actualizacion de expediente {{reference}}\n\nEstimado/a {{clientName}},\n\nLe informamos de que su expediente de {{procedureType}} se encuentra en estado {{status}}.\n\nResumen actual:\n{{summary}}\n\nProxima actuacion prevista: {{nextActionAt}}\n\nAtentamente,\nPV Abogadas',
  },
];
