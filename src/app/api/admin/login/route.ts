import { NextResponse } from 'next/server';
import { createSignedAdminSessionValue, verifyPin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

const ADMIN_COOKIE = 'admin_session';
const SESSION_DURATION = 8 * 60 * 60;
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

const attempts = new Map<string, { count: number; resetAt: number }>();

function getClientKey(request: Request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'local';
}

function isRateLimited(key: string) {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

function clearAttempts(key: string) {
  attempts.delete(key);
}

export async function GET() {
  try {
    const staff = await prisma.staffUser.findMany({
      where: { active: true, loginSlug: { not: null } },
      orderBy: { name: 'asc' },
      select: {
        name: true,
        loginSlug: true,
        role: true,
        pinHash: true,
      },
    });

    return NextResponse.json(staff.map((user) => ({
      name: user.name,
      loginSlug: user.loginSlug,
      role: user.role,
      hasPin: Boolean(user.pinHash),
    })));
  } catch (error) {
    console.error('Error cargando usuarios de login:', error);
    return NextResponse.json({ error: 'Error cargando usuarios' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const clientKey = getClientKey(request);
    if (isRateLimited(clientKey)) {
      return NextResponse.json({ error: 'Demasiados intentos. Prueba mas tarde.' }, { status: 429 });
    }

    const { pin, login } = await request.json();

    if (!pin) {
      return NextResponse.json({ error: 'PIN requerido' }, { status: 400 });
    }

    if (typeof login === 'string' && login.trim()) {
      const normalizedLogin = login.trim().toLowerCase();
      const user = await prisma.staffUser.findFirst({
        where: {
          active: true,
          OR: [
            { loginSlug: normalizedLogin },
            { email: normalizedLogin },
          ],
        },
      });

      if (!user) {
        return NextResponse.json({ error: 'Usuario o PIN incorrecto' }, { status: 401 });
      }

      const validUserPin = user.pinHash
        ? await bcrypt.compare(pin, user.pinHash)
        : await verifyPin(pin);
      if (!validUserPin) {
        return NextResponse.json({ error: 'Usuario o PIN incorrecto' }, { status: 401 });
      }

      clearAttempts(clientKey);
      const response = NextResponse.json({ ok: true });
      response.cookies.set(ADMIN_COOKIE, await createSignedAdminSessionValue({
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: SESSION_DURATION,
        path: '/',
      });

      return response;
    }

    const hasStaffUsers = await prisma.staffUser.count({
      where: { active: true, loginSlug: { not: null } },
    });

    if (hasStaffUsers > 0) {
      return NextResponse.json({ error: 'Selecciona una usuaria para acceder' }, { status: 400 });
    }

    const valid = await verifyPin(pin);
    if (!valid) {
      return NextResponse.json({ error: 'PIN incorrecto' }, { status: 401 });
    }

    clearAttempts(clientKey);

    const response = NextResponse.json({ ok: true });
    response.cookies.set(ADMIN_COOKIE, await createSignedAdminSessionValue(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Error en login:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
