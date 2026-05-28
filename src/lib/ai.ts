import Anthropic from '@anthropic-ai/sdk';

const CLAUDE_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export type DocumentAnalysis = {
  tipo: string;
  interesado: {
    nombre: string;
    identificador: string;
  };
  fechas: Array<{ etiqueta: string; valor: string }>;
  estado: string;
  resumen: string;
  proxima_accion: string;
};

export type AdminAutomationContext = {
  generatedAt: string;
  appointments: Array<{
    id: string;
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    clientNie: string | null;
    date: string;
    startTime: string;
    endTime: string;
    status: string;
    paymentStatus?: string;
    serviceName: string;
    servicePrice: number | null;
    notes: string | null;
    adminNotes: string | null;
    createdAt: string;
  }>;
  recentNotes: Array<{
    id: string;
    clientEmail: string;
    content: string;
    status: string;
    tags: string[];
    isPublic: boolean;
    createdAt: string;
  }>;
};

export type AdminAutomationPlan = {
  resumen: string;
  prioridad: 'BAJA' | 'MEDIA' | 'ALTA';
  alertas: Array<{
    titulo: string;
    detalle: string;
    clientEmail?: string;
    appointmentId?: string;
  }>;
  proximas_acciones: Array<{
    accion: string;
    motivo: string;
    clientEmail?: string;
    appointmentId?: string;
  }>;
  notas_automaticas: Array<{
    clientEmail: string;
    content: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'WAITING' | 'DONE';
    tags: string[];
    confidence: number;
  }>;
};

const NOTE_STATUSES = ['PENDING', 'IN_PROGRESS', 'WAITING', 'DONE'] as const;

function assertApiKey() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('Falta ANTHROPIC_API_KEY en el entorno.');
  }
}

function extractTextBlock(response: { content?: Array<{ type: string; text?: string }> }) {
  const textBlock = response.content?.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Claude no devolvio texto.');
  }
  return textBlock.text || '';
}

function parseJsonResponse<T>(text: string): T {
  const cleanJson = text
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .trim();

  try {
    return JSON.parse(cleanJson) as T;
  } catch {
    const match = cleanJson.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error('Claude no devolvio JSON valido.');
    }
    return JSON.parse(match[0]) as T;
  }
}

function normalizeDocumentAnalysis(value: Partial<DocumentAnalysis>): DocumentAnalysis {
  return {
    tipo: String(value.tipo || 'Documento legal'),
    interesado: {
      nombre: String(value.interesado?.nombre || 'No detectado'),
      identificador: String(value.interesado?.identificador || 'No detectado'),
    },
    fechas: Array.isArray(value.fechas)
      ? value.fechas.map((fecha) => ({
          etiqueta: String(fecha?.etiqueta || 'Fecha'),
          valor: String(fecha?.valor || 'No detectada'),
        }))
      : [],
    estado: String(value.estado || 'PENDIENTE DE REVISION'),
    resumen: String(value.resumen || 'Documento analizado. Revisar el contenido antes de actuar.'),
    proxima_accion: String(value.proxima_accion || 'Revisar manualmente el documento.'),
  };
}

function normalizeAutomationPlan(value: Partial<AdminAutomationPlan>): AdminAutomationPlan {
  const prioridad = value.prioridad === 'ALTA' || value.prioridad === 'MEDIA' ? value.prioridad : 'BAJA';

  return {
    resumen: String(value.resumen || 'No se han detectado acciones automaticas claras.'),
    prioridad,
    alertas: Array.isArray(value.alertas)
      ? value.alertas.slice(0, 8).map((alerta) => ({
          titulo: String(alerta?.titulo || 'Alerta'),
          detalle: String(alerta?.detalle || ''),
          clientEmail: alerta?.clientEmail ? String(alerta.clientEmail) : undefined,
          appointmentId: alerta?.appointmentId ? String(alerta.appointmentId) : undefined,
        }))
      : [],
    proximas_acciones: Array.isArray(value.proximas_acciones)
      ? value.proximas_acciones.slice(0, 8).map((accion) => ({
          accion: String(accion?.accion || 'Revisar expediente'),
          motivo: String(accion?.motivo || ''),
          clientEmail: accion?.clientEmail ? String(accion.clientEmail) : undefined,
          appointmentId: accion?.appointmentId ? String(accion.appointmentId) : undefined,
        }))
      : [],
    notas_automaticas: Array.isArray(value.notas_automaticas)
      ? value.notas_automaticas.slice(0, 10).map((nota) => ({
          clientEmail: String(nota?.clientEmail || ''),
          content: String(nota?.content || '').trim(),
          status: NOTE_STATUSES.includes(nota?.status as (typeof NOTE_STATUSES)[number])
            ? (nota?.status as (typeof NOTE_STATUSES)[number])
            : 'PENDING',
          tags: Array.isArray(nota?.tags)
            ? nota.tags.map((tag) => String(tag).trim()).filter(Boolean).slice(0, 5)
            : [],
          confidence: Math.max(0, Math.min(1, Number(nota?.confidence || 0))),
        }))
      : [],
  };
}

export async function analyzeDocument(fileBuffer: Buffer, mimeType: string): Promise<DocumentAnalysis> {
  assertApiKey();

  const isImage = mimeType.startsWith('image/');
  const isPdf = mimeType === 'application/pdf';
  const content: any[] = [];

  if (isImage) {
    content.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: mimeType,
        data: fileBuffer.toString('base64'),
      },
    });
  } else if (isPdf) {
    content.push({
      type: 'document',
      source: {
        type: 'base64',
        media_type: 'application/pdf',
        data: fileBuffer.toString('base64'),
      },
    });
  } else {
    throw new Error('Formato de archivo no soportado. Use PDF o imagenes.');
  }

  content.push({
    type: 'text',
    text: `Eres un asistente experto en extranjeria en Espana. Analiza el documento adjunto para un abogado.

Extrae:
1. Tipo exacto de documento.
2. Datos del interesado: nombre completo e identificador.
3. Fechas criticas: fecha del documento, notificacion, limite y validez.
4. Estado o resultado.
5. Resumen legal y siguiente paso obligatorio.

Responde solo JSON valido con esta estructura:
{
  "tipo": "string",
  "interesado": { "nombre": "string", "identificador": "string" },
  "fechas": [{ "etiqueta": "string", "valor": "string" }],
  "estado": "string",
  "resumen": "string",
  "proxima_accion": "string"
}`,
  });

  const response = await anthropic.beta.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    betas: ['pdfs-2024-09-25'],
    messages: [{ role: 'user', content }],
  });

  return normalizeDocumentAnalysis(parseJsonResponse<DocumentAnalysis>(extractTextBlock(response)));
}

export async function generateAdminAutomationPlan(
  context: AdminAutomationContext
): Promise<AdminAutomationPlan> {
  assertApiKey();

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 3000,
    temperature: 0,
    messages: [
      {
        role: 'user',
        content: `Eres el asistente operativo de un despacho de extranjeria. Tu trabajo es revisar agenda, pagos y notas recientes para reducir trabajo administrativo.

Reglas:
- No inventes datos que no esten en el contexto.
- Prioriza citas vencidas, clientes pendientes, pagos pendientes y expedientes sin seguimiento.
- Solo propone notas automaticas internas cuando haya una razon clara.
- Las notas automaticas deben ser concretas, breves y utiles para el equipo.
- Usa confidence entre 0 y 1. Pon 0.75 o mas solo si la nota puede crearse sin revision humana.
- No recomiendes cambiar estados ni enviar correos si no hay evidencia suficiente.

Responde solo JSON valido con esta estructura:
{
  "resumen": "string",
  "prioridad": "BAJA|MEDIA|ALTA",
  "alertas": [{ "titulo": "string", "detalle": "string", "clientEmail": "string", "appointmentId": "string" }],
  "proximas_acciones": [{ "accion": "string", "motivo": "string", "clientEmail": "string", "appointmentId": "string" }],
  "notas_automaticas": [{
    "clientEmail": "string",
    "content": "string",
    "status": "PENDING|IN_PROGRESS|WAITING|DONE",
    "tags": ["string"],
    "confidence": 0.0
  }]
}

Contexto:
${JSON.stringify(context)}`,
      },
    ],
  });

  return normalizeAutomationPlan(parseJsonResponse<AdminAutomationPlan>(extractTextBlock(response)));
}

export async function generateChatResponse(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  context: any
): Promise<string> {
  assertApiKey();

  const systemPrompt = `Eres PV Assistant, el asistente inteligente oficial de PV Abogadas.
Tu objetivo es ayudar al administrador a gestionar el despacho de extranjeria de forma eficiente.

### Tareas Principales:
1. **Gestionar**: Ayuda a organizar la agenda. Si ves citas conflictivas o huecos importantes, menciónalo. Propón pasos a seguir para clientes basados en sus notas.
2. **Hacer Pedidos/Acciones**: Aunque no puedes ejecutar cambios directos en la DB todavía, puedes redactar borradores de notas, correos electrónicos para clientes o planes de acción detallados.
3. **Valorar**: Evalúa la carga de trabajo semanal, el estado de los expedientes (si están estancados o avanzando) y la rentabilidad de los servicios.
4. **Verificar**: Comprueba si los clientes tienen toda la información necesaria (NIE, teléfono, email) y si las citas tienen notas administrativas.

### Contexto del Sistema:
${JSON.stringify(context)}

### Reglas de Respuesta:
- **Precisión**: Usa los datos del contexto. Si hablas de un cliente, usa su nombre real.
- **Proactividad**: Si detectas un problema (ej: un pago pendiente o una cita sin NIE), avisa al administrador.
- **Formato**: Usa Markdown para que las respuestas sean legibles (listas, negritas, tablas).
- **Limitaciones**: Si el usuario te pide algo que requiere buscar en una base de datos más amplia (ej: un cliente de hace 2 años que no está en el contexto reciente), sugiere usar el buscador de la sección de Clientes.

Responde siempre en español, de forma profesional y amable.`;

  console.log('Using model:', CLAUDE_MODEL);
  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    system: systemPrompt,
    messages: messages.map(m => ({
      role: m.role,
      content: m.content
    })),
  });

  return extractTextBlock(response);
}
