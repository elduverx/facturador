import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { readClientDocument } from '@/lib/client-documents';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const document = await prisma.clientDocument.findUnique({ where: { id } });

    if (!document) {
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });
    }

    const buffer = await readClientDocument(document.storagePath);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': document.mimeType,
        'Content-Length': String(buffer.byteLength),
        'Content-Disposition': `attachment; filename="${encodeURIComponent(document.fileName)}"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    console.error('Error descargando documento:', error);
    return NextResponse.json({ error: 'Error descargando documento' }, { status: 500 });
  }
}
