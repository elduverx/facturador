import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isValidEmail, isValidPhone, normalizeEmail, normalizePhone } from '@/lib/validation';
import { analyzeDocument, DocumentAnalysis } from '@/lib/ai';
import { sendEmail } from '@/lib/email';
import { adminClientDocumentEmail } from '@/lib/email-templates';
import {
  CLIENT_DOCUMENT_MAX_SIZE,
  CLIENT_DOCUMENT_MIME_TYPES,
  saveClientDocument,
} from '@/lib/client-documents';

const verifyClient = async (email: string, phone: string) => {
  const appointments = await prisma.appointment.findMany({
    where: { clientEmail: { equals: email, mode: 'insensitive' } },
    select: { clientPhone: true },
    take: 50,
  });

  return appointments.some((appointment) => normalizePhone(appointment.clientPhone) === phone);
};

const scoreDocumentMatch = (
  analysis: DocumentAnalysis,
  appointment: {
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    clientNie: string | null;
  }
) => {
  let score = 0;
  const detectedName = analysis.interesado.nombre.toLowerCase();
  const detectedId = analysis.interesado.identificador.toLowerCase().replace(/\s/g, '');
  const dbName = appointment.clientName.toLowerCase();
  const dbNie = (appointment.clientNie || '').toLowerCase().replace(/\s/g, '');

  if (appointment.clientEmail) score += 0.2;
  if (detectedName && detectedName !== 'no detectado' && dbName.includes(detectedName.split(' ')[0])) score += 0.25;
  if (detectedName && detectedName !== 'no detectado' && detectedName.includes(dbName.split(' ')[0])) score += 0.25;
  if (detectedId && dbNie && detectedId.includes(dbNie)) score += 0.4;
  if (detectedId && dbNie && dbNie.includes(detectedId)) score += 0.4;

  return Math.min(1, score);
};

const buildAiNote = (analysis: DocumentAnalysis, score: number) => `
Claude ha leido un documento subido por el cliente.

Tipo: ${analysis.tipo}
Interesado: ${analysis.interesado.nombre}
Identificador: ${analysis.interesado.identificador}
Estado detectado: ${analysis.estado}
Coincidencia con la base de datos: ${Math.round(score * 100)}%

Resumen:
${analysis.resumen}

Proxima accion sugerida:
${analysis.proxima_accion}
`.trim();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = normalizeEmail(searchParams.get('email') || '');
    const phone = normalizePhone(searchParams.get('phone') || '');

    if (!email || !phone || !isValidEmail(email) || !isValidPhone(phone)) {
      return NextResponse.json({ error: 'Datos de acceso no validos' }, { status: 400 });
    }

    const verified = await verifyClient(email, phone);
    if (!verified) {
      return NextResponse.json({ documents: [] });
    }

    const documents = await prisma.clientDocument.findMany({
      where: {
        clientEmail: { equals: email, mode: 'insensitive' },
        clientPhone: phone,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fileName: true,
        mimeType: true,
        sizeBytes: true,
        description: true,
        status: true,
        clientPhone: true,
        adminNotes: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      documents: documents.map((document) => ({
        ...document,
        adminNotes: document.clientPhone === '' ? document.adminNotes : null,
        clientPhone: undefined,
        createdAt: document.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Error listando documentos del cliente:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const email = normalizeEmail(String(formData.get('email') || ''));
    const phone = normalizePhone(String(formData.get('phone') || ''));
    const description = String(formData.get('description') || '').trim().slice(0, 500);

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 });
    }

    if (!email || !phone || !isValidEmail(email) || !isValidPhone(phone)) {
      return NextResponse.json({ error: 'Datos de acceso no validos' }, { status: 400 });
    }

    const verified = await verifyClient(email, phone);
    if (!verified) {
      return NextResponse.json({ error: 'No se encontro expediente con esos datos' }, { status: 403 });
    }

    if (!CLIENT_DOCUMENT_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Solo se admiten PDF, JPG, PNG o WebP' }, { status: 400 });
    }

    if (file.size > CLIENT_DOCUMENT_MAX_SIZE) {
      return NextResponse.json({ error: 'Archivo demasiado grande. Maximo 10 MB.' }, { status: 400 });
    }

    const saved = await saveClientDocument(file);

    let analysis: DocumentAnalysis | null = null;
    let matchedScore: number | null = null;
    let aiError: string | null = null;

    if (process.env.ANTHROPIC_API_KEY) {
      try {
        analysis = await analyzeDocument(Buffer.from(await file.arrayBuffer()), file.type);

        const relatedAppointments = await prisma.appointment.findMany({
          where: { clientEmail: { equals: email, mode: 'insensitive' } },
          select: {
            clientName: true,
            clientEmail: true,
            clientPhone: true,
            clientNie: true,
          },
          take: 20,
        });

        matchedScore = relatedAppointments.reduce(
          (best, appointment) => Math.max(best, scoreDocumentMatch(analysis as DocumentAnalysis, appointment)),
          0
        );
      } catch (error) {
        aiError = error instanceof Error ? error.message : 'No se pudo analizar con Claude';
      }
    }

    const created = await prisma.$transaction(async (tx) => {
      const document = await tx.clientDocument.create({
        data: {
          clientEmail: email,
          clientPhone: phone,
          fileName: saved.safeName,
          mimeType: file.type,
          sizeBytes: saved.sizeBytes,
          storagePath: saved.absolutePath,
          description: description || null,
          aiAnalysis: analysis || undefined,
          matchedEmail: matchedScore !== null && matchedScore >= 0.4 ? email : null,
          matchedScore,
          adminNotes: analysis ? buildAiNote(analysis, matchedScore || 0) : aiError,
        },
      });

      await tx.clientNote.create({
        data: {
          clientEmail: email,
          content: analysis
            ? `${buildAiNote(analysis, matchedScore || 0)}${description ? `\n\nNota del cliente: ${description}` : ''}`
            : `Documento recibido del cliente: ${saved.safeName}${description ? `\nNota del cliente: ${description}` : ''}${aiError ? `\n\nIA: ${aiError}` : ''}`,
          status: 'PENDING',
          tags: analysis ? ['DOCUMENTO_CLIENTE', 'AUTO_CLAUDE', analysis.tipo] : ['DOCUMENTO_CLIENTE'],
          isPublic: false,
        },
      });

      return document;
    });

    prisma.officeSettings.findUnique({ where: { id: 'default' } })
      .then((settings) => {
        if (!settings?.firmEmail) return false;
        return sendEmail({
          to: settings.firmEmail,
          subject: `Nueva documentacion: ${email}`,
          html: adminClientDocumentEmail({
            firmName: settings.firmName || 'PV Abogadas',
            clientEmail: email,
            clientPhone: phone,
            fileName: saved.safeName,
            description: description || null,
            aiSummary: analysis?.resumen || null,
            aiStatus: analysis?.estado || null,
            aiNextAction: analysis?.proxima_accion || null,
            matchedScore,
          }),
        });
      })
      .catch(console.error);

    return NextResponse.json({
      success: true,
      document: {
        id: created.id,
        fileName: created.fileName,
        mimeType: created.mimeType,
        sizeBytes: created.sizeBytes,
        description: created.description,
        status: created.status,
        adminNotes: created.adminNotes,
        createdAt: created.createdAt.toISOString(),
      },
      aiAnalyzed: Boolean(analysis),
    }, { status: 201 });
  } catch (error) {
    console.error('Error subiendo documento del cliente:', error);
    return NextResponse.json({ error: 'Error subiendo documento' }, { status: 500 });
  }
}
