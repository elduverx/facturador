import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const DEADLINE_STATUSES = ['OPEN', 'COMPLETED', 'OVERDUE', 'CANCELLED'] as const;

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data: Record<string, unknown> = {};

    if (typeof body?.title === 'string' && body.title.trim()) data.title = body.title.trim();
    if (Object.prototype.hasOwnProperty.call(body, 'description')) {
      data.description = typeof body.description === 'string' && body.description.trim() ? body.description.trim() : null;
    }
    if (typeof body?.dueAt === 'string' && body.dueAt) data.dueAt = new Date(body.dueAt);
    if (DEADLINE_STATUSES.includes(body?.status)) {
      data.status = body.status;
      data.completedAt = body.status === 'COMPLETED' ? new Date() : null;
    }

    const updated = await prisma.legalDeadline.update({ where: { id }, data });

    await prisma.matterTimeline.create({
      data: {
        matterId: updated.matterId,
        type: 'DEADLINE',
        title: 'Plazo actualizado',
        content: `${updated.title}: ${updated.status}`,
        actor: 'Admin',
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error actualizando plazo:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
