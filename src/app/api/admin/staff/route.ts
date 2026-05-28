import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isValidEmail, normalizeEmail } from '@/lib/validation';

const ROLES = ['OWNER', 'LAWYER', 'PARALEGAL', 'ADMIN'] as const;

export async function GET() {
  const staff = await prisma.staffUser.findMany({ orderBy: [{ active: 'desc' }, { name: 'asc' }] });
  return NextResponse.json(staff);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const email = normalizeEmail(typeof body?.email === 'string' ? body.email : '');
    const role = ROLES.includes(body?.role) ? body.role : 'PARALEGAL';

    if (!name || !email || !isValidEmail(email)) {
      return NextResponse.json({ error: 'Nombre y email valido son obligatorios' }, { status: 400 });
    }

    const user = await prisma.staffUser.upsert({
      where: { email },
      create: { name, email, role },
      update: { name, role, active: true },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Error guardando usuario de equipo:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
