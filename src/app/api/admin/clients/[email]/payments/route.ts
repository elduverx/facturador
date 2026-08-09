import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/auth';
import { normalizeEmail } from '@/lib/validation';
import { CONSULTATION_DEPOSIT_AMOUNT } from '@/lib/payments';

export async function GET(request: Request, context: { params: Promise<{ email: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { email: emailParam } = await context.params;
  const email = normalizeEmail(decodeURIComponent(emailParam));
  if (!email) {
    return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
  }

  try {
    const appointments = await prisma.appointment.findMany({
      where: { clientEmail: { equals: email, mode: 'insensitive' } },
      include: { service: true },
      orderBy: { createdAt: 'desc' },
    });

    const paymentLinks = await prisma.paymentLink.findMany({
      where: { clientEmail: { equals: email, mode: 'insensitive' } },
      orderBy: { createdAt: 'desc' },
    });

    const documents = await prisma.clientDocument.findMany({
      where: { clientEmail: { equals: email, mode: 'insensitive' } },
      include: { matter: true },
      orderBy: { createdAt: 'desc' },
    });

    const matters = await prisma.matter.findMany({
      where: { clientEmail: { equals: email, mode: 'insensitive' } },
      select: { id: true },
    });

    const invoices = await prisma.billingDocument.findMany({
      where: { matterId: { in: matters.map(m => m.id) } },
      orderBy: { createdAt: 'desc' },
    });

    const payments = [];

    for (const appt of appointments) {
      if (appt.paymentStatus !== 'PENDING' && appt.paymentStatus !== 'PAID') continue; 
      payments.push({
        id: appt.id,
        typeLabel: 'Reserva de Cita',
        concept: `Cita: ${appt.service?.name || 'Servicio'}`,
        amount: CONSULTATION_DEPOSIT_AMOUNT,
        status: appt.paymentStatus,
        date: appt.createdAt.toISOString(),
        reference: null,
      });
    }

    for (const link of paymentLinks) {
      payments.push({
        id: link.id,
        typeLabel: 'Cobro Especial',
        concept: link.concept,
        amount: link.amount,
        status: link.status,
        date: link.createdAt.toISOString(),
        reference: link.reference,
      });
    }

    for (const doc of documents) {
      if (!doc.amountDue) continue;
      payments.push({
        id: doc.id,
        typeLabel: 'Documento / Trámite',
        concept: `Documento: ${doc.fileName}`,
        amount: doc.amountDue,
        status: doc.isPaid ? 'PAID' : 'PENDING',
        date: doc.createdAt.toISOString(),
        reference: null,
      });
    }

    for (const inv of invoices) {
      payments.push({
        id: inv.id,
        typeLabel: inv.type === 'PROVISION' ? 'Provisión' : 'Factura',
        concept: inv.concept,
        amount: inv.totalAmount,
        status: inv.status,
        date: inv.createdAt.toISOString(),
        reference: inv.number,
      });
    }

    // Sort by date descending
    payments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json(payments);
  } catch (error) {
    console.error('Error fetching client payments:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
