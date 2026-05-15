import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type RouteParams = { params: Promise<{ id: string }> };

const NOTE_STATUSES = ['PENDING', 'IN_PROGRESS', 'WAITING', 'DONE'] as const;
type NoteStatus = (typeof NOTE_STATUSES)[number];

const normalizeTags = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .filter((tag) => typeof tag === 'string')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
};

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id } = await params;

  try {
    const body = await request.json();
    const content = typeof body?.content === 'string' ? body.content.trim() : '';
    const status = typeof body?.status === 'string' ? body.status : undefined;
    const tags = Object.prototype.hasOwnProperty.call(body || {}, 'tags') ? normalizeTags(body?.tags) : undefined;
    const isPublic = typeof body?.isPublic === 'boolean' ? body.isPublic : undefined;

    if (!content && status === undefined && tags === undefined && isPublic === undefined) {
      return NextResponse.json({ error: 'Nada para actualizar' }, { status: 400 });
    }

    if (status && !NOTE_STATUSES.includes(status as NoteStatus)) {
      return NextResponse.json({ error: 'Estado no valido' }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    if (content) data.content = content;
    if (status) data.status = status as NoteStatus;
    if (tags !== undefined) data.tags = tags;
    if (isPublic !== undefined) data.isPublic = isPublic;

    const updated = await prisma.clientNote.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error actualizando nota:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id } = await params;

  try {
    await prisma.clientNote.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error eliminando nota:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
