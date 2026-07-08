import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parsePortalSessionCookie } from '@/lib/portal-session';

const PORTAL_SESSION_COOKIE = 'pv_portal_session';

export async function GET() {
  const cookieStore = await cookies();
  const rawSession = cookieStore.get(PORTAL_SESSION_COOKIE)?.value;
  if (!rawSession) {
    return NextResponse.json({ authenticated: false });
  }

  const session = await parsePortalSessionCookie(rawSession);
  if (!session) {
    return NextResponse.json({ authenticated: false });
  }

  const appointment = session.appointmentId
    ? await prisma.appointment.findFirst({
        where: {
          id: session.appointmentId,
          clientEmail: { equals: session.email, mode: 'insensitive' },
          clientPhone: session.phone,
        },
        select: {
          id: true,
          clientName: true,
          clientEmail: true,
          clientPhone: true,
          paymentStatus: true,
          status: true,
        },
      })
    : await prisma.appointment.findFirst({
        where: {
          clientEmail: { equals: session.email, mode: 'insensitive' },
          clientPhone: session.phone,
        },
        select: {
          id: true,
          clientName: true,
          clientEmail: true,
          clientPhone: true,
          paymentStatus: true,
          status: true,
        },
        orderBy: { createdAt: 'desc' },
      });

  if (!appointment && session.documentId) {
    const document = await prisma.clientDocument.findFirst({
      where: {
        id: session.documentId,
        clientEmail: { equals: session.email, mode: 'insensitive' },
        OR: [{ clientPhone: session.phone }, { clientPhone: '' }],
      },
      select: {
        id: true,
        clientEmail: true,
        clientPhone: true,
      },
    });

    if (document) {
      return NextResponse.json({
        authenticated: true,
        email: document.clientEmail,
        phone: session.phone || document.clientPhone,
        documentId: document.id,
      });
    }
  }

  if (!appointment) {
    return NextResponse.json({ authenticated: false });
  }

  return NextResponse.json({
    authenticated: true,
    email: appointment.clientEmail,
    phone: appointment.clientPhone,
    clientName: appointment.clientName,
    appointmentId: appointment.id,
    appointmentStatus: appointment.status,
    paymentStatus: appointment.paymentStatus,
  });
}
