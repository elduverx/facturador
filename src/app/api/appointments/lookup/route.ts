import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isValidEmail, isValidPhone, normalizeEmail, normalizePhone } from '@/lib/validation';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const emailRaw = typeof body?.email === 'string' ? body.email : '';
    const phoneRaw = typeof body?.phone === 'string' ? body.phone : '';

    if (!emailRaw || !phoneRaw) {
      return NextResponse.json({ error: 'Email y telefono son obligatorios' }, { status: 400 });
    }

    const normalizedEmail = normalizeEmail(emailRaw);
    const normalizedPhone = normalizePhone(phoneRaw);

    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      return NextResponse.json({ error: 'Email no valido' }, { status: 400 });
    }
    if (!normalizedPhone || !isValidPhone(normalizedPhone)) {
      return NextResponse.json({ error: 'Telefono no valido (9 digitos, empieza con 6, 7, 8 o 9)' }, { status: 400 });
    }

    const page = Number(body?.page) || 1;
    const pageSize = Math.min(10, Math.max(1, Number(body?.pageSize) || 4));

    const today = new Date();
    const startOfToday = new Date(today.toISOString().split('T')[0] + 'T00:00:00.000Z');

    const appointments = await prisma.appointment.findMany({
      where: {
        clientEmail: { equals: normalizedEmail, mode: 'insensitive' },
        date: { gte: startOfToday },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      include: { service: true },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      take: 200,
    });

    const filtered = appointments.filter((appt) => normalizePhone(appt.clientPhone) === normalizedPhone);
    const total = filtered.length;
    const startIndex = (Math.max(1, page) - 1) * pageSize;
    const paged = filtered.slice(startIndex, startIndex + pageSize);

    return NextResponse.json({
      appointments: paged.map((appt) => ({
        id: appt.id,
        date: appt.date.toISOString(),
        startTime: appt.startTime,
        endTime: appt.endTime,
        status: appt.status,
        serviceName: appt.service?.name || 'Servicio',
      })),
      total,
      page: Math.max(1, page),
      pageSize,
    });
  } catch (error) {
    console.error('Error consultando cita:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
