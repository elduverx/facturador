import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CONSULTATION_DEPOSIT_AMOUNT } from '@/lib/payments';
import { getAdminAppointmentScope } from '@/lib/admin-scope';
import { getAdminSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    // 1. Get Appointments (paid via Redsys)
    const session = await getAdminSession();
    const appointmentScope = await getAdminAppointmentScope();
    const scopedClientEmails = session?.userId && session.role !== 'OWNER'
      ? (await prisma.appointment.findMany({
          where: appointmentScope,
          distinct: ['clientEmail'],
          select: { clientEmail: true },
        })).map((appointment) => appointment.clientEmail)
      : null;

    const appointments = await prisma.appointment.findMany({
      where: { AND: [{ paymentStatus: 'PAID' }, appointmentScope] },
      include: { service: true },
      orderBy: { updatedAt: 'desc' },
      take: 200,
    });

    // 2. Get Documents (paid via Redsys)
    const documents = await prisma.clientDocument.findMany({
      where: {
        isPaid: true,
        ...(scopedClientEmails ? { clientEmail: { in: scopedClientEmails } } : {}),
      },
      include: { matter: true },
      orderBy: { updatedAt: 'desc' },
      take: 200,
    });

    // 3. Get Billing Documents (Invoices, Provisions with paid amount)
    const invoices = await prisma.billingDocument.findMany({
      where: { paidAmount: { gt: 0 } },
      include: { matter: true },
      orderBy: { updatedAt: 'desc' },
      take: 200,
    });

    const incomeItems = [];

    for (const appt of appointments) {
      incomeItems.push({
        id: appt.id,
        type: 'APPOINTMENT',
        date: appt.updatedAt.toISOString(),
        amount: CONSULTATION_DEPOSIT_AMOUNT,
        concept: `Cita: ${appt.service.name}`,
        clientName: appt.clientName,
        clientEmail: appt.clientEmail,
        paymentMethod: 'REDSYS',
      });
    }

    for (const doc of documents) {
      incomeItems.push({
        id: doc.id,
        type: 'DOCUMENT',
        date: doc.updatedAt.toISOString(),
        amount: doc.amountDue || 0,
        concept: `Documento: ${doc.fileName}`,
        clientName: doc.matter?.clientName || doc.clientEmail,
        clientEmail: doc.clientEmail,
        paymentMethod: 'REDSYS',
      });
    }

    for (const inv of invoices) {
      incomeItems.push({
        id: inv.id,
        type: 'INVOICE',
        date: inv.updatedAt.toISOString(),
        amount: inv.paidAmount,
        concept: `Facturación: ${inv.concept} (${inv.number || 'Sin Nro'})`,
        clientName: inv.matter?.clientName || 'Cliente',
        clientEmail: inv.matter?.clientEmail || '',
        paymentMethod: 'TRANSFER/OTHER',
      });
    }

    // Sort by date desc
    incomeItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json(incomeItems);
  } catch (error) {
    console.error('Error fetching income:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
