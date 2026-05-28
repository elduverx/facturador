import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizeEmail } from '@/lib/validation';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const matterId = searchParams.get('matterId') || undefined;
  const clientEmail = searchParams.get('clientEmail') || undefined;

  const logs = await prisma.communicationLog.findMany({
    where: {
      ...(matterId ? { matterId } : {}),
      ...(clientEmail ? { clientEmail: { equals: normalizeEmail(clientEmail), mode: 'insensitive' } } : {}),
    },
    include: { matter: { select: { reference: true, title: true } } },
    orderBy: { sentAt: 'desc' },
    take: 100,
  });

  return NextResponse.json(logs);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const matterId = typeof body?.matterId === 'string' && body.matterId ? body.matterId : null;
    const clientEmail = normalizeEmail(typeof body?.clientEmail === 'string' ? body.clientEmail : '');
    const channel = typeof body?.channel === 'string' && body.channel.trim() ? body.channel.trim() : 'email';
    const subject = typeof body?.subject === 'string' && body.subject.trim() ? body.subject.trim() : null;
    const logBody = typeof body?.body === 'string' && body.body.trim() ? body.body.trim() : null;

    if (!clientEmail) {
      return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
    }

    const created = await prisma.communicationLog.create({
      data: {
        matterId,
        clientEmail,
        channel,
        subject,
        body: logBody,
        direction: typeof body?.direction === 'string' ? body.direction : 'OUTBOUND',
        status: typeof body?.status === 'string' ? body.status : 'RECORDED',
      },
    });

    if (matterId) {
      await prisma.matterTimeline.create({
        data: {
          matterId,
          type: 'EMAIL',
          title: subject || `Comunicacion ${channel}`,
          content: logBody,
          actor: 'Admin',
          isPublic: true,
        },
      });
    }

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error registrando comunicacion:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
