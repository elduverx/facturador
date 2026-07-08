import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const settings = await prisma.officeSettings.findUnique({
    where: { id: 'default' },
  });

  if (!settings) {
    const created = await prisma.officeSettings.create({ data: { id: 'default' } });
    return NextResponse.json(created);
  }

  return NextResponse.json(settings);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      firmName,
      firmEmail,
      firmPhone,
      firmAddress,
      startHour,
      endHour,
      slotDurationMin,
      lunchStartHour,
      lunchEndHour,
      workDays,
      maxAppointmentsPerDay,
    } = body;

    const data: Record<string, unknown> = {};
    if (firmName !== undefined) data.firmName = firmName;
    if (firmEmail !== undefined) data.firmEmail = firmEmail;
    if (firmPhone !== undefined) data.firmPhone = firmPhone;
    if (firmAddress !== undefined) data.firmAddress = firmAddress;
    if (startHour !== undefined) data.startHour = startHour;
    if (endHour !== undefined) data.endHour = endHour;
    if (slotDurationMin !== undefined) data.slotDurationMin = slotDurationMin;
    if (lunchStartHour !== undefined) data.lunchStartHour = lunchStartHour;
    if (lunchEndHour !== undefined) data.lunchEndHour = lunchEndHour;
    if (workDays !== undefined) data.workDays = workDays;
    if (maxAppointmentsPerDay !== undefined) data.maxAppointmentsPerDay = maxAppointmentsPerDay;

    const settings = await prisma.officeSettings.upsert({
      where: { id: 'default' },
      update: data,
      create: { id: 'default', ...data },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error actualizando configuracion:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
