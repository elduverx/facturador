import { NextResponse } from 'next/server';
import { verifyPin, createAdminSession } from '@/lib/auth';

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

    await createAdminSession();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error en login:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
