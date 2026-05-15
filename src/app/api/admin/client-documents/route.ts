import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isValidEmail, normalizeEmail } from '@/lib/validation';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = normalizeEmail(searchParams.get('email') || '');

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: 'Email no valido' }, { status: 400 });
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
