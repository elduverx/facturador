import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isValidEmail, normalizeEmail, normalizeNie } from '@/lib/validation';
import { createPortalSessionCookie } from '@/lib/portal-session';

const PORTAL_SESSION_COOKIE = 'pv_portal_session';
const SESSION_MAX_AGE = 60 * 60 * 2;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const emailRaw = typeof body?.email === 'string' ? body.email : '';
    const nieRaw = typeof body?.nie === 'string' ? body.nie : '';

    if (!emailRaw || !nieRaw) {
      return NextResponse.json({ error: 'Email y documento de identidad son obligatorios' }, { status: 400 });
    }

    const normalizedEmail = normalizeEmail(emailRaw);
    const normalizedNie = normalizeNie(nieRaw);

    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      return NextResponse.json({ error: 'Email no válido' }, { status: 400 });
    }
    if (!normalizedNie || normalizedNie.length < 5) {
      return NextResponse.json({ error: 'Documento de identidad no válido' }, { status: 400 });
    }

    const page = Number(body?.page) || 1;
    const pageSize = Math.min(10, Math.max(1, Number(body?.pageSize) || 4));

    // Verificar si el NIE pertenece al email en alguna cita o expediente
    const hasMatchingNie = await prisma.appointment.findFirst({
      where: {
        clientEmail: { equals: normalizedEmail, mode: 'insensitive' },
        clientNie: { equals: normalizedNie, mode: 'insensitive' }
      }
    }) || await prisma.matter.findFirst({
      where: {
        clientEmail: { equals: normalizedEmail, mode: 'insensitive' },
        clientNie: { equals: normalizedNie, mode: 'insensitive' }
      }
    });

    if (!hasMatchingNie) {
      // Intentar buscar sin case sensitive y quitando espacios extras por si acaso
      const allAppts = await prisma.appointment.findMany({ where: { clientEmail: { equals: normalizedEmail, mode: 'insensitive' } } });
      const allMatters = await prisma.matter.findMany({ where: { clientEmail: { equals: normalizedEmail, mode: 'insensitive' } } });
      
      const matchFound = 
        allAppts.some(a => a.clientNie && normalizeNie(a.clientNie) === normalizedNie) ||
        allMatters.some(m => m.clientNie && normalizeNie(m.clientNie) === normalizedNie);

      if (!matchFound) {
        return NextResponse.json({ error: 'No se encontraron registros que coincidan con ese email y documento' }, { status: 404 });
      }
    }

    // Al autenticar por NIE+Email, traemos TODOS los registros de ese email
    const allAppointments = await prisma.appointment.findMany({
      where: {
        clientEmail: { equals: normalizedEmail, mode: 'insensitive' },
      },
      include: { service: true },
      orderBy: [{ date: 'desc' }, { startTime: 'desc' }],
      take: 200,
    });

    const total = allAppointments.length;
    const startIndex = (Math.max(1, page) - 1) * pageSize;
    const paged = allAppointments.slice(startIndex, startIndex + pageSize);

    const [documents, matters, paymentLinks, notes] = await Promise.all([
      prisma.clientDocument.findMany({
        where: {
          clientEmail: { equals: normalizedEmail, mode: 'insensitive' },
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
          amountDue: true,
          isPaid: true,
          createdAt: true,
        },
      }),
      prisma.matter.findMany({
        where: {
          clientEmail: { equals: normalizedEmail, mode: 'insensitive' },
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
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.paymentLink.findMany({
        where: {
          clientEmail: { equals: normalizedEmail, mode: 'insensitive' },
          status: 'PENDING',
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.clientNote.findMany({
        where: {
          clientEmail: { equals: normalizedEmail, mode: 'insensitive' },
          isPublic: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      })
    ]);

    const hasPortalMatch = allAppointments.length > 0 || matters.length > 0 || documents.length > 0 || paymentLinks.length > 0;

    const response = NextResponse.json({
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
      notes: notes.map(note => ({
        id: note.id,
        content: note.content,
        status: note.status,
        createdAt: note.createdAt.toISOString(),
      })),
      documents: documents.map(document => ({
        ...document,
        adminNotes: document.adminNotes,
        createdAt: document.createdAt.toISOString(),
      })),
      paymentLinks: paymentLinks.map(link => ({
        id: link.id,
        concept: link.concept,
        amount: link.amount,
        reference: link.reference,
        status: link.status,
        createdAt: link.createdAt.toISOString(),
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

    if (hasPortalMatch) {
      response.cookies.set(PORTAL_SESSION_COOKIE, await createPortalSessionCookie({
        appointmentId: allAppointments[0]?.id,
        email: normalizedEmail,
        nie: normalizedNie,
      }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: SESSION_MAX_AGE,
        path: '/',
      });
    }

    return response;
  } catch (error) {
    console.error('Error consultando cita:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
