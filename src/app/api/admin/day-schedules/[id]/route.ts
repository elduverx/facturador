import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type RouteParams = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id } = await params;

  try {
    await prisma.daySchedule.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error eliminando jornada:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
