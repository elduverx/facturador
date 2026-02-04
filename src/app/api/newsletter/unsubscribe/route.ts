import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const htmlResponse = (message: string) => `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Newsletter</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f5f5f4; margin: 0; padding: 40px 16px; }
    .card { max-width: 420px; margin: 0 auto; background: white; border-radius: 12px; padding: 24px; border: 1px solid #e7e5e4; }
    .title { font-size: 18px; font-weight: 600; margin-bottom: 8px; }
    .text { font-size: 14px; color: #57534e; }
    a { color: #0f766e; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="card">
    <div class="title">Newsletter</div>
    <p class="text">${message}</p>
    <p class="text"><a href="/">Volver al inicio</a></p>
  </div>
</body>
</html>`;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return new NextResponse(htmlResponse('Token invalido.'), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const subscriber = await prisma.newsletterSubscriber.findUnique({ where: { token } });
  if (!subscriber) {
    return new NextResponse(htmlResponse('No encontramos tu suscripcion.'), {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  await prisma.newsletterSubscriber.update({
    where: { token },
    data: {
      status: 'UNSUBSCRIBED',
      unsubscribedAt: new Date(),
    },
  });

  return new NextResponse(htmlResponse('Te hemos dado de baja correctamente.'), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
