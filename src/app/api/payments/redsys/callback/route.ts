import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyRedsysSignature } from '@/lib/redsys';

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

    const params = JSON.parse(Buffer.from(paramsBase64, 'base64').toString('utf8'));
    const responseCode = parseInt(params.Ds_Response, 10);
    const orderId = params.Ds_Order;

    // Redsys: 0000 a 0099 indica pago autorizado
    if (responseCode >= 0 && responseCode <= 99) {
      await prisma.appointment.updateMany({
        where: { paymentId: orderId },
        data: { paymentStatus: 'PAID', status: 'CONFIRMED' },
      });
      return new Response('OK', { status: 200 });
    } else {
      await prisma.appointment.updateMany({
        where: { paymentId: orderId },
        data: { paymentStatus: 'FAILED' },
      });
      return new Response('Payment failed', { status: 200 }); // Redsys prefiere 200 incluso si falla el pago
    }
  } catch (error) {
    console.error('Error in Redsys callback:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
