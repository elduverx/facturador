import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { addLegalDays, daysUntil } from '@/lib/legal';

const DEADLINE_STATUSES = ['OPEN', 'COMPLETED', 'OVERDUE', 'CANCELLED'] as const;
const DEADLINE_KINDS = ['CALENDAR_DAYS', 'BUSINESS_DAYS'] as const;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const matterId = searchParams.get('matterId') || undefined;
  const status = searchParams.get('status') || 'OPEN';
  const horizon = Number(searchParams.get('horizon') || '30');
  const now = new Date();
  const horizonDate = new Date(now);
  horizonDate.setDate(horizonDate.getDate() + horizon);

  const where: Record<string, unknown> = {};
  if (matterId) where.matterId = matterId;
  if (DEADLINE_STATUSES.includes(status as (typeof DEADLINE_STATUSES)[number])) where.status = status;
  if (!matterId) where.dueAt = { lte: horizonDate };

  const deadlines = await prisma.legalDeadline.findMany({
    where,
    include: { matter: { select: { reference: true, title: true, clientName: true, clientEmail: true, priority: true } } },
    orderBy: { dueAt: 'asc' },
    take: 100,
  });

  return NextResponse.json(deadlines.map((deadline) => ({ ...deadline, daysLeft: daysUntil(deadline.dueAt, now) })));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const matterId = typeof body?.matterId === 'string' ? body.matterId : '';
    const title = typeof body?.title === 'string' ? body.title.trim() : '';
    const description = typeof body?.description === 'string' && body.description.trim() ? body.description.trim() : null;
    const kind = DEADLINE_KINDS.includes(body?.kind) ? body.kind : 'BUSINESS_DAYS';
    const alertDays = Number.isFinite(Number(body?.alertDays)) ? Math.max(0, Number(body.alertDays)) : 3;
    const dueAt =
      typeof body?.dueAt === 'string' && body.dueAt
        ? new Date(body.dueAt)
        : addLegalDays(new Date(), Number(body?.daysFromNow || 0), kind);

    if (!matterId || !title || Number.isNaN(dueAt.getTime())) {
      return NextResponse.json({ error: 'Expediente, titulo y fecha son obligatorios' }, { status: 400 });
    }

    const deadline = await prisma.legalDeadline.create({
      data: {
        matterId,
        title,
        description,
        dueAt,
        kind,
        alertDays,
      },
      include: { matter: { select: { reference: true, title: true, clientName: true } } },
    });

    await prisma.matterTimeline.create({
      data: {
        matterId,
        type: 'DEADLINE',
        title: 'Plazo registrado',
        content: `${title} vence el ${dueAt.toISOString().split('T')[0]}`,
        actor: 'Admin',
      },
    });

    return NextResponse.json(deadline, { status: 201 });
  } catch (error) {
    console.error('Error creando plazo:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
