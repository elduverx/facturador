import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parsePortalSessionCookie } from '@/lib/portal-session';

const PORTAL_SESSION_COOKIE = 'pv_portal_session';

function canTrustBrowserReturn() {
  return process.env.NODE_ENV !== 'production' || process.env.REDSYS_TRUST_BROWSER_RETURN === 'true';
}

export async function POST(request: Request) {
  if (!canTrustBrowserReturn()) {
    return NextResponse.json({ error: 'No disponible' }, { status: 403 });
  }

  const cookieStore = await cookies();
  const session = await parsePortalSessionCookie(cookieStore.get(PORTAL_SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const appointmentId = typeof body?.appointmentId === 'string' && body.appointmentId
    ? body.appointmentId
    : session.appointmentId;
  const documentId = typeof body?.documentId === 'string' && body.documentId
    ? body.documentId
    : session.documentId;

  if (appointmentId) {
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        clientEmail: { equals: session.email, mode: 'insensitive' },
        clientPhone: session.phone,
      },
      select: { id: true, paymentStatus: true },
    });

    if (!appointment) {
      return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 });
    }

    const attempt = await prisma.paymentAttempt.findFirst({
      where: {
        targetType: 'APPOINTMENT',
        targetId: appointment.id,
        status: 'PENDING',
      },
      orderBy: { createdAt: 'desc' },
    });

    await prisma.$transaction([
      prisma.appointment.update({
        where: { id: appointment.id },
        data: {
          paymentStatus: 'PAID',
          status: 'CONFIRMED',
          ...(attempt ? { paymentId: attempt.orderId } : {}),
        },
      }),
      ...(attempt
        ? [prisma.paymentAttempt.update({
            where: { id: attempt.id },
            data: { status: 'PAID', rawResponse: { source: 'browser_return_dev' } },
          })]
        : []),
    ]);

    return NextResponse.json({ ok: true, type: 'appointment' });
  }

  if (documentId) {
    const document = await prisma.clientDocument.findFirst({
      where: {
        id: documentId,
        clientEmail: { equals: session.email, mode: 'insensitive' },
        OR: [{ clientPhone: session.phone }, { clientPhone: '' }],
      },
      select: { id: true },
    });

    if (!document) {
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });
    }

    const attempt = await prisma.paymentAttempt.findFirst({
      where: {
        targetType: 'DOCUMENT',
        targetId: document.id,
        status: 'PENDING',
      },
      orderBy: { createdAt: 'desc' },
    });

    await prisma.$transaction([
      prisma.clientDocument.update({
        where: { id: document.id },
        data: {
          isPaid: true,
          ...(attempt ? { paymentId: attempt.orderId } : {}),
        },
      }),
      ...(attempt
        ? [prisma.paymentAttempt.update({
            where: { id: attempt.id },
            data: { status: 'PAID', rawResponse: { source: 'browser_return_dev' } },
          })]
        : []),
    ]);

    return NextResponse.json({ ok: true, type: 'document' });
  }

  return NextResponse.json({ error: 'Sin pago que confirmar' }, { status: 400 });
}
