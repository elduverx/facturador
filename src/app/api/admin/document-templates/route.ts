import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DEFAULT_DOCUMENT_TEMPLATES } from '@/lib/legal';

export async function GET() {
  const count = await prisma.documentTemplate.count();
  if (count === 0) {
    await prisma.documentTemplate.createMany({ data: DEFAULT_DOCUMENT_TEMPLATES });
  }

  const templates = await prisma.documentTemplate.findMany({
    where: { active: true },
    orderBy: [{ procedureType: 'asc' }, { name: 'asc' }],
  });

  return NextResponse.json(templates);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const content = typeof body?.content === 'string' ? body.content.trim() : '';

    if (!name || !content) {
      return NextResponse.json({ error: 'Nombre y contenido son obligatorios' }, { status: 400 });
    }

    const created = await prisma.documentTemplate.create({
      data: {
        name,
        content,
        procedureType: typeof body?.procedureType === 'string' && body.procedureType.trim() ? body.procedureType.trim() : null,
        description: typeof body?.description === 'string' && body.description.trim() ? body.description.trim() : null,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error creando plantilla:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
