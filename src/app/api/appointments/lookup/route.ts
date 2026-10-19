import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isValidEmail, normalizeEmail, normalizeNie } from '@/lib/validation';
import { createPortalSessionCookie } from '@/lib/portal-session';

const PORTAL_SESSION_COOKIE = 'pv_portal_session';
const SESSION_MAX_AGE = 60 * 60 * 2;

const toIsoSafe = (val: any): string => {
  if (!val) return '';
  const date = val instanceof Date ? val : new Date(val);
  return isNaN(date.getTime()) ? '' : date.toISOString();
};

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
      }).catch((err) => {
        console.error('Error fetching client documents for lookup:', err);
        return [];
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
      }).catch((err) => {
        console.error('Error fetching matters for lookup:', err);
        return [];
      }),
      prisma.paymentLink.findMany({
        where: {
          clientEmail: { equals: normalizedEmail, mode: 'insensitive' },
          status: 'PENDING',
        },
        orderBy: { createdAt: 'desc' },
      }).catch((err) => {
        console.error('Error fetching payment links for lookup:', err);
        return [];
      }),
      prisma.clientNote.findMany({
        where: {
          clientEmail: { equals: normalizedEmail, mode: 'insensitive' },
          isPublic: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }).catch((err) => {
        console.error('Error fetching client notes for lookup:', err);
        return [];
      }),
    ]);

    const hasPortalMatch = allAppointments.length > 0 || matters.length > 0 || documents.length > 0 || paymentLinks.length > 0;

    const response = NextResponse.json({
      appointments: paged.map((appt) => ({
        id: appt.id,
        clientName: appt.clientName,
        clientNie: appt.clientNie,
        date: toIsoSafe(appt.date),
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
        createdAt: toIsoSafe(note.createdAt),
      })),
      documents: documents.map(document => ({
        ...document,
        adminNotes: document.adminNotes,
        createdAt: toIsoSafe(document.createdAt),
      })),
      paymentLinks: paymentLinks.map(link => ({
        id: link.id,
        concept: link.concept,
        amount: link.amount,
        reference: link.reference,
        status: link.status,
        createdAt: toIsoSafe(link.createdAt),
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
        openedAt: toIsoSafe(matter.openedAt),
        nextActionAt: toIsoSafe(matter.nextActionAt) || null,
        summary: matter.summary,
        timeline: matter.timeline.map((entry) => ({
          id: entry.id,
          type: entry.type,
          title: entry.title,
          content: entry.content,
          createdAt: toIsoSafe(entry.createdAt),
        })),
        deadlines: matter.deadlines.map((deadline) => ({
          id: deadline.id,
          title: deadline.title,
          dueAt: toIsoSafe(deadline.dueAt),
          kind: deadline.kind,
        })),
        billingDocuments: matter.billingDocuments.map((document) => ({
          ...document,
          issuedAt: toIsoSafe(document.issuedAt),
          dueAt: toIsoSafe(document.dueAt) || null,
        })),
      })),
      total,
      page: Math.max(1, page),
      pageSize,
    });

    if (hasPortalMatch) {
      try {
        const sessionCookie = await createPortalSessionCookie({
          appointmentId: allAppointments[0]?.id,
          email: normalizedEmail,
          nie: normalizedNie,
        });
        response.cookies.set(PORTAL_SESSION_COOKIE, sessionCookie, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: SESSION_MAX_AGE,
          path: '/',
        });
      } catch (cookieErr) {
        console.error('Error setting portal session cookie in lookup:', cookieErr);
      }
    }

    return response;
  } catch (error) {
    console.error('Error consultando cita:', error);
    return NextResponse.json({ error: 'Error interno al consultar sus registros' }, { status: 500 });
  }
}
