import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { cancellationEmail, statusChangeEmail } from '@/lib/email-templates';
import { formatDateES } from '@/lib/constants';

type RouteParams = { params: Promise<{ id: string }> };

// PATCH - Update appointment (admin)
export async function PATCH(request: Request, { params }: RouteParams) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { status, adminNotes, date, startTime } = body;

    const existing = await prisma.appointment.findUnique({
      where: { id },
      include: { service: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;

    if (date && startTime) {
      const [h, m] = startTime.split(':').map(Number);
      const endMinutes = h * 60 + m + existing.service.durationMin;
      const endTime = `${Math.floor(endMinutes / 60).toString().padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`;
      updateData.date = new Date(date + 'T00:00:00.000Z');
      updateData.startTime = startTime;
      updateData.endTime = endTime;
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: updateData,
      include: { service: true },
    });

    // Send email on status change
    if (status && status !== existing.status) {
      const settings = await prisma.officeSettings.findUnique({ where: { id: 'default' } });
      const dateStr = updated.date.toISOString().split('T')[0];
      const emailData = {
        clientName: updated.clientName,
        serviceName: updated.service.name,
        date: formatDateES(dateStr),
        time: updated.startTime,
        firmName: settings?.firmName || 'Consultorio de Extranjeria',
        firmAddress: settings?.firmAddress || '',
        firmPhone: settings?.firmPhone || '',
        firmEmail: settings?.firmEmail || '',
      };

      if (status === 'CANCELLED') {
        sendEmail({
          to: updated.clientEmail,
          subject: `Cita cancelada - ${emailData.firmName}`,
          html: cancellationEmail(emailData),
        }).catch(console.error);
      } else if (['CONFIRMED', 'COMPLETED', 'NO_SHOW'].includes(status)) {
        sendEmail({
          to: updated.clientEmail,
          subject: `Actualizacion de cita - ${emailData.firmName}`,
          html: statusChangeEmail(emailData, status),
        }).catch(console.error);
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error actualizando cita:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// DELETE - Cancel appointment (admin)
export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id } = await params;

  try {
    const existing = await prisma.appointment.findUnique({
      where: { id },
      include: { service: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: { service: true },
    });

    const settings = await prisma.officeSettings.findUnique({ where: { id: 'default' } });
    const dateStr = updated.date.toISOString().split('T')[0];

    sendEmail({
      to: updated.clientEmail,
      subject: `Cita cancelada - ${settings?.firmName || 'Consultorio de Extranjeria'}`,
      html: cancellationEmail({
        clientName: updated.clientName,
        serviceName: updated.service.name,
        date: formatDateES(dateStr),
        time: updated.startTime,
        firmName: settings?.firmName || 'Consultorio de Extranjeria',
        firmAddress: settings?.firmAddress || '',
        firmPhone: settings?.firmPhone || '',
        firmEmail: settings?.firmEmail || '',
      }),
    }).catch(console.error);

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error cancelando cita:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
