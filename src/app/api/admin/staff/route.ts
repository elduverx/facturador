import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isValidEmail, normalizeEmail } from '@/lib/validation';
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

export async function GET() {
  const staff = await prisma.staffUser.findMany({
    orderBy: [{ active: 'desc' }, { name: 'asc' }],
    select: staffPublicSelect,
  });
  return NextResponse.json(staff);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const email = normalizeEmail(typeof body?.email === 'string' ? body.email : '');
    const loginSlug = typeof body?.loginSlug === 'string' && body.loginSlug.trim()
      ? body.loginSlug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-')
      : null;
    const pin = typeof body?.pin === 'string' && body.pin.trim() ? body.pin.trim() : '';
    const role = ROLES.includes(body?.role) ? body.role : 'PARALEGAL';

    if (!name || !email || !isValidEmail(email)) {
      return NextResponse.json({ error: 'Nombre y email valido son obligatorios' }, { status: 400 });
    }

    if (pin && pin.length < 4) {
      return NextResponse.json({ error: 'La clave debe tener al menos 4 caracteres' }, { status: 400 });
    }

    const pinHash = pin ? await bcrypt.hash(pin, 12) : undefined;

    const user = await prisma.staffUser.upsert({
      where: { email },
      create: { name, email, role, loginSlug, pinHash },
      update: { name, role, loginSlug, ...(pinHash ? { pinHash } : {}), active: true },
      select: staffPublicSelect,
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Error guardando usuario de equipo:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
