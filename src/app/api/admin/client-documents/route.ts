import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isValidEmail, normalizeEmail } from '@/lib/validation';
import { CLIENT_DOCUMENT_MAX_SIZE, CLIENT_DOCUMENT_MIME_TYPES, saveClientDocument } from '@/lib/client-documents';
import { canAccessClientEmail } from '@/lib/admin-scope';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = normalizeEmail(searchParams.get('email') || '');

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: 'Email no valido' }, { status: 400 });
    }

    if (!(await canAccessClientEmail(email))) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const documents = await prisma.clientDocument.findMany({
      where: { clientEmail: { equals: email, mode: 'insensitive' } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fileName: true,
        mimeType: true,
        sizeBytes: true,
        description: true,
        status: true,
        adminNotes: true,
        aiAnalysis: true,
        matchedEmail: true,
        matchedScore: true,
        amountDue: true,
        isPaid: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      documents.map((document) => ({
        ...document,
        createdAt: document.createdAt.toISOString(),
        updatedAt: document.updatedAt.toISOString(),
      }))
    );
  } catch (error) {
    console.error('Error listando documentos admin:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const email = normalizeEmail(String(formData.get('email') || ''));
    const adminNotes = String(formData.get('adminNotes') || '').trim();
    const amountDueStr = formData.get('amountDue');
    const amountDue = amountDueStr ? parseFloat(String(amountDueStr)) : null;

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 });
    }

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: 'Email de cliente no valido' }, { status: 400 });
    }

    if (!(await canAccessClientEmail(email))) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!CLIENT_DOCUMENT_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Solo se admiten PDF, JPG, PNG o WebP' }, { status: 400 });
    }

    if (file.size > CLIENT_DOCUMENT_MAX_SIZE) {
      return NextResponse.json({ error: 'Archivo demasiado grande. Maximo 10 MB.' }, { status: 400 });
    }

    const saved = await saveClientDocument(file);

    const created = await prisma.clientDocument.create({
      data: {
        clientEmail: email,
        clientPhone: '', // Admin upload doesn't need phone validation
        fileName: saved.safeName,
        mimeType: file.type,
        sizeBytes: saved.sizeBytes,
        storagePath: saved.absolutePath,
        description: 'Documento subido por el despacho',
        adminNotes: adminNotes || null,
        amountDue: amountDue && amountDue > 0 ? amountDue : null,
        status: 'PENDING',
      },
    });

    return NextResponse.json({
      success: true,
      document: {
        ...created,
        createdAt: created.createdAt.toISOString(),
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error subiendo documento del admin:', error);
    return NextResponse.json({ error: 'Error subiendo documento' }, { status: 500 });
  }
}
