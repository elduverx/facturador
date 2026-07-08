import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isValidEmail, normalizeEmail } from '@/lib/validation';
import { canAccessClientEmail } from '@/lib/admin-scope';

const NOTE_STATUSES = ['PENDING', 'IN_PROGRESS', 'WAITING', 'DONE'] as const;
type NoteStatus = (typeof NOTE_STATUSES)[number];

const normalizeTags = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .filter((tag) => typeof tag === 'string')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
  }

  const normalizedEmail = normalizeEmail(email);
  if (!isValidEmail(normalizedEmail)) {
    return NextResponse.json({ error: 'Email no valido' }, { status: 400 });
  }

  if (!(await canAccessClientEmail(normalizedEmail))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const notes = await prisma.clientNote.findMany({
      where: { clientEmail: { equals: normalizedEmail, mode: 'insensitive' } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error('Error cargando notas:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body?.email === 'string' ? body.email : '';
    const content = typeof body?.content === 'string' ? body.content.trim() : '';
    const status = typeof body?.status === 'string' ? body.status : 'PENDING';
    const tags = normalizeTags(body?.tags);
    const isPublic = typeof body?.isPublic === 'boolean' ? body.isPublic : false;

    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !content) {
      return NextResponse.json({ error: 'Email y contenido son obligatorios' }, { status: 400 });
    }

    if (!isValidEmail(normalizedEmail)) {
      return NextResponse.json({ error: 'Email no valido' }, { status: 400 });
    }

    if (!(await canAccessClientEmail(normalizedEmail))) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!NOTE_STATUSES.includes(status as NoteStatus)) {
      return NextResponse.json({ error: 'Estado no valido' }, { status: 400 });
    }

    const created = await prisma.clientNote.create({
      data: {
        clientEmail: normalizedEmail,
        content,
        status: status as NoteStatus,
        tags,
        isPublic,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error creando nota:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
