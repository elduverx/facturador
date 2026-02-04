import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const blockedDates = await prisma.blockedDate.findMany({
    orderBy: { date: 'asc' },
  });
  return NextResponse.json(blockedDates);
}

export async function POST(request: Request) {
  try {
    const { date, reason } = await request.json();

    if (!date) {
      return NextResponse.json({ error: 'Fecha requerida' }, { status: 400 });
    }

    const blocked = await prisma.blockedDate.create({
      data: {
        date: new Date(date + 'T00:00:00.000Z'),
        reason: reason || null,
      },
    });

    return NextResponse.json(blocked, { status: 201 });
  } catch (error) {
    console.error('Error creando fecha bloqueada:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    await prisma.blockedDate.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error eliminando fecha bloqueada:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
