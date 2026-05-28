import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateMatterReference } from '@/lib/legal';
import { isValidEmail, normalizeEmail, normalizeNie, normalizePhone } from '@/lib/validation';

const MATTER_STATUSES = ['INITIAL', 'IN_PROGRESS', 'WAITING_ADMIN', 'RESOLVED', 'ARCHIVED'] as const;
const MATTER_PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'CRITICAL'] as const;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search')?.trim();
  const status = searchParams.get('status')?.trim();
  const clientEmail = searchParams.get('clientEmail')?.trim();

  const where: Record<string, unknown> = {};

  if (status && MATTER_STATUSES.includes(status as (typeof MATTER_STATUSES)[number])) {
    where.status = status;
  }

  if (clientEmail) {
    where.clientEmail = { equals: normalizeEmail(clientEmail), mode: 'insensitive' };
  }

  if (search) {
    where.OR = [
      { reference: { contains: search, mode: 'insensitive' } },
      { title: { contains: search, mode: 'insensitive' } },
      { clientName: { contains: search, mode: 'insensitive' } },
      { clientEmail: { contains: search, mode: 'insensitive' } },
      { clientNie: { contains: search, mode: 'insensitive' } },
      { procedureType: { contains: search, mode: 'insensitive' } },
    ];
  }

  const matters = await prisma.matter.findMany({
    where,
    include: {
      deadlines: { orderBy: { dueAt: 'asc' }, take: 5 },
      billingDocuments: { orderBy: { createdAt: 'desc' }, take: 5 },
      _count: { select: { documents: true, timeline: true, deadlines: true } },
    },
    orderBy: [{ nextActionAt: 'asc' }, { createdAt: 'desc' }],
    take: 100,
  });

  return NextResponse.json(matters);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const clientName = typeof body?.clientName === 'string' ? body.clientName.trim() : '';
    const clientEmail = normalizeEmail(typeof body?.clientEmail === 'string' ? body.clientEmail : '');
    const clientPhone = normalizePhone(typeof body?.clientPhone === 'string' ? body.clientPhone : '');
    const clientNie = typeof body?.clientNie === 'string' && body.clientNie.trim() ? normalizeNie(body.clientNie) : null;
    const title = typeof body?.title === 'string' ? body.title.trim() : '';
    const procedureType = typeof body?.procedureType === 'string' ? body.procedureType.trim() : '';
    const status = MATTER_STATUSES.includes(body?.status) ? body.status : 'INITIAL';
    const priority = MATTER_PRIORITIES.includes(body?.priority) ? body.priority : 'NORMAL';
    const responsible = typeof body?.responsible === 'string' && body.responsible.trim() ? body.responsible.trim() : null;
    const summary = typeof body?.summary === 'string' && body.summary.trim() ? body.summary.trim() : null;
    const riskNotes = typeof body?.riskNotes === 'string' && body.riskNotes.trim() ? body.riskNotes.trim() : null;
    const nextActionAt = typeof body?.nextActionAt === 'string' && body.nextActionAt ? new Date(body.nextActionAt) : null;

    if (!clientName || !clientEmail || !title || !procedureType) {
      return NextResponse.json({ error: 'Cliente, email, titulo y tramite son obligatorios' }, { status: 400 });
    }
    if (!isValidEmail(clientEmail)) {
      return NextResponse.json({ error: 'Email no valido' }, { status: 400 });
    }

    const matter = await prisma.matter.create({
      data: {
        reference: generateMatterReference(),
        clientName,
        clientEmail,
        clientPhone,
        clientNie,
        title,
        procedureType,
        status,
        priority,
        responsible,
        summary,
        riskNotes,
        nextActionAt,
        timeline: {
          create: {
            type: 'STATUS_CHANGE',
            title: 'Expediente creado',
            content: `Alta del expediente ${title}`,
            actor: 'Sistema',
          },
        },
      },
      include: { timeline: true, deadlines: true, billingDocuments: true },
    });

    return NextResponse.json(matter, { status: 201 });
  } catch (error) {
    console.error('Error creando expediente:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
