import { Prisma } from '@prisma/client';
import { getAdminSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const FULL_ACCESS_ROLES = new Set(['OWNER']);

export async function getAdminAppointmentScope(): Promise<Prisma.AppointmentWhereInput> {
  const session = await getAdminSession();
  if (!session?.userId || FULL_ACCESS_ROLES.has(session.role || '')) return {};
  return { staffUserId: session.userId };
}

export async function canAccessClientEmail(clientEmail: string) {
  const session = await getAdminSession();
  if (!session?.userId || FULL_ACCESS_ROLES.has(session.role || '')) return true;

  const count = await prisma.appointment.count({
    where: {
      staffUserId: session.userId,
      clientEmail: { equals: clientEmail, mode: 'insensitive' },
    },
  });

  return count > 0;
}
