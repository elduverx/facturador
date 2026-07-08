import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { reminderEmail } from '@/lib/email-templates';
import { formatDateES } from '@/lib/constants';

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: RouteParams) {
  const { id } = await params;

  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { service: true },
    });

    if (!appointment) {
      return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 });
    }

    if (!['PENDING', 'CONFIRMED'].includes(appointment.status)) {
      return NextResponse.json({ error: 'Solo se pueden enviar recordatorios para citas pendientes o confirmadas' }, { status: 400 });
    }

    const settings = await prisma.officeSettings.findUnique({ where: { id: 'default' } });
    const dateStr = appointment.date.toISOString().split('T')[0];

    const emailHtml = reminderEmail({
      clientName: appointment.clientName,
      serviceName: appointment.service.name,
      date: formatDateES(dateStr),
      time: appointment.startTime,
      firmName: settings?.firmName || 'PV Abogadas',
      firmAddress: settings?.firmAddress || 'C/ de Sant Ignasi de Loiola, 21, entresuelo, Extramurs, 46008 València, Valencia',
      firmPhone: settings?.firmPhone || '',
      firmEmail: settings?.firmEmail || '',
    });

    const sent = await sendEmail({
      to: appointment.clientEmail,
      subject: `Recordatorio de cita - ${settings?.firmName || 'PV Abogadas'}`,
      html: emailHtml,
    });

    if (!sent) {
      return NextResponse.json({ error: 'No se pudo enviar el email. Verifique la configuracion SMTP.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: 'Recordatorio enviado' });
  } catch (error) {
    console.error('Error enviando recordatorio:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
