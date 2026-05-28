import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateBillingTotal } from '@/lib/legal';

const TYPES = ['INVOICE', 'PROVISION', 'EXPENSE', 'ENGAGEMENT_LETTER', 'QUOTE'] as const;
const STATUSES = ['DRAFT', 'SENT', 'ACCEPTED', 'PARTIALLY_PAID', 'PAID', 'CANCELLED'] as const;

const normalizeInstallments = (value: unknown) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item, index) => ({
      label: typeof item?.label === 'string' && item.label.trim() ? item.label.trim() : `Plazo ${index + 1}`,
      amount: Number(item?.amount || 0),
      dueAt: typeof item?.dueAt === 'string' && item.dueAt ? new Date(item.dueAt) : null,
    }))
    .filter((item) => item.amount > 0 && item.dueAt && !Number.isNaN(item.dueAt.getTime())) as {
    label: string;
    amount: number;
    dueAt: Date;
  }[];
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const matterId = searchParams.get('matterId') || undefined;
  const status = searchParams.get('status') || undefined;

  const where: Record<string, unknown> = {};
  if (matterId) where.matterId = matterId;
  if (status && STATUSES.includes(status as (typeof STATUSES)[number])) where.status = status;

  const documents = await prisma.billingDocument.findMany({
    where,
    include: {
      matter: { select: { reference: true, title: true, clientName: true, clientEmail: true } },
      installments: { orderBy: { dueAt: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return NextResponse.json(documents);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const matterId = typeof body?.matterId === 'string' && body.matterId ? body.matterId : null;
    const type = TYPES.includes(body?.type) ? body.type : 'INVOICE';
    const status = STATUSES.includes(body?.status) ? body.status : 'DRAFT';
    const concept = typeof body?.concept === 'string' ? body.concept.trim() : '';
    const baseAmount = Number(body?.baseAmount || 0);
    const vatPercent = Number(body?.vatPercent ?? 21);
    const irpfPercent = Number(body?.irpfPercent || 0);
    const expenseAmount = Number(body?.expenseAmount || 0);
    const totalAmount = calculateBillingTotal({ baseAmount, vatPercent, irpfPercent, expenseAmount });
    const installments = normalizeInstallments(body?.installments);

    if (!concept) {
      return NextResponse.json({ error: 'Concepto obligatorio' }, { status: 400 });
    }

    const document = await prisma.billingDocument.create({
      data: {
        matterId,
        type,
        status,
        number: typeof body?.number === 'string' && body.number.trim() ? body.number.trim() : null,
        concept,
        baseAmount,
        vatPercent,
        irpfPercent,
        expenseAmount,
        totalAmount,
        paidAmount: Number(body?.paidAmount || 0),
        dueAt: typeof body?.dueAt === 'string' && body.dueAt ? new Date(body.dueAt) : null,
        notes: typeof body?.notes === 'string' && body.notes.trim() ? body.notes.trim() : null,
        installments: installments.length ? { create: installments } : undefined,
      },
      include: { installments: true, matter: true },
    });

    if (matterId) {
      await prisma.matterTimeline.create({
        data: {
          matterId,
          type: 'PAYMENT',
          title: 'Documento financiero creado',
          content: `${type}: ${concept} (${totalAmount.toFixed(2)} EUR)`,
          actor: 'Admin',
        },
      });
    }

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error('Error creando documento financiero:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
