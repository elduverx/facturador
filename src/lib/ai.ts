import Anthropic from '@anthropic-ai/sdk';
import { ARTICLE_CATEGORIES, ARTICLE_SECTIONS, normalizeSections, type ArticleSection } from '@/lib/blog-template';

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

export type BlogArticleState = {
  title: string;
  excerpt: string;
  category: string;
  sections: ArticleSection[];
  coverImageUrl: string;
  attachments: Array<{ name: string }>;
  status: 'DRAFT' | 'PUBLISHED';
};

export type BlogChatTurn = {
  reply: string;
  suggestions: string[];
  article: Pick<BlogArticleState, 'title' | 'excerpt' | 'category' | 'sections'> | null;
  coverSvg: string | null;
};

const BLOG_TOOL_NAME = 'responder_admin';

export async function generateBlogChatTurn(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  article: BlogArticleState
): Promise<BlogChatTurn> {
  assertApiKey();

  const sectionGuide = ARTICLE_SECTIONS.map((section) => `- "${section.key}": ${section.heading}`).join('\n');

  const systemPrompt = `Eres la redactora jurídica de PV Abogadas, despacho de Derecho de Extranjería en España. Conversas con la administradora del despacho para crear y mejorar artículos del blog. Hablas como una abogada colegiada: profesional, rigurosa y cercana.

Cómo trabajas en el chat:
- Responde siempre llamando a la herramienta ${BLOG_TOOL_NAME}.
- "reply": mensaje breve en español (1-3 frases) explicando lo que has hecho o preguntando lo imprescindible. No repitas el artículo en el reply.
- "article": inclúyelo completo (todas las secciones) cada vez que crees o modifiques el artículo. Omítelo si solo conversas.
- "suggestions": 2-4 opciones cortas de siguiente paso, escritas como las diría la administradora (ej.: "Hazlo más breve", "Crea una imagen de portada", "Añade un ejemplo práctico").
- "cover_svg": solo cuando te pidan una imagen o portada. Puedes proponerla como sugerencia una vez el artículo esté listo.
- Si te piden algo ambiguo, toma una decisión razonable y menciónala en el reply en lugar de preguntar.

Estilo obligatorio del artículo:
- Dirigido a personas extranjeras y sus familias, sin jerga innecesaria. Español de España, en "usted", nunca tuteando.
- Cita la normativa aplicable cuando proceda (Ley Orgánica 4/2000, Reglamento de Extranjería aprobado por el Real Decreto 1155/2024, Código Civil, etc.).
- No inventes artículos, plazos, tasas ni requisitos. Si no tienes certeza de un dato concreto, indícalo como "(a verificar)".
- No prometas resultados ni garantices la concesión de ningún trámite.
- Párrafos breves separados por una línea en blanco. Para enumeraciones usa líneas que empiecen por "- ". Sin Markdown de encabezados, negritas ni HTML.
- No incluyas firma ni aviso legal: el despacho los añade automáticamente.
- Estructura fija, todas las secciones y en este orden:
${sectionGuide}
- Categorías disponibles: ${ARTICLE_CATEGORIES.join(', ')}.

Portada (cover_svg):
- SVG autónomo con width="1200" height="630" y viewBox="0 0 1200 630".
- Estilo sobrio y elegante de despacho de abogados: paleta azul marino #1f2a44, dorado #c8aa6a, crema #f8f1df; formas geométricas o iconografía legal/viajes (balanza, pasaporte, sello, mapa) estilizada.
- Puedes incluir el título (o una versión corta) con font-family="Georgia, serif".
- Prohibido: <script>, <foreignObject>, imágenes, enlaces o recursos externos, atributos de eventos.

Estado actual del artículo (JSON):
${JSON.stringify(article)}`;

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 12000,
    system: systemPrompt,
    tools: [
      {
        name: BLOG_TOOL_NAME,
        description: 'Responde a la administradora y, si procede, actualiza el artículo o crea una portada.',
        input_schema: {
          type: 'object',
          properties: {
            reply: { type: 'string' },
            suggestions: { type: 'array', items: { type: 'string' } },
            article: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                excerpt: { type: 'string' },
                category: { type: 'string' },
                sections: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: { key: { type: 'string' }, body: { type: 'string' } },
                    required: ['key', 'body'],
                  },
                },
              },
              required: ['title', 'excerpt', 'sections'],
            },
            cover_svg: { type: 'string' },
          },
          required: ['reply', 'suggestions'],
        },
      },
    ],
    tool_choice: { type: 'tool', name: BLOG_TOOL_NAME },
    messages: messages.slice(-20).map((m) => ({ role: m.role, content: m.content })),
  });

  const toolBlock = response.content.find((block) => block.type === 'tool_use');
  if (!toolBlock || toolBlock.type !== 'tool_use') {
    throw new Error('Claude no devolvio una respuesta valida.');
  }

  const input = toolBlock.input as {
    reply?: string;
    suggestions?: unknown;
    article?: { title?: string; excerpt?: string; category?: string; sections?: unknown };
    cover_svg?: string;
  };

  return {
    reply: String(input.reply || 'Hecho.').trim(),
    suggestions: Array.isArray(input.suggestions)
      ? input.suggestions.map((item) => String(item).trim()).filter(Boolean).slice(0, 4)
      : [],
    article: input.article
      ? {
          title: String(input.article.title || article.title).trim(),
          excerpt: String(input.article.excerpt || '').trim(),
          category: String(input.article.category || article.category || '').trim(),
          sections: normalizeSections(input.article.sections),
        }
      : null,
    coverSvg: typeof input.cover_svg === 'string' && input.cover_svg.includes('<svg') ? input.cover_svg : null,
  };
}
