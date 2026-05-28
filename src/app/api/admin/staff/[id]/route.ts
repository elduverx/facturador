import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const ROLES = ['OWNER', 'LAWYER', 'PARALEGAL', 'ADMIN'] as const;

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data: Record<string, unknown> = {};

    if (typeof body?.name === 'string' && body.name.trim()) data.name = body.name.trim();
    if (ROLES.includes(body?.role)) data.role = body.role;
    if (typeof body?.active === 'boolean') data.active = body.active;

    const user = await prisma.staffUser.update({ where: { id }, data });
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error actualizando usuario de equipo:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
