import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { analyzeDocument } from '@/lib/ai';
import { isValidEmail, normalizeEmail } from '@/lib/validation';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const VALID_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

const inferNoteStatus = (estado: string) => {
  const normalized = estado.toUpperCase();
  if (normalized.includes('CONCEDIDO') || normalized.includes('FAVORABLE') || normalized.includes('APROBADO')) {
    return 'DONE';
  }
  if (normalized.includes('REQUER') || normalized.includes('SUBSAN') || normalized.includes('PENDIENTE')) {
    return 'WAITING';
  }
  return 'IN_PROGRESS';
};

export async function POST(request: Request) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Configura ANTHROPIC_API_KEY en .env para activar Claude.' },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const email = formData.get('email');

    if (!(file instanceof File) || typeof email !== 'string') {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    const clientEmail = normalizeEmail(email);
    if (!isValidEmail(clientEmail)) {
      return NextResponse.json({ error: 'Email no valido' }, { status: 400 });
    }

    if (!VALID_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Formato no soportado. Use PDF, JPG, PNG o WebP.' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Archivo demasiado grande. Maximo 10 MB.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const analysis = await analyzeDocument(buffer, file.type);

    const dateLines = analysis.fechas.length > 0
      ? `\n**Fechas importantes:**\n${analysis.fechas.map((fecha) => `- ${fecha.etiqueta}: ${fecha.valor}`).join('\n')}`
      : '';

    const noteContent = `
### Actualizacion de tramite: ${analysis.tipo}

**Estado actual:** ${analysis.estado}

**Resumen del avance:**
${analysis.resumen}

**Datos detectados:**
- **Interesado:** ${analysis.interesado.nombre}
- **Identificador:** ${analysis.interesado.identificador}${dateLines}

---
**Proximo paso:** ${analysis.proxima_accion}
    `.trim();

    const createdNote = await prisma.clientNote.create({
      data: {
        clientEmail,
        content: noteContent,
        status: inferNoteStatus(analysis.estado),
        isPublic: true,
        tags: ['AUTO_CLAUDE', 'DOCUMENTO', analysis.tipo].filter(Boolean).slice(0, 8),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Documento analizado y portal del cliente actualizado automaticamente.',
      analysis,
      note: createdNote,
    });
  } catch (error) {
    console.error('Error analizando documento con Claude:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error procesando el documento con IA' },
      { status: 500 }
    );
  }
}
