import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createRedsysPayment } from '@/lib/redsys';
import { CONSULTATION_DEPOSIT_AMOUNT } from '@/lib/payments';

const PORTAL_SESSION_COOKIE = 'pv_portal_session';
const SESSION_MAX_AGE = 60 * 60 * 2;

const getBaseUrl = () =>
  process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

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

  // Generar número de pedido único para Redsys (exactamente 12 caracteres alfanuméricos)
  // Redsys requiere que empiece por dígitos (4 primeros) o que sea alfanumérico.
  const orderId = appointment.id.substring(0, 10).toUpperCase().replace(/[^A-Z0-9]/g, 'X') + 'P1';

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
      successUrl: `${getBaseUrl()}/portal?payment=success`,
      errorUrl: `${getBaseUrl()}/portal?payment=error`,
    }
  );

  const portalSession = Buffer.from(JSON.stringify({
    appointmentId: appointment.id,
    email: appointment.clientEmail,
    phone: appointment.clientPhone,
    expiresAt: Date.now() + SESSION_MAX_AGE * 1000,
  })).toString('base64url');

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
