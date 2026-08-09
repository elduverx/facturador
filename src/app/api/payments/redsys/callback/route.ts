import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  isAuthorizedRedsysResponse,
  normalizeRedsysTerminal,
  parseRedsysCallbackParams,
  REDSYS_CONFIG,
  verifyRedsysSignature,
} from '@/lib/redsys';
import { CONSULTATION_DEPOSIT_AMOUNT } from '@/lib/payments';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const paramsBase64 = formData.get('Ds_MerchantParameters') as string;
    const signature = formData.get('Ds_Signature') as string;

    if (!paramsBase64 || !signature) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
    }

    if (!verifyRedsysSignature(paramsBase64, signature)) {
      return NextResponse.json({ error: 'Firma inválida' }, { status: 400 });
    }

    const params = parseRedsysCallbackParams(paramsBase64);
    const rawResponse = params.raw as Prisma.InputJsonValue;
    const amount = params.amountCents / 100;
    const attempt = await prisma.paymentAttempt.findUnique({
      where: { orderId: params.orderId },
    });

    const responseMatchesConfiguredMerchant =
      params.currency === '978' &&
      params.merchantCode === REDSYS_CONFIG.merchantCode &&
      normalizeRedsysTerminal(params.terminal) === normalizeRedsysTerminal(REDSYS_CONFIG.terminal);

    if (!attempt) {
      if (isAuthorizedRedsysResponse(params.responseCode) && responseMatchesConfiguredMerchant) {
        const document = await prisma.clientDocument.findUnique({ where: { paymentId: params.orderId } });
        if (document && document.amountDue && Math.round(document.amountDue * 100) === params.amountCents) {
          await prisma.clientDocument.update({
            where: { id: document.id },
            data: { isPaid: true },
          });
          console.info('Pago Redsys legacy de documento conciliado', {
            orderId: params.orderId,
            documentId: document.id,
            amountCents: params.amountCents,
          });
          return new Response('OK', { status: 200 });
        }

        const appointment = await prisma.appointment.findUnique({
          where: { paymentId: params.orderId },
        });
        if (appointment && CONSULTATION_DEPOSIT_AMOUNT * 100 === params.amountCents) {
          await prisma.appointment.update({
            where: { id: appointment.id },
            data: { paymentStatus: 'PAID', status: 'CONFIRMED' },
          });
          console.info('Pago Redsys legacy de cita conciliado', {
            orderId: params.orderId,
            appointmentId: appointment.id,
            amountCents: params.amountCents,
          });
          return new Response('OK', { status: 200 });
        }

        console.warn('Pago Redsys autorizado sin intento conciliable', {
          orderId: params.orderId,
          amountCents: params.amountCents,
          merchantCode: params.merchantCode,
          terminal: params.terminal,
        });
      } else {
        console.warn('Callback Redsys sin intento y validacion fallida', {
          orderId: params.orderId,
          responseCode: params.responseCode,
          amountCents: params.amountCents,
          currency: params.currency,
          merchantCode: params.merchantCode,
          terminal: params.terminal,
        });
      }

      return new Response('OK', { status: 200 });
    }

    const responseMatchesMerchant =
      params.currency === attempt.currency &&
      params.amountCents === attempt.amountCents &&
      params.merchantCode === REDSYS_CONFIG.merchantCode &&
      normalizeRedsysTerminal(params.terminal) === normalizeRedsysTerminal(REDSYS_CONFIG.terminal);

    // Redsys: 0000 a 0099 indica pago autorizado
    if (isAuthorizedRedsysResponse(params.responseCode) && responseMatchesMerchant) {
      if (attempt.status === 'PAID') return new Response('OK', { status: 200 });

      if (attempt.targetType === 'DOCUMENT') {
        await prisma.$transaction(async (tx) => {
          const document = await tx.clientDocument.findUnique({ where: { id: attempt.targetId } });
          if (!document || document.isPaid) {
            await tx.paymentAttempt.update({
              where: { id: attempt.id },
              data: { status: 'PAID', rawResponse },
            });
            return;
          }

          if (!document.amountDue || Math.round(document.amountDue * 100) !== attempt.amountCents) {
            await tx.paymentAttempt.update({
              where: { id: attempt.id },
              data: { status: 'FAILED', rawResponse },
            });
            return;
          }

          await tx.clientDocument.update({
            where: { id: document.id },
            data: { isPaid: true, paymentId: attempt.orderId },
          });
          await tx.paymentAttempt.update({
            where: { id: attempt.id },
            data: { status: 'PAID', rawResponse },
          });
        });

        return new Response('OK', { status: 200 });

      } else if (attempt.targetType === 'PAYMENT_LINK') {
        const paymentLink = await prisma.paymentLink.findUnique({
          where: { id: attempt.targetId }
        });

        if (!paymentLink) return new Response('OK', { status: 200 });
        if (paymentLink.status === 'PAID') return new Response('OK', { status: 200 });

        if (attempt.amountCents !== Math.round(paymentLink.amount * 100)) {
          await prisma.paymentAttempt.update({
            where: { id: attempt.id },
            data: { status: 'FAILED', rawResponse },
          });
          return new Response('OK', { status: 200 });
        }

        await prisma.$transaction([
          prisma.paymentLink.update({
            where: { id: paymentLink.id },
            data: { status: 'PAID', paymentId: attempt.orderId },
          }),
          prisma.paymentAttempt.update({
            where: { id: attempt.id },
            data: { status: 'PAID', rawResponse },
          }),
        ]);

        return new Response('OK', { status: 200 });
      } else {
        const appointment = await prisma.appointment.findUnique({
          where: { id: attempt.targetId },
          include: { service: true }
        });

        if (!appointment) return new Response('OK', { status: 200 });
        if (appointment.paymentStatus === 'PAID') return new Response('OK', { status: 200 });

        if (attempt.amountCents !== CONSULTATION_DEPOSIT_AMOUNT * 100) {
          await prisma.paymentAttempt.update({
            where: { id: attempt.id },
            data: { status: 'FAILED', rawResponse },
          });
          return new Response('OK', { status: 200 });
        }

        await prisma.$transaction([
          prisma.appointment.update({
            where: { id: appointment.id },
            data: { paymentStatus: 'PAID', status: 'CONFIRMED', paymentId: attempt.orderId },
          }),
          prisma.paymentAttempt.update({
            where: { id: attempt.id },
            data: { status: 'PAID', rawResponse },
          }),
        ]);

        try {
          const { sendEmail } = await import('@/lib/email');
          const { paymentConfirmationEmail, confirmationEmail } = await import('@/lib/email-templates');
          const { formatDateES } = await import('@/lib/constants');
          
          const settings = await prisma.officeSettings.findUnique({ where: { id: 'default' } });
          const firmName = settings?.firmName || 'PV Abogadas';
          
          const emailData = {
            clientName: appointment.clientName,
            serviceName: appointment.service.name,
            date: formatDateES(appointment.date.toISOString().split('T')[0]),
            time: appointment.startTime,
            firmName,
            firmAddress: settings?.firmAddress || 'C/ de Sant Ignasi de Loiola, 21, entresuelo, Extramurs, 46008 València, Valencia',
            firmPhone: settings?.firmPhone || '',
            firmEmail: settings?.firmEmail || '',
            amount
          };

          // 1. Send the Invoice/Payment receipt
          await sendEmail({
            to: appointment.clientEmail,
            subject: `Factura de Pago - ${firmName}`,
            html: paymentConfirmationEmail(emailData),
          });

          // 2. Send the Video/Office Appointment Confirmation
          await sendEmail({
            to: appointment.clientEmail,
            subject: `Confirmación de Cita - ${firmName}`,
            html: confirmationEmail(emailData),
          });
        } catch (err) {
          console.error('Error enviando email de confirmacion de pago:', err);
        }

        return new Response('OK', { status: 200 });
      }
    } else {
      console.warn('Callback Redsys rechazado por validacion de intento', {
        orderId: params.orderId,
        responseCode: params.responseCode,
        receivedAmountCents: params.amountCents,
        expectedAmountCents: attempt.amountCents,
        receivedCurrency: params.currency,
        expectedCurrency: attempt.currency,
        receivedMerchantCode: params.merchantCode,
        expectedMerchantCode: REDSYS_CONFIG.merchantCode,
        receivedTerminal: params.terminal,
        expectedTerminal: REDSYS_CONFIG.terminal,
      });

      await prisma.paymentAttempt.update({
        where: { id: attempt.id },
        data: { status: 'FAILED', rawResponse },
      });

      if (attempt.targetType === 'APPOINTMENT') {
        await prisma.appointment.updateMany({
          where: { id: attempt.targetId, paymentStatus: { not: 'PAID' } },
          data: { paymentStatus: 'FAILED' },
        });
      }
      return new Response('Payment failed', { status: 200 });
    }
  } catch (error) {
    console.error('Error in Redsys callback:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
