import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { amountToCents, createRedsysOrderId, createRedsysPayment } from '@/lib/redsys';
import { createPortalSessionCookie, parsePortalSessionCookie } from '@/lib/portal-session';
import { normalizePhone } from '@/lib/validation';

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
          targetType: 'DOCUMENT',
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
  const documentId = searchParams.get('documentId');
  const cookieStore = await cookies();
  const session = await parsePortalSessionCookie(cookieStore.get(PORTAL_SESSION_COOKIE)?.value);

  if (!documentId) {
    return NextResponse.json({ error: 'Falta documentId' }, { status: 400 });
  }

  const document = await prisma.clientDocument.findUnique({
    where: { id: documentId },
  });

  if (!document) {
    return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });
  }

  const sameEmail = session && document.clientEmail.toLowerCase() === session.email.toLowerCase();
  const samePhone = session && (document.clientPhone === '' || normalizePhone(document.clientPhone) === normalizePhone(session.phone));
  if (!sameEmail || !samePhone) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  if (document.isPaid) {
    return NextResponse.json({ error: 'Este documento ya ha sido pagado' }, { status: 400 });
  }

  if (!document.amountDue || document.amountDue <= 0) {
    return NextResponse.json({ error: 'Este documento no requiere pago' }, { status: 400 });
  }

  const amount = document.amountDue;

  const orderId = await createPaymentAttempt(document.id, amount);
  const sessionPhone = document.clientPhone || session?.phone || '';

  await prisma.clientDocument.update({
    where: { id: document.id },
    data: { paymentId: orderId },
  });

  const paymentData = createRedsysPayment(
    orderId,
    amount,
    `Pago documento: ${document.fileName}`,
    {
      successUrl: `${getBaseUrl()}/portal?payment=success&documentId=${document.id}`,
      errorUrl: `${getBaseUrl()}/portal?payment=error&documentId=${document.id}`,
    }
  );

  const portalSession = await createPortalSessionCookie({
    documentId: document.id,
    email: document.clientEmail,
    phone: sessionPhone,
  });

  const formHtml = `
    <html>
      <body onload="document.forms[0].submit()">
        <form action="${paymentData.url}" method="POST">
          <input type="hidden" name="Ds_SignatureVersion" value="${paymentData.signatureVersion}" />
          <input type="hidden" name="Ds_MerchantParameters" value="${paymentData.params}" />
          <input type="hidden" name="Ds_Signature" value="${paymentData.signature}" />
        </form>
        <p>Redirigiendo a la pasarela de pago para el documento...</p>
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
