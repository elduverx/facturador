import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizeEmail, normalizeNie, normalizePhone } from '@/lib/validation';

const MATTER_STATUSES = ['INITIAL', 'IN_PROGRESS', 'WAITING_ADMIN', 'RESOLVED', 'ARCHIVED'] as const;
const MATTER_PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'CRITICAL'] as const;

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const matter = await prisma.matter.findUnique({
    where: { id },
    include: {
      documents: { orderBy: { createdAt: 'desc' } },
      deadlines: { orderBy: { dueAt: 'asc' } },
      billingDocuments: { include: { installments: { orderBy: { dueAt: 'asc' } } }, orderBy: { createdAt: 'desc' } },
      communications: { orderBy: { sentAt: 'desc' }, take: 50 },
      timeline: { orderBy: { createdAt: 'desc' } },
    },
  });

  if (!matter) {
    return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 });
  }

  return NextResponse.json(matter);
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data: Record<string, unknown> = {};

    if (typeof body?.clientName === 'string' && body.clientName.trim()) data.clientName = body.clientName.trim();
    if (typeof body?.clientEmail === 'string' && body.clientEmail.trim()) data.clientEmail = normalizeEmail(body.clientEmail);
    if (typeof body?.clientPhone === 'string') data.clientPhone = normalizePhone(body.clientPhone);
    if (Object.prototype.hasOwnProperty.call(body, 'clientNie')) {
      data.clientNie = typeof body.clientNie === 'string' && body.clientNie.trim() ? normalizeNie(body.clientNie) : null;
    }
    if (typeof body?.title === 'string' && body.title.trim()) data.title = body.title.trim();
    if (typeof body?.procedureType === 'string' && body.procedureType.trim()) data.procedureType = body.procedureType.trim();
    if (MATTER_STATUSES.includes(body?.status)) {
      data.status = body.status;
      data.closedAt = ['RESOLVED', 'ARCHIVED'].includes(body.status) ? new Date() : null;
    }
    if (MATTER_PRIORITIES.includes(body?.priority)) data.priority = body.priority;
    if (Object.prototype.hasOwnProperty.call(body, 'responsible')) {
      data.responsible = typeof body.responsible === 'string' && body.responsible.trim() ? body.responsible.trim() : null;
    }
    if (Object.prototype.hasOwnProperty.call(body, 'summary')) {
      data.summary = typeof body.summary === 'string' && body.summary.trim() ? body.summary.trim() : null;
    }
    if (Object.prototype.hasOwnProperty.call(body, 'riskNotes')) {
      data.riskNotes = typeof body.riskNotes === 'string' && body.riskNotes.trim() ? body.riskNotes.trim() : null;
    }
    if (Object.prototype.hasOwnProperty.call(body, 'nextActionAt')) {
      data.nextActionAt = typeof body.nextActionAt === 'string' && body.nextActionAt ? new Date(body.nextActionAt) : null;
    }

    const updated = await prisma.matter.update({
      where: { id },
      data: {
        ...data,
        timeline: body?.timelineTitle
          ? {
              create: {
                type: 'NOTE',
                title: String(body.timelineTitle).trim(),
                content: typeof body.timelineContent === 'string' ? body.timelineContent.trim() : null,
                actor: 'Admin',
                isPublic: Boolean(body.timelinePublic),
              },
            }
          : undefined,
      },
      include: { timeline: { orderBy: { createdAt: 'desc' } }, deadlines: true, billingDocuments: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error actualizando expediente:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
