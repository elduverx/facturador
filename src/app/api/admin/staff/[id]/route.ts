import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

const ROLES = ['OWNER', 'LAWYER', 'PARALEGAL', 'ADMIN'] as const;
const staffPublicSelect = {
  id: true,
  name: true,
  email: true,
  loginSlug: true,
  role: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} as const;

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data: Record<string, unknown> = {};

    if (typeof body?.name === 'string' && body.name.trim()) data.name = body.name.trim();
    if (typeof body?.loginSlug === 'string') {
      data.loginSlug = body.loginSlug.trim()
        ? body.loginSlug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-')
        : null;
    }
    if (typeof body?.pin === 'string' && body.pin.trim()) {
      if (body.pin.trim().length < 4) {
        return NextResponse.json({ error: 'La clave debe tener al menos 4 caracteres' }, { status: 400 });
      }
      data.pinHash = await bcrypt.hash(body.pin.trim(), 12);
    }
    if (ROLES.includes(body?.role)) data.role = body.role;
    if (typeof body?.active === 'boolean') data.active = body.active;

    const user = await prisma.staffUser.update({ where: { id }, data, select: staffPublicSelect });
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error actualizando usuario de equipo:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
