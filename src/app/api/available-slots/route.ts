import { NextResponse } from 'next/server';
import { getAvailableSlots } from '@/lib/slots';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const serviceId = searchParams.get('serviceId');

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

  const slots = await getAvailableSlots(date, serviceId);
  return NextResponse.json(slots);
}
