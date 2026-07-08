import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { amountToCents, createRedsysOrderId, createRedsysPayment } from '@/lib/redsys';
import { CONSULTATION_DEPOSIT_AMOUNT } from '@/lib/payments';
import { createPortalSessionCookie } from '@/lib/portal-session';

const PORTAL_SESSION_COOKIE = 'pv_portal_session';
const SESSION_MAX_AGE = 60 * 60 * 2;

const getBaseUrl = () =>
  process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function createPaymentAttempt(targetId: string, amount: number) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const orderId = createRedsysOrderId();
    try {
      await prisma.paymentAttempt.create({
        data: {
          orderId,
          targetType: 'APPOINTMENT',
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

  if (!appointmentId) {
    return NextResponse.json({ error: 'Falta appointmentId' }, { status: 400 });
  }

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

  const amount = CONSULTATION_DEPOSIT_AMOUNT;

  const orderId = await createPaymentAttempt(appointment.id, amount);

  // Guardar el orderId en la cita para poder recuperarla en el callback
  await prisma.appointment.update({
    where: { id: appointment.id },
    data: { paymentId: orderId },
  });

  const paymentData = createRedsysPayment(
    orderId,
    amount,
    `Anticipo consulta: ${appointment.service.name}`,
    {
      successUrl: `${getBaseUrl()}/portal?payment=success&appointmentId=${appointment.id}`,
      errorUrl: `${getBaseUrl()}/portal?payment=error&appointmentId=${appointment.id}`,
    }
  );

  const portalSession = await createPortalSessionCookie({
    appointmentId: appointment.id,
    email: appointment.clientEmail,
    phone: appointment.clientPhone,
  });

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
