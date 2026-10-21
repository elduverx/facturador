import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { dayClosedEmail } from '@/lib/email-templates';
import { formatBlockedRangeReason, parseBlockedRange } from '@/lib/slots';

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export async function GET() {
  const blockedDates = await prisma.blockedDate.findMany({
    orderBy: { date: 'asc' },
  });

  // Deduplicate any existing identical blocks on the same day
  const seen = new Set<string>();
  const duplicateIds: string[] = [];
  const uniqueBlocked = [];

  for (const b of blockedDates) {
    const parsed = parseBlockedRange(b.reason);
    const dayKey = b.date.toISOString().split('T')[0];
    const signature = parsed.isFullDay
      ? `${dayKey}::FULL`
      : `${dayKey}::${parsed.startTime}-${parsed.endTime}`;

    if (seen.has(signature)) {
      duplicateIds.push(b.id);
    } else {
      seen.add(signature);
      uniqueBlocked.push({
        ...b,
        ...parsed,
      });
    }
  }

  if (duplicateIds.length > 0) {
    await prisma.blockedDate
      .deleteMany({ where: { id: { in: duplicateIds } } })
      .catch(() => {});
  }

  return NextResponse.json(uniqueBlocked);
}

export async function POST(request: Request) {
  try {
    const { date, reason, startTime, endTime, cancelExisting } = await request.json();

    if (!date) {
      return NextResponse.json({ error: 'Fecha requerida' }, { status: 400 });
    }

    const isRange = Boolean(startTime && endTime);
    if (isRange && timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      return NextResponse.json(
        { error: 'La hora de fin debe ser mayor a la hora de inicio' },
        { status: 400 }
      );
    }

    const startOfDay = new Date(date + 'T00:00:00.000Z');
    const endOfDay = new Date(date + 'T23:59:59.999Z');

    // Check existing blocks on this date to prevent duplicates
    const existingBlocks = await prisma.blockedDate.findMany({
      where: {
        date: { gte: startOfDay, lte: endOfDay },
      },
    });

    if (!isRange) {
      // Full-day closure: if a full-day closure already exists, return it without duplicating
      const existingFull = existingBlocks.find((b) => parseBlockedRange(b.reason).isFullDay);
      if (existingFull) {
        return NextResponse.json(
          {
            ...existingFull,
            ...parseBlockedRange(existingFull.reason),
          },
          { status: 200 }
        );
      }
    } else {
      // Partial range closure: if the same [startTime, endTime] block already exists, return it
      const existingSameRange = existingBlocks.find((b) => {
        const parsed = parseBlockedRange(b.reason);
        return (
          !parsed.isFullDay &&
          parsed.startTime === startTime &&
          parsed.endTime === endTime
        );
      });
      if (existingSameRange) {
        return NextResponse.json(
          {
            ...existingSameRange,
            ...parseBlockedRange(existingSameRange.reason),
          },
          { status: 200 }
        );
      }
    }

    const storedReason = isRange
      ? formatBlockedRangeReason(startTime, endTime, reason)
      : reason || null;

    const blocked = await prisma.blockedDate.create({
      data: {
        date: startOfDay,
        reason: storedReason,
      },
    });

    // For full-day closures (or if cancelExisting is explicitly requested for a range), cancel affected active appointments
    if (!isRange || cancelExisting === true) {
      const allDayAppts = await prisma.appointment.findMany({
        where: {
          date: { gte: startOfDay, lte: endOfDay },
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
        include: { service: true },
      });

      const appointmentsToCancel = isRange
        ? allDayAppts.filter((appt) => {
            const apptStart = timeToMinutes(appt.startTime);
            const apptEnd = timeToMinutes(appt.endTime);
            const blockStart = timeToMinutes(startTime);
            const blockEnd = timeToMinutes(endTime);
            return apptStart < blockEnd && apptEnd > blockStart;
          })
        : allDayAppts;

      if (appointmentsToCancel.length > 0) {
        const settings = await prisma.officeSettings.findUnique({
          where: { id: 'default' },
        });

        const firmName = settings?.firmName || 'Nuestra Oficina';
        const firmAddress = settings?.firmAddress || '';
        const firmPhone = settings?.firmPhone || '';
        const firmEmail = settings?.firmEmail || '';

        const [year, month, day] = date.split('-');
        const formattedDate = `${day}/${month}/${year}`;

        await prisma.appointment.updateMany({
          where: {
            id: { in: appointmentsToCancel.map((a) => a.id) },
          },
          data: {
            status: 'CANCELLED',
            adminNotes: reason
              ? `Cancelada por cierre de oficina: ${reason}`
              : 'Cancelada por cierre de oficina',
          },
        });

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
    }

    return NextResponse.json(
      {
        ...blocked,
        ...parseBlockedRange(blocked.reason),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creando fecha bloqueada:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const ids = searchParams.get('ids');

    if (ids) {
      const idList = ids.split(',').map((s) => s.trim()).filter(Boolean);
      if (idList.length > 0) {
        await prisma.blockedDate.deleteMany({ where: { id: { in: idList } } });
        return NextResponse.json({ ok: true, count: idList.length });
      }
    }

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
