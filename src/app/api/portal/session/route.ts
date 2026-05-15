import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const PORTAL_SESSION_COOKIE = 'pv_portal_session';

type PortalSession = {
  appointmentId: string;
  email: string;
  phone: string;
  expiresAt: number;
};

const parseSession = (value: string): PortalSession | null => {
  try {
    const decoded = Buffer.from(value, 'base64url').toString('utf8');
    const session = JSON.parse(decoded) as Partial<PortalSession>;
    if (!session.appointmentId || !session.email || !session.phone || !session.expiresAt) return null;
    if (Date.now() > session.expiresAt) return null;
    return session as PortalSession;
  } catch {
    return null;
  }
};

export async function GET() {
  const cookieStore = await cookies();
  const rawSession = cookieStore.get(PORTAL_SESSION_COOKIE)?.value;
  if (!rawSession) {
    return NextResponse.json({ authenticated: false });
  }

  const session = parseSession(rawSession);
  if (!session) {
    return NextResponse.json({ authenticated: false });
  }

  const appointment = await prisma.appointment.findFirst({
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
  });

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
