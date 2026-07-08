import { prisma } from './prisma';

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function safeTimeToMinutes(time: string | null | undefined): number | null {
  if (!time) return null;
  return timeToMinutes(time);
}

export async function getDayConfig(dateStr: string) {
  const settings = await prisma.officeSettings.findUnique({ where: { id: 'default' } });
  if (!settings) return null;

  const startOfDay = new Date(dateStr + 'T00:00:00.000Z');
  const endOfDay = new Date(dateStr + 'T23:59:59.999Z');

  const override = await prisma.daySchedule.findFirst({
    where: {
      date: { gte: startOfDay, lte: endOfDay },
    },
  });

  const workDays = settings.workDays as number[];
  const date = new Date(dateStr + 'T00:00:00');
  const dayOfWeek = date.getDay();
  const isWorkDay = workDays.includes(dayOfWeek);

  const startMinutes = override ? timeToMinutes(override.startTime) : settings.startHour * 60;
  const endMinutes = override ? timeToMinutes(override.endTime) : settings.endHour * 60;

  if (endMinutes <= startMinutes) {
    return null;
  }

  const overrideLunchStart = safeTimeToMinutes(override?.lunchStartTime ?? null);
  const overrideLunchEnd = safeTimeToMinutes(override?.lunchEndTime ?? null);
  const hasOverrideLunch = overrideLunchStart !== null && overrideLunchEnd !== null;

  const lunchStart = hasOverrideLunch ? overrideLunchStart : settings.lunchStartHour * 60;
  const lunchEnd = hasOverrideLunch ? overrideLunchEnd : settings.lunchEndHour * 60;
  const hasLunch = hasOverrideLunch ? lunchStart < lunchEnd : settings.lunchStartHour < settings.lunchEndHour;

  const maxPerDay = override?.maxAppointmentsPerDay ?? settings.maxAppointmentsPerDay ?? 0;
  const baseSlotDuration = override?.slotDurationMin ?? settings.slotDurationMin;

  const lunchDuration = hasLunch ? Math.max(0, (lunchEnd || 0) - (lunchStart || 0)) : 0;
  const availableMinutes = Math.max(0, endMinutes - startMinutes - lunchDuration);

  const autoSlotDuration = maxPerDay > 0 ? Math.max(1, Math.floor(availableMinutes / maxPerDay)) : baseSlotDuration;
  const slotDurationMin = override?.slotDurationMin ? override.slotDurationMin : autoSlotDuration;

  return {
    settings,
    override,
    startMinutes,
    endMinutes,
    lunchStart: hasLunch ? lunchStart : null,
    lunchEnd: hasLunch ? lunchEnd : null,
    maxPerDay,
    slotDurationMin,
    isWorkDay,
  };
}

export async function getAvailableSlots(
  dateStr: string,
  serviceId: string,
  staffUserId?: string | null
): Promise<{ time: string; available: boolean }[]> {
  const dayConfig = await getDayConfig(dateStr);
  if (!dayConfig) return [];

  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) return [];

  if (!dayConfig.override && !dayConfig.isWorkDay) return [];

  // Check if date is blocked
  const startOfDay = new Date(dateStr + 'T00:00:00.000Z');
  const endOfDay = new Date(dateStr + 'T23:59:59.999Z');

  const blocked = await prisma.blockedDate.findFirst({
    where: {
      date: { gte: startOfDay, lte: endOfDay },
    },
  });
  if (blocked) return [];

  if (dayConfig.maxPerDay > 0) {
    const countForDay = await prisma.appointment.count({
      where: {
        date: { gte: startOfDay, lte: endOfDay },
        status: { not: 'CANCELLED' },
        ...(staffUserId ? { staffUserId } : {}),
      },
    });
    if (countForDay >= dayConfig.maxPerDay) {
      return [];
    }
  }

  // Generate all possible slots
  const slotDuration = Math.max(1, dayConfig.slotDurationMin);
  const startMinutes = dayConfig.startMinutes;
  const endMinutes = dayConfig.endMinutes;
  const lunchStart = dayConfig.lunchStart;
  const lunchEnd = dayConfig.lunchEnd;
  const serviceDuration = dayConfig.maxPerDay > 0 || dayConfig.override?.slotDurationMin
    ? slotDuration
    : service.durationMin;

  const allSlots: string[] = [];
  for (let t = startMinutes; t + serviceDuration <= endMinutes; t += slotDuration) {
    // Skip lunch overlap
    const slotEnd = t + serviceDuration;
    if (lunchStart !== null && lunchEnd !== null && t < lunchEnd && slotEnd > lunchStart) continue;
    allSlots.push(minutesToTime(t));
  }

  // Get existing appointments for this date
  const existing = await prisma.appointment.findMany({
    where: {
      date: { gte: startOfDay, lte: endOfDay },
      status: { in: ['PENDING', 'CONFIRMED'] },
      ...(staffUserId ? { OR: [{ staffUserId }, { staffUserId: null }] } : {}),
    },
    select: { startTime: true, endTime: true },
  });

  // Check for today's past times
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const isToday = dateStr === todayStr;
  const currentMinutes = isToday ? now.getHours() * 60 + now.getMinutes() : 0;

  return allSlots.map((time) => {
    const slotStart = timeToMinutes(time);
    const slotEnd = slotStart + serviceDuration;

    // Past time check
    if (isToday && slotStart <= currentMinutes + 30) {
      return { time, available: false };
    }

    // Overlap check with existing appointments
    const hasConflict = existing.some((appt) => {
      const existStart = timeToMinutes(appt.startTime);
      const existEnd = timeToMinutes(appt.endTime);
      return slotStart < existEnd && slotEnd > existStart;
    });

    return { time, available: !hasConflict };
  });
}
