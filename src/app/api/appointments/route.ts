import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { confirmationEmail, adminNewBookingEmail } from '@/lib/email-templates';
import { formatDateES } from '@/lib/constants';
import { getDayConfig } from '@/lib/slots';
import { isValidEmail, isValidPhone, normalizeEmail, normalizeNie, normalizePhone } from '@/lib/validation';
import { isAdminAuthenticated } from '@/lib/auth';

// POST - Create appointment (public)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { serviceId, date, startTime, clientName, clientEmail, clientPhone, clientNie, notes, lawyerId, paymentMethod } = body;

    if (!serviceId || !date || !startTime || !clientName || !clientEmail || !clientPhone) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios' },
        { status: 400 }
      );
    }

    const normalizedName = clientName.trim();
    const normalizedEmail = normalizeEmail(clientEmail);
    const normalizedPhone = normalizePhone(clientPhone);
    const normalizedNie = clientNie ? normalizeNie(clientNie) : null;

    if (!normalizedName) {
      return NextResponse.json({ error: 'Nombre no valido' }, { status: 400 });
    }
    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      return NextResponse.json({ error: 'Email no valido' }, { status: 400 });
    }
    if (!normalizedPhone || !isValidPhone(normalizedPhone)) {
      return NextResponse.json({ error: 'Telefono no valido (9 digitos, empieza con 6, 7, 8 o 9)' }, { status: 400 });
    }

    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) {
      return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 });
    }

    const selectedStaff = typeof lawyerId === 'string' && lawyerId.trim()
      ? await prisma.staffUser.findFirst({
          where: { loginSlug: lawyerId.trim().toLowerCase(), active: true },
          select: { id: true, name: true, email: true, loginSlug: true },
        })
      : null;

    const dayConfig = await getDayConfig(date);
    if (!dayConfig) {
      return NextResponse.json({ error: 'Configuracion no disponible' }, { status: 500 });
    }

    // Calculate end time
    const [h, m] = startTime.split(':').map(Number);
    const startMinutes = h * 60 + m;
    const slotDuration = Math.max(1, dayConfig.slotDurationMin);
    const durationForBooking = dayConfig.maxPerDay > 0 || dayConfig.override?.slotDurationMin
      ? slotDuration
      : service.durationMin;
    const endMinutes = startMinutes + durationForBooking;
    const endTime = `${Math.floor(endMinutes / 60).toString().padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`;

    // Check for conflicts atomically
    const startOfDay = new Date(date + 'T00:00:00.000Z');
    const endOfDay = new Date(date + 'T23:59:59.999Z');

    const appointment = await prisma.$transaction(async (tx) => {
      if (!dayConfig.override && !dayConfig.isWorkDay) {
        throw new Error('CLOSED_DAY');
      }

      const blocked = await tx.blockedDate.findFirst({
        where: { date: { gte: startOfDay, lte: endOfDay } },
      });
      if (blocked) {
        throw new Error('CLOSED_DAY');
      }

      if (normalizedNie) {
        const startOfToday = new Date(new Date().toISOString().split('T')[0] + 'T00:00:00.000Z');
        const existingNie = await tx.appointment.findFirst({
          where: {
            clientNie: { equals: normalizedNie, mode: 'insensitive' },
            date: { gte: startOfToday },
            status: { in: ['PENDING', 'CONFIRMED'] },
            ...(selectedStaff ? { staffUserId: selectedStaff.id } : {}),
          },
          select: { id: true },
        });
        if (existingNie) {
          throw new Error('DUP_NIE');
        }
      }

      if (dayConfig.maxPerDay > 0) {
        const countForDay = await tx.appointment.count({
          where: {
            date: { gte: startOfDay, lte: endOfDay },
            status: { not: 'CANCELLED' },
            ...(selectedStaff ? { staffUserId: selectedStaff.id } : {}),
          },
        });
        if (countForDay >= dayConfig.maxPerDay) {
          throw new Error('DAY_CAP');
        }
      }

      if (startMinutes < dayConfig.startMinutes || endMinutes > dayConfig.endMinutes) {
        throw new Error('OUT_OF_RANGE');
      }

      if (dayConfig.lunchStart !== null && dayConfig.lunchEnd !== null) {
        const lunchStart = dayConfig.lunchStart;
        const lunchEnd = dayConfig.lunchEnd;
        if (startMinutes < lunchEnd && endMinutes > lunchStart) {
          throw new Error('OUT_OF_RANGE');
        }
      }

      const conflicts = await tx.appointment.findMany({
        where: {
          date: { gte: startOfDay, lte: endOfDay },
          status: { in: ['PENDING', 'CONFIRMED'] },
          ...(selectedStaff ? { OR: [{ staffUserId: selectedStaff.id }, { staffUserId: null }] } : {}),
        },
        select: { startTime: true, endTime: true },
      });

      const hasConflict = conflicts.some((appt) => {
        const existStart = timeToMinutes(appt.startTime);
        const existEnd = timeToMinutes(appt.endTime);
        return startMinutes < existEnd && endMinutes > existStart;
      });

      if (hasConflict) {
        throw new Error('SLOT_TAKEN');
      }

      const method = paymentMethod === 'CASH' ? 'CASH' : 'CARD';

      return tx.appointment.create({
        data: {
          serviceId,
          staffUserId: selectedStaff?.id || null,
          clientName: normalizedName,
          clientEmail: normalizedEmail,
          clientPhone: normalizedPhone,
          clientNie: normalizedNie,
          date: startOfDay,
          startTime,
          endTime,
          modality: date.split('-')[1] === '08' ? 'VIDEO_CALL' : (body.modality || 'OFFICE'),
          notes: [
            selectedStaff ? `Abogada asignada: ${selectedStaff.name}` : null,
            method === 'CASH' ? '💵 Método de pago a concretar en oficina' : '💳 Pago Online (Bizum)',
            notes || null,
          ].filter(Boolean).join('\n\n') || null,
          status: method === 'CASH' ? 'CONFIRMED' : 'PENDING',
          paymentMethod: method,
          paymentStatus: method === 'CASH' ? 'PENDING' : 'PENDING',
        },
        include: { service: true },
      });
    });

    // Send emails (non-blocking)
    const firmName = dayConfig.settings?.firmName || 'PV Abogadas';
    const emailData = {
      clientName: normalizedName,
      serviceName: service.name,
      date: formatDateES(date),
      time: startTime,
      firmName,
      firmAddress: dayConfig.settings?.firmAddress || 'C/ de Sant Ignasi de Loiola, 21, entresuelo, Extramurs, 46008 València, Valencia',
      firmPhone: dayConfig.settings?.firmPhone || '',
      firmEmail: dayConfig.settings?.firmEmail || '',
    };

    // Client confirmation removed from here to only send upon payment successful

    // For cash payments, send confirmation email immediately
    if (appointment.paymentMethod === 'CASH') {
      const { cashReservationEmail } = await import('@/lib/email-templates');
      sendEmail({
        to: normalizedEmail,
        subject: `Reserva Confirmada (Pago en Oficina) - ${firmName}`,
        html: cashReservationEmail(emailData),
      }).catch(console.error);
    }

    // Admin notification
    let adminEmail = dayConfig.settings?.firmEmail;
    
    if (selectedStaff?.loginSlug) {
      const slug = selectedStaff.loginSlug.toUpperCase();
      const envEmail = process.env[`EMAIL_NOTIFICACIONES_${slug}`];
      if (envEmail) {
        adminEmail = envEmail;
      } else if (selectedStaff.email) {
        adminEmail = selectedStaff.email;
      }
    }

    if (adminEmail) {
      sendEmail({
        to: adminEmail,
        subject: `Nueva reserva${appointment.paymentMethod === 'CASH' ? ' (EFECTIVO)' : ''}: ${clientName} - ${service.name}`,
        html: adminNewBookingEmail({
          ...emailData,
          clientEmail: normalizedEmail,
          clientPhone: normalizedPhone,
          clientNie: normalizedNie || undefined,
          notes: notes || undefined,
        }),
      }).catch(console.error);
    }

    return NextResponse.json(appointment, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'DUP_NIE') {
      return NextResponse.json(
        { error: 'Ya existe una cita activa con ese NIE. Contacte con recepcion si necesita modificarla.' },
        { status: 409 }
      );
    }
    if (error instanceof Error && error.message === 'OUT_OF_RANGE') {
      return NextResponse.json(
        { error: 'Horario fuera del rango configurado para ese dia.' },
        { status: 409 }
      );
    }
    if (error instanceof Error && error.message === 'CLOSED_DAY') {
      return NextResponse.json(
        { error: 'No hay atencion en esa fecha. Seleccione otro dia.' },
        { status: 409 }
      );
    }
    if (error instanceof Error && error.message === 'DAY_CAP') {
      return NextResponse.json(
        { error: 'No hay cupos disponibles para este dia. Por favor, seleccione otra fecha.' },
        { status: 409 }
      );
    }
    if (error instanceof Error && error.message === 'SLOT_TAKEN') {
      return NextResponse.json(
        { error: 'Este horario ya no esta disponible. Por favor, seleccione otro.' },
        { status: 409 }
      );
    }
    console.error('Error creando cita:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// GET - List appointments (admin only, protected by middleware)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get('date');
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const createdFrom = searchParams.get('createdFrom');
  const createdTo = searchParams.get('createdTo');
  const status = searchParams.get('status');
  const search = searchParams.get('search');

  const where: Record<string, unknown> = {};

  if (dateParam) {
    const startOfDay = new Date(dateParam + 'T00:00:00.000Z');
    const endOfDay = new Date(dateParam + 'T23:59:59.999Z');
    where.date = { gte: startOfDay, lte: endOfDay };
  } else if (from || to) {
    const dateFilter: Record<string, Date> = {};
    if (from) dateFilter.gte = new Date(from + 'T00:00:00.000Z');
    if (to) dateFilter.lte = new Date(to + 'T23:59:59.999Z');
    where.date = dateFilter;
  }

  if (createdFrom || createdTo) {
    const createdFilter: Record<string, Date> = {};
    if (createdFrom) createdFilter.gte = new Date(createdFrom + 'T00:00:00.000Z');
    if (createdTo) createdFilter.lte = new Date(createdTo + 'T23:59:59.999Z');
    where.createdAt = createdFilter;
  }

  if (status) {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { clientName: { contains: search, mode: 'insensitive' } },
      { clientEmail: { contains: search, mode: 'insensitive' } },
      { clientPhone: { contains: search } },
      { clientNie: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { getAdminAppointmentScope } = await import('@/lib/admin-scope');
  const scope = await getAdminAppointmentScope();

  const appointments = await prisma.appointment.findMany({
    where: { AND: [where, scope] },
    include: {
      service: true,
      staffUser: { select: { id: true, name: true, email: true, loginSlug: true } },
    },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  });

  return NextResponse.json(appointments);
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}
