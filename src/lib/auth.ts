import { cookies } from 'next/headers';

const ADMIN_COOKIE = 'admin_session';
const SESSION_DURATION = 8 * 60 * 60; // 8 hours in seconds

export async function verifyPin(pin: string): Promise<boolean> {
  const envPin = process.env.ADMIN_PIN;
  if (!envPin) return false;
  return pin === envPin;
}

export async function createAdminSession(): Promise<void> {
  const token = crypto.randomUUID();
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION,
    path: '/',
  });
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_COOKIE);
  return !!session?.value;
}

export async function destroyAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
}
