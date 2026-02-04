import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const isValidDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);
const isValidTime = (value: string) => /^\d{2}:\d{2}$/.test(value);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const where: Record<string, unknown> = {};
  if (from || to) {
    const range: Record<string, Date> = {};
    if (from && isValidDate(from)) range.gte = new Date(from + 'T00:00:00.000Z');
    if (to && isValidDate(to)) range.lte = new Date(to + 'T23:59:59.999Z');
    if (Object.keys(range).length > 0) {
      where.date = range;
    }
  }

  const schedules = await prisma.daySchedule.findMany({
    where,
    orderBy: { date: 'asc' },
  });

  return NextResponse.json(schedules);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const date = typeof body?.date === 'string' ? body.date : '';
    const startTime = typeof body?.startTime === 'string' ? body.startTime : '';
    const endTime = typeof body?.endTime === 'string' ? body.endTime : '';
    const lunchStartTime = typeof body?.lunchStartTime === 'string' ? body.lunchStartTime : null;
    const lunchEndTime = typeof body?.lunchEndTime === 'string' ? body.lunchEndTime : null;

    const maxAppointmentsPerDay = body?.maxAppointmentsPerDay ?? null;
    const slotDurationMin = body?.slotDurationMin ?? null;

    if (!date || !isValidDate(date)) {
      return NextResponse.json({ error: 'Fecha invalida' }, { status: 400 });
    }
    if (!startTime || !isValidTime(startTime) || !endTime || !isValidTime(endTime)) {
      return NextResponse.json({ error: 'Horario invalido' }, { status: 400 });
    }

    const toMinutes = (time: string) => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    };

    if (toMinutes(endTime) <= toMinutes(startTime)) {
      return NextResponse.json({ error: 'La hora de fin debe ser mayor que la de inicio' }, { status: 400 });
    }

    const parsedMax = maxAppointmentsPerDay === null || maxAppointmentsPerDay === ''
      ? null
      : Number(maxAppointmentsPerDay);
    const parsedSlot = slotDurationMin === null || slotDurationMin === ''
      ? null
      : Number(slotDurationMin);

    if (parsedMax !== null && (Number.isNaN(parsedMax) || parsedMax < 0)) {
      return NextResponse.json({ error: 'Cupos invalidos' }, { status: 400 });
    }
    if (parsedSlot !== null && (Number.isNaN(parsedSlot) || parsedSlot < 1)) {
      return NextResponse.json({ error: 'Duracion invalida' }, { status: 400 });
    }

    if ((lunchStartTime && !isValidTime(lunchStartTime)) || (lunchEndTime && !isValidTime(lunchEndTime))) {
      return NextResponse.json({ error: 'Pausa invalida' }, { status: 400 });
    }

    if ((lunchStartTime && !lunchEndTime) || (!lunchStartTime && lunchEndTime)) {
      return NextResponse.json({ error: 'Debe indicar inicio y fin de pausa' }, { status: 400 });
    }

    if (lunchStartTime && lunchEndTime) {
      const lunchStart = toMinutes(lunchStartTime);
      const lunchEnd = toMinutes(lunchEndTime);
      if (lunchEnd <= lunchStart) {
        return NextResponse.json({ error: 'La pausa debe tener un rango valido' }, { status: 400 });
      }
    }

    const scheduleDate = new Date(date + 'T00:00:00.000Z');

    const saved = await prisma.daySchedule.upsert({
      where: { date: scheduleDate },
      update: {
        startTime,
        endTime,
        lunchStartTime,
        lunchEndTime,
        maxAppointmentsPerDay: parsedMax,
        slotDurationMin: parsedSlot,
      },
      create: {
        date: scheduleDate,
        startTime,
        endTime,
        lunchStartTime,
        lunchEndTime,
        maxAppointmentsPerDay: parsedMax,
        slotDurationMin: parsedSlot,
      },
    });

    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    console.error('Error guardando jornada:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
