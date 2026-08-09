import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isValidEmail, isValidPhone, normalizeEmail, normalizePhone } from '@/lib/validation';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { clientName, clientEmail, clientPhone, concept, amount } = body;

    const normalizedEmail = normalizeEmail(clientEmail);
    const normalizedPhone = normalizePhone(clientPhone);

    if (!clientName || !normalizedEmail || !normalizedPhone || !concept || typeof amount !== 'number') {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    if (!isValidEmail(normalizedEmail)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    }
    
    if (!isValidPhone(normalizedPhone)) {
      return NextResponse.json({ error: 'Teléfono inválido' }, { status: 400 });
    }

    const currentYear = new Date().getFullYear();
    const countThisYear = await prisma.paymentLink.count({
      where: {
        createdAt: {
          gte: new Date(`${currentYear}-01-01T00:00:00.000Z`),
          lt: new Date(`${currentYear + 1}-01-01T00:00:00.000Z`)
        }
      }
    });
    
    const autoReference = `FAC-${currentYear}-${String(countThisYear + 1).padStart(4, '0')}`;

    const paymentLink = await prisma.paymentLink.create({
      data: {
        clientName,
        clientEmail: normalizedEmail,
        clientPhone: normalizedPhone,
        concept,
        amount,
        reference: autoReference,
        status: 'PENDING',
      },
    });

    return NextResponse.json(paymentLink);
  } catch (err: any) {
    console.error('Error creating payment link:', err);
    return NextResponse.json({ error: 'Error del servidor', details: err.message }, { status: 500 });
  }
}
