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

    const total = filtered.length;
    const startIndex = (Math.max(1, page) - 1) * pageSize;
    const paged = filtered.slice(startIndex, startIndex + pageSize);

    const [documents, matters] = await Promise.all([
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
      prisma.matter.findMany({
        where: {
          clientEmail: { equals: normalizedEmail, mode: 'insensitive' },
          clientPhone: normalizedPhone,
        },
        include: {
          timeline: {
            where: { isPublic: true },
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          deadlines: {
            where: { status: 'OPEN' },
            orderBy: { dueAt: 'asc' },
            take: 10,
          },
          billingDocuments: {
            where: { status: { in: ['SENT', 'ACCEPTED', 'PARTIALLY_PAID', 'PAID'] } },
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: {
              id: true,
              type: true,
              status: true,
              number: true,
              concept: true,
              totalAmount: true,
              paidAmount: true,
              dueAt: true,
              issuedAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const hasPortalMatch = filtered.length > 0 || documents.length > 0 || matters.length > 0;
    const publicNotes = hasPortalMatch
      ? await prisma.clientNote.findMany({
          where: {
            clientEmail: { equals: normalizedEmail, mode: 'insensitive' },
            isPublic: true,
          },
          orderBy: { createdAt: 'desc' },
        })
      : [];

    return NextResponse.json({
      appointments: paged.map((appt) => ({
        id: appt.id,
        clientName: appt.clientName,
        clientNie: appt.clientNie,
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
      matters: matters.map((matter) => ({
        id: matter.id,
        reference: matter.reference,
        clientName: matter.clientName,
        clientNie: matter.clientNie,
        title: matter.title,
        procedureType: matter.procedureType,
        status: matter.status,
        priority: matter.priority,
        openedAt: matter.openedAt.toISOString(),
        nextActionAt: matter.nextActionAt?.toISOString() || null,
        summary: matter.summary,
        timeline: matter.timeline.map((entry) => ({
          id: entry.id,
          type: entry.type,
          title: entry.title,
          content: entry.content,
          createdAt: entry.createdAt.toISOString(),
        })),
        deadlines: matter.deadlines.map((deadline) => ({
          id: deadline.id,
          title: deadline.title,
          dueAt: deadline.dueAt.toISOString(),
          kind: deadline.kind,
        })),
        billingDocuments: matter.billingDocuments.map((document) => ({
          ...document,
          issuedAt: document.issuedAt.toISOString(),
          dueAt: document.dueAt?.toISOString() || null,
        })),
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
