import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateBillingTotal } from '@/lib/legal';

const STATUSES = ['DRAFT', 'SENT', 'ACCEPTED', 'PARTIALLY_PAID', 'PAID', 'CANCELLED'] as const;

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const current = await prisma.billingDocument.findUnique({ where: { id } });
    if (!current) {
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });
    }

    const body = await request.json();
    const baseAmount = body?.baseAmount === undefined ? current.baseAmount : Number(body.baseAmount || 0);
    const vatPercent = body?.vatPercent === undefined ? current.vatPercent : Number(body.vatPercent || 0);
    const irpfPercent = body?.irpfPercent === undefined ? current.irpfPercent : Number(body.irpfPercent || 0);
    const expenseAmount = body?.expenseAmount === undefined ? current.expenseAmount : Number(body.expenseAmount || 0);

    const data: Record<string, unknown> = {
      baseAmount,
      vatPercent,
      irpfPercent,
      expenseAmount,
      totalAmount: calculateBillingTotal({ baseAmount, vatPercent, irpfPercent, expenseAmount }),
    };

    if (typeof body?.concept === 'string' && body.concept.trim()) data.concept = body.concept.trim();
    if (STATUSES.includes(body?.status)) data.status = body.status;
    if (Object.prototype.hasOwnProperty.call(body, 'paidAmount')) data.paidAmount = Number(body.paidAmount || 0);
    if (Object.prototype.hasOwnProperty.call(body, 'number')) data.number = body.number ? String(body.number).trim() : null;
    if (Object.prototype.hasOwnProperty.call(body, 'notes')) data.notes = body.notes ? String(body.notes).trim() : null;
    if (Object.prototype.hasOwnProperty.call(body, 'dueAt')) data.dueAt = body.dueAt ? new Date(body.dueAt) : null;

    const updated = await prisma.billingDocument.update({
      where: { id },
      data,
      include: { installments: true },
    });

    if (updated.matterId) {
      await prisma.matterTimeline.create({
        data: {
          matterId: updated.matterId,
          type: 'PAYMENT',
          title: 'Documento financiero actualizado',
          content: `${updated.concept}: ${updated.status}`,
          actor: 'Admin',
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error actualizando documento financiero:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
