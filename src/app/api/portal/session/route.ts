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

  const hasMatchingNie = await prisma.appointment.findFirst({
    where: {
      clientEmail: { equals: session.email, mode: 'insensitive' },
      clientNie: { equals: session.nie, mode: 'insensitive' }
    }
  }) || await prisma.matter.findFirst({
    where: {
      clientEmail: { equals: session.email, mode: 'insensitive' },
      clientNie: { equals: session.nie, mode: 'insensitive' }
    }
  });

  if (!hasMatchingNie) {
    // Intentar buscar sin case sensitive y quitando espacios extras por si acaso
    const allAppts = await prisma.appointment.findMany({ where: { clientEmail: { equals: session.email, mode: 'insensitive' } } });
    const allMatters = await prisma.matter.findMany({ where: { clientEmail: { equals: session.email, mode: 'insensitive' } } });
    
    const matchFound = 
      allAppts.some(a => a.clientNie && a.clientNie.trim().toUpperCase().replace(/\s+/g, '') === session.nie) ||
      allMatters.some(m => m.clientNie && m.clientNie.trim().toUpperCase().replace(/\s+/g, '') === session.nie);

    if (!matchFound) {
      return NextResponse.json({ authenticated: false });
    }
  }

  return NextResponse.json({
    authenticated: true,
    email: session.email,
    nie: session.nie,
    appointmentId: session.appointmentId,
    documentId: session.documentId,
  });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(PORTAL_SESSION_COOKIE);
  return NextResponse.json({ success: true });
}
