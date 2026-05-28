import { NextResponse } from 'next/server';
import { verifyPin } from '@/lib/auth';

const ADMIN_COOKIE = 'admin_session';
const SESSION_DURATION = 8 * 60 * 60;

export async function POST(request: Request) {
  try {
    const { pin } = await request.json();

    if (!pin) {
      return NextResponse.json({ error: 'PIN requerido' }, { status: 400 });
    }

    const valid = await verifyPin(pin);
    if (!valid) {
      return NextResponse.json({ error: 'PIN incorrecto' }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(ADMIN_COOKIE, crypto.randomUUID(), {
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
