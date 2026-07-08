import { cookies } from 'next/headers';

const ADMIN_COOKIE = 'admin_session';
const SESSION_DURATION = 8 * 60 * 60; // 8 hours in seconds
const encoder = new TextEncoder();

export type AdminSession = {
  token: string;
  expiresAt: number;
  userId?: string;
  name?: string;
  email?: string;
  role?: string;
};

function getSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PIN;
  if (!secret || secret === '123456') {
    return 'pvabogadas-production-secret-key-2026';
  }
  return secret;
}

async function hmac(value: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(getSessionSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
  return Buffer.from(signature).toString('base64url');
}

export async function createSignedAdminSessionValue(user?: Omit<AdminSession, 'token' | 'expiresAt'>, now = Date.now()) {
  const payload = Buffer.from(JSON.stringify({
    token: crypto.randomUUID(),
    expiresAt: now + SESSION_DURATION * 1000,
    ...user,
  })).toString('base64url');
  return `${payload}.${await hmac(payload)}`;
}

export async function parseSignedAdminSessionValue(value?: string | null): Promise<AdminSession | null> {
  if (!value) return null;
  const [payload, signature] = value.split('.');
  if (!payload || !signature) return null;
  if (await hmac(payload) !== signature) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as AdminSession;
    if (typeof session.expiresAt !== 'number' || Date.now() > session.expiresAt) return null;
    return session;
  } catch {
    return null;
  }
}

export async function verifySignedAdminSessionValue(value?: string | null): Promise<boolean> {
  return Boolean(await parseSignedAdminSessionValue(value));
}

export async function verifyPin(pin: string): Promise<boolean> {
  const envPin = process.env.ADMIN_PIN;
  if (!envPin) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ADMIN_PIN debe estar configurado en produccion.');
    }
    return pin === '123456';
  }
  return pin === envPin;
}

export async function createAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, await createSignedAdminSessionValue(), {
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
  return verifySignedAdminSessionValue(session?.value);
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_COOKIE);
  return parseSignedAdminSessionValue(session?.value);
}

export async function destroyAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
}
