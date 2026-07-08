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

    // Also fetch documents related to this client's email
    const documents = await prisma.clientDocument.findMany({
      where: { clientEmail: appointment.clientEmail },
      orderBy: { createdAt: 'desc' }
    });

    const matters = await prisma.matter.findMany({
      where: { clientEmail: appointment.clientEmail },
      include: {
        timeline: { where: { isPublic: true }, orderBy: { createdAt: 'desc' } }
      }
    });

    // Also fetch pending payments if any
    const pendingAppointments = await prisma.appointment.findMany({
      where: { 
        clientEmail: appointment.clientEmail,
        paymentStatus: 'PENDING',
        status: { not: 'CANCELLED' }
      },
      include: { service: true }
    });

    return NextResponse.json({
      appointment,
      documents,
      matters,
      pendingAppointments
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
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
      const firmName = settings?.firmName || 'Consultorio de Extranjería';
      
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
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
