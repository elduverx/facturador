import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const MODALITIES = ['OFFICE', 'VIDEO_CALL'] as const;

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { service: true }
    });
    
    if (!appointment) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Also fetch documents related to this client's email safely
    const [documents, matters, pendingAppointments] = await Promise.all([
      prisma.clientDocument.findMany({
        where: { clientEmail: appointment.clientEmail },
        orderBy: { createdAt: 'desc' }
      }).catch((err) => {
        console.error('Error fetching documents in portal appointment:', err);
        return [];
      }),
      prisma.matter.findMany({
        where: { clientEmail: appointment.clientEmail },
        include: {
          timeline: { where: { isPublic: true }, orderBy: { createdAt: 'desc' } }
        }
      }).catch((err) => {
        console.error('Error fetching matters in portal appointment:', err);
        return [];
      }),
      prisma.appointment.findMany({
        where: { 
          clientEmail: appointment.clientEmail,
          paymentStatus: 'PENDING',
          status: { not: 'CANCELLED' }
        },
        include: { service: true }
      }).catch((err) => {
        console.error('Error fetching pending appointments in portal appointment:', err);
        return [];
      }),
    ]);

    return NextResponse.json({
      appointment,
      documents,
      matters,
      pendingAppointments
    });
  } catch (err: any) {
    console.error('Error fetching portal appointment:', err);
    return NextResponse.json({ error: 'Server error', details: err.message }, { status: 500 });
  }
}

async function handleCancelAppointment(id: string, reason?: string) {
  const existing = await prisma.appointment.findUnique({
    where: { id },
    include: { service: true, staffUser: true }
  });

  if (!existing) {
    return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 });
  }

  if (existing.status === 'CANCELLED') {
    return NextResponse.json({ error: 'La cita ya se encuentra cancelada' }, { status: 400 });
  }

  if (existing.status === 'COMPLETED') {
    return NextResponse.json({ error: 'No es posible cancelar una cita que ya fue completada' }, { status: 400 });
  }

  const dateStr = existing.date instanceof Date 
    ? existing.date.toISOString().split('T')[0] 
    : String(existing.date).split('T')[0];
  const timeStr = existing.startTime && /^\d{2}:\d{2}$/.test(existing.startTime) ? existing.startTime : '00:00';
  const apptDateTime = new Date(`${dateStr}T${timeStr}:00`);
  const hoursUntil = (apptDateTime.getTime() - Date.now()) / (1000 * 60 * 60);

  if (hoursUntil < 24) {
    return NextResponse.json({ 
      error: 'Solo es posible cancelar la cita con al menos 24 horas de antelación.' 
    }, { status: 400 });
  }

  const cancelReasonText = reason && reason.trim() ? `Motivo: ${reason.trim()}` : 'Cancelada por el cliente desde el portal';
  const updatedNotes = existing.notes ? `${existing.notes}\n\n[${cancelReasonText}]` : `[${cancelReasonText}]`;

  const updated = await prisma.appointment.update({
    where: { id },
    data: {
      status: 'CANCELLED',
      notes: updatedNotes,
    },
    include: { service: true, staffUser: true }
  });

  try {
    const { sendEmail } = await import('@/lib/email');
    const { cancellationEmail, adminAppointmentCancelledEmail } = await import('@/lib/email-templates');
    const { formatDateES } = await import('@/lib/constants');

    const settings = await prisma.officeSettings.findUnique({ where: { id: 'default' } });
    const firmName = settings?.firmName || 'PV Abogadas';
    const dateStr = updated.date.toISOString().split('T')[0];

    const emailData = {
      clientName: updated.clientName,
      serviceName: updated.service.name,
      date: formatDateES(dateStr),
      time: updated.startTime,
      firmName,
      firmAddress: settings?.firmAddress || 'C/ de Sant Ignasi de Loiola, 21, entresuelo, Extramurs, 46008 València, Valencia',
      firmPhone: settings?.firmPhone || '',
      firmEmail: settings?.firmEmail || '',
    };

    // Notificar al cliente
    await sendEmail({
      to: updated.clientEmail,
      subject: `Cita cancelada - ${firmName}`,
      html: cancellationEmail(emailData),
    });

    // Notificar a administración y abogada
    let adminEmail = settings?.firmEmail;
    if (updated.staffUser?.loginSlug) {
      const slug = updated.staffUser.loginSlug.toUpperCase();
      const envEmail = process.env[`EMAIL_NOTIFICACIONES_${slug}`];
      if (envEmail) adminEmail = envEmail;
      else if (updated.staffUser.email) adminEmail = updated.staffUser.email;
    }

    if (adminEmail) {
      await sendEmail({
        to: adminEmail,
        subject: `Cita cancelada por cliente: ${updated.clientName} - ${updated.service.name}`,
        html: adminAppointmentCancelledEmail({
          ...emailData,
          clientEmail: updated.clientEmail,
          clientPhone: updated.clientPhone,
          clientNie: updated.clientNie || undefined,
          reason: reason?.trim() || undefined,
        }),
      });
    }
  } catch (emailErr) {
    console.error('Error sending cancellation emails:', emailErr);
  }

  return NextResponse.json({ success: true, appointment: updated });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();

    if (body?.action === 'cancel') {
      return await handleCancelAppointment(id, body?.reason);
    }

    const modality = typeof body?.modality === 'string' ? body.modality : '';
    if (!MODALITIES.includes(modality as (typeof MODALITIES)[number])) {
      return NextResponse.json({ error: 'Modalidad no valida' }, { status: 400 });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { modality },
      include: { service: true }
    });

    try {
      const { sendEmail } = await import('@/lib/email');
      const { confirmationEmail } = await import('@/lib/email-templates');
      const { formatDateES } = await import('@/lib/constants');
      
      const settings = await prisma.officeSettings.findUnique({ where: { id: 'default' } });
      const firmName = settings?.firmName || 'PV Abogadas';
      
      const emailData = {
        clientName: updated.clientName,
        serviceName: updated.service.name + (modality === 'VIDEO_CALL' ? ' (Video Llamada)' : ' (En Despacho)'),
        date: formatDateES(updated.date.toISOString().split('T')[0]),
        time: updated.startTime,
        firmName,
        firmAddress: settings?.firmAddress || 'C/ de Sant Ignasi de Loiola, 21, entresuelo, Extramurs, 46008 València, Valencia',
        firmPhone: settings?.firmPhone || '',
        firmEmail: settings?.firmEmail || '',
      };

      await sendEmail({
        to: updated.clientEmail,
        subject: `Confirmacion de cita - ${firmName}`,
        html: confirmationEmail(emailData),
      });
    } catch (emailErr) {
      console.error('Error sending confirmation email on modality save:', emailErr);
    }

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error('Error updating portal appointment:', err);
    return NextResponse.json({ error: 'Server error', details: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    let reason: string | undefined;
    try {
      const body = await request.json();
      reason = body?.reason;
    } catch {
      // Body is optional
    }
    return await handleCancelAppointment(id, reason);
  } catch (err: any) {
    console.error('Error cancelling portal appointment via DELETE:', err);
    return NextResponse.json({ error: 'Server error', details: err.message }, { status: 500 });
  }
}
