import { NextResponse } from 'next/server';
import { getAvailableSlots } from '@/lib/slots';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const serviceId = searchParams.get('serviceId');
  const lawyerId = searchParams.get('lawyerId');

  if (!date || !serviceId) {
    return NextResponse.json(
      { error: 'Parametros date y serviceId requeridos' },
      { status: 400 }
    );
  }

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: 'Formato de fecha invalido (YYYY-MM-DD)' },
      { status: 400 }
    );
  }

  const staff = lawyerId
    ? await import('@/lib/prisma').then(({ prisma }) => prisma.staffUser.findFirst({
        where: { loginSlug: lawyerId, active: true },
        select: { id: true },
      }))
    : null;

  const slots = await getAvailableSlots(date, serviceId, staff?.id);

  const prisma = await import('@/lib/prisma').then(m => m.prisma);
  const startOfDay = new Date(date + 'T00:00:00.000Z');
  const daySchedule = await prisma.daySchedule.findFirst({
    where: { date: startOfDay }
  });

  const isAugust = date.split('-')[1] === '08';
  let allowedModality = isAugust ? 'VIDEO_CALL' : null;
  if (daySchedule?.allowedModality) {
    allowedModality = daySchedule.allowedModality;
  }

  return NextResponse.json({ slots, allowedModality });
}
