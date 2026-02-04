import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isValidEmail, normalizeEmail } from '@/lib/validation';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const emailRaw = typeof body?.email === 'string' ? body.email : '';
    const consent = body?.consent === true;
    const email = normalizeEmail(emailRaw);

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: 'Email no valido' }, { status: 400 });
    }

    if (!consent) {
      return NextResponse.json({ error: 'Debe aceptar la politica de privacidad' }, { status: 400 });
    }

    const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } });
    const token = crypto.randomUUID();
    const now = new Date();

    if (existing) {
      if (existing.status === 'SUBSCRIBED') {
        return NextResponse.json({ ok: true, message: 'Ya estas suscrito.' });
      }

      await prisma.newsletterSubscriber.update({
        where: { email },
        data: {
          status: 'SUBSCRIBED',
          token: existing.token || token,
          subscribedAt: now,
          consentAt: now,
          unsubscribedAt: null,
        },
      });

      return NextResponse.json({ ok: true, message: 'Suscripcion reactivada.' });
    }

    await prisma.newsletterSubscriber.create({
      data: {
        email,
        token,
        status: 'SUBSCRIBED',
        subscribedAt: now,
        consentAt: now,
      },
    });

    return NextResponse.json({ ok: true, message: 'Suscripcion confirmada.' }, { status: 201 });
  } catch (error) {
    console.error('Error suscribiendo newsletter:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
