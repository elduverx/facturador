import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const DOCUMENT_STATUSES = ['PENDING', 'REVIEWED', 'ACCEPTED', 'REJECTED'] as const;
type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const status = typeof body?.status === 'string' ? body.status : undefined;
    const adminNotes = typeof body?.adminNotes === 'string' ? body.adminNotes.trim() : undefined;

    if (status && !DOCUMENT_STATUSES.includes(status as (typeof DOCUMENT_STATUSES)[number])) {
      return NextResponse.json({ error: 'Estado no valido' }, { status: 400 });
    }

    const data: { status?: (typeof DOCUMENT_STATUSES)[number]; adminNotes?: string | null } = {};
    if (status) data.status = status as (typeof DOCUMENT_STATUSES)[number];
    if (adminNotes !== undefined) data.adminNotes = adminNotes || null;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nada para actualizar' }, { status: 400 });
    }

    const updated = await prisma.clientDocument.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error actualizando documento:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
