import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { dayClosedEmail } from '@/lib/email-templates';

export async function GET() {
  const blockedDates = await prisma.blockedDate.findMany({
    orderBy: { date: 'asc' },
  });
  return NextResponse.json(blockedDates);
}

export async function POST(request: Request) {
  try {
    const { date, reason } = await request.json();

    if (!date) {
      return NextResponse.json({ error: 'Fecha requerida' }, { status: 400 });
    }

    const startOfDay = new Date(date + 'T00:00:00.000Z');
    const endOfDay = new Date(date + 'T23:59:59.999Z');

    const blocked = await prisma.blockedDate.create({
      data: {
        date: startOfDay,
        reason: reason || null,
      },
    });

    // Find all active appointments for this date
    const appointmentsToCancel = await prisma.appointment.findMany({
      where: {
        date: { gte: startOfDay, lte: endOfDay },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      include: { service: true },
    });

    if (appointmentsToCancel.length > 0) {
      // Get firm settings for the email
      const settings = await prisma.officeSettings.findUnique({
        where: { id: 'default' },
      });

      const firmName = settings?.firmName || 'Nuestra Oficina';
      const firmAddress = settings?.firmAddress || '';
      const firmPhone = settings?.firmPhone || '';
      const firmEmail = settings?.firmEmail || '';

      // Format date for email
      const [year, month, day] = date.split('-');
      const formattedDate = `${day}/${month}/${year}`;

      // Update statuses to CANCELLED
      await prisma.appointment.updateMany({
        where: {
          id: { in: appointmentsToCancel.map(a => a.id) },
        },
        data: {
          status: 'CANCELLED',
          adminNotes: reason ? `Cancelada por cierre de oficina: ${reason}` : 'Cancelada por cierre de oficina',
        },
      });

      // Send emails
      for (const appt of appointmentsToCancel) {
        if (!appt.clientEmail) continue;

        const emailData = {
          clientName: appt.clientName,
          serviceName: appt.service.name,
          date: formattedDate,
          time: appt.startTime,
          firmName,
          firmAddress,
          firmPhone,
          firmEmail,
        };

        const html = dayClosedEmail(emailData);

        await sendEmail({
          to: appt.clientEmail,
          subject: `Cita Cancelada - ${firmName}`,
          html,
        }).catch(console.error);
      }
    }

    return NextResponse.json(blocked, { status: 201 });
  } catch (error) {
    console.error('Error creando fecha bloqueada:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    await prisma.blockedDate.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error eliminando fecha bloqueada:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
