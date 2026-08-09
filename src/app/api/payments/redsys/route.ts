import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { amountToCents, createRedsysOrderId, createRedsysPayment } from '@/lib/redsys';
import { CONSULTATION_DEPOSIT_AMOUNT } from '@/lib/payments';
import { createPortalSessionCookie } from '@/lib/portal-session';

const PORTAL_SESSION_COOKIE = 'pv_portal_session';
const SESSION_MAX_AGE = 60 * 60 * 2;

const getBaseUrl = (request: Request) => {
  const configured = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (configured) return configured.replace(/\/$/, '');
  return new URL(request.url).origin;
};

async function createPaymentAttempt(targetType: 'APPOINTMENT' | 'PAYMENT_LINK', targetId: string, amount: number) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const orderId = createRedsysOrderId();
    try {
      await prisma.paymentAttempt.create({
        data: {
          orderId,
          targetType: targetType as any,
          targetId,
          amountCents: amountToCents(amount),
        },
      });
      return orderId;
    } catch {
      // Retry on rare order collision.
    }
  }
  throw new Error('No se pudo crear un identificador de pago unico.');
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const appointmentId = searchParams.get('appointmentId');
  const paymentLinkId = searchParams.get('paymentLinkId');

  if (!appointmentId && !paymentLinkId) {
    return NextResponse.json({ error: 'Falta ID de pago' }, { status: 400 });
  }

  let orderId: string;
  let amount: number;
  let concept: string;
  let portalSessionParams: { email: string; nie: string; appointmentId?: string; };
  let successUrl: string;
  let errorUrl: string;

  if (appointmentId) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { service: true },
    });

    if (!appointment) {
      return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 });
    }

    if (appointment.paymentStatus === 'PAID') {
      return NextResponse.json({ error: 'Esta cita ya ha sido pagada' }, { status: 400 });
    }

    amount = CONSULTATION_DEPOSIT_AMOUNT;
    orderId = await createPaymentAttempt('APPOINTMENT', appointment.id, amount);
    
    await prisma.appointment.update({
      where: { id: appointment.id },
      data: { paymentId: orderId },
    });

    concept = `Anticipo consulta: ${appointment.service.name}`;
    portalSessionParams = {
      appointmentId: appointment.id,
      email: appointment.clientEmail,
      nie: appointment.clientNie || '',
    };
    successUrl = `${getBaseUrl(request)}/portal?payment=success&appointmentId=${appointment.id}`;
    errorUrl = `${getBaseUrl(request)}/portal?payment=error&appointmentId=${appointment.id}`;
  } else {
    // PaymentLink
    const paymentLink = await prisma.paymentLink.findUnique({
      where: { id: paymentLinkId! }
    });

    if (!paymentLink) {
      return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 });
    }

    if (paymentLink.status === 'PAID') {
      return NextResponse.json({ error: 'Este cobro ya ha sido pagado' }, { status: 400 });
    }

    amount = paymentLink.amount;
    orderId = await createPaymentAttempt('PAYMENT_LINK', paymentLink.id, amount);

    await prisma.paymentLink.update({
      where: { id: paymentLink.id },
      data: { paymentId: orderId },
    });

    concept = paymentLink.concept;
    portalSessionParams = {
      email: paymentLink.clientEmail,
      nie: '',
    };
    successUrl = `${getBaseUrl(request)}/portal?payment=success&paymentLinkId=${paymentLink.id}`;
    errorUrl = `${getBaseUrl(request)}/portal?payment=error&paymentLinkId=${paymentLink.id}`;
  }

  const paymentData = createRedsysPayment(
    orderId,
    amount,
    concept,
    {
      callbackUrl: `${getBaseUrl(request)}/api/payments/redsys/callback`,
      successUrl,
      errorUrl,
    }
  );

  const portalSession = await createPortalSessionCookie(portalSessionParams);

  // Devolver un formulario que se auto-envía
  const formHtml = `
    <html>
      <body onload="document.forms[0].submit()">
        <form action="${paymentData.url}" method="POST">
          <input type="hidden" name="Ds_SignatureVersion" value="${paymentData.signatureVersion}" />
          <input type="hidden" name="Ds_MerchantParameters" value="${paymentData.params}" />
          <input type="hidden" name="Ds_Signature" value="${paymentData.signature}" />
        </form>
        <p>Redirigiendo a la pasarela de pago...</p>
      </body>
    </html>
  `;

  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';

  return new Response(formHtml, {
    headers: {
      'Content-Type': 'text/html',
      'Set-Cookie': `${PORTAL_SESSION_COOKIE}=${portalSession}; Max-Age=${SESSION_MAX_AGE}; Path=/; HttpOnly; SameSite=Lax${secure}`,
    },
  });
}
