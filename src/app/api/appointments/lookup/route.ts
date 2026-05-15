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

    const allAppointments = await prisma.appointment.findMany({
      where: {
        clientEmail: { equals: normalizedEmail, mode: 'insensitive' },
      },
      include: { service: true },
      orderBy: [{ date: 'desc' }, { startTime: 'desc' }],
      take: 200,
    });

    const filtered = allAppointments.filter((appt) => normalizePhone(appt.clientPhone) === normalizedPhone);
    
    // Si no hay citas que coincidan con el telefono, error de seguridad/privacidad
    if (filtered.length === 0) {
       return NextResponse.json({ appointments: [], total: 0, notes: [] });
    }

    const total = filtered.length;
    const startIndex = (Math.max(1, page) - 1) * pageSize;
    const paged = filtered.slice(startIndex, startIndex + pageSize);

    const [publicNotes, documents] = await Promise.all([
      prisma.clientNote.findMany({
        where: {
          clientEmail: { equals: normalizedEmail, mode: 'insensitive' },
          isPublic: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.clientDocument.findMany({
        where: {
          clientEmail: { equals: normalizedEmail, mode: 'insensitive' },
          clientPhone: normalizedPhone,
        },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fileName: true,
          mimeType: true,
          sizeBytes: true,
          description: true,
          status: true,
          adminNotes: true,
          createdAt: true,
        },
      }),
    ]);

    return NextResponse.json({
      appointments: paged.map((appt) => ({
        id: appt.id,
        date: appt.date.toISOString(),
        startTime: appt.startTime,
        endTime: appt.endTime,
        status: appt.status,
        paymentStatus: appt.paymentStatus,
        serviceName: appt.service?.name || 'Servicio',
        price: appt.service?.price || 0,
      })),
      notes: publicNotes.map(note => ({
        id: note.id,
        content: note.content,
        status: note.status,
        createdAt: note.createdAt.toISOString(),
      })),
      documents: documents.map(document => ({
        ...document,
        createdAt: document.createdAt.toISOString(),
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
