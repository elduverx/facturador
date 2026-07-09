import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const encoder = new TextEncoder();

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
  const bytes = Array.from(new Uint8Array(signature));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function hasValidAdminSession(value?: string) {
  if (!value) return false;
  const [payload, signature] = value.split('.');
  if (!payload || !signature) return false;
  if (await hmac(payload) !== signature) return false;

  try {
    const session = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as { expiresAt?: number };
    return typeof session.expiresAt === 'number' && Date.now() <= session.expiresAt;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /admin/* routes (except /admin/login)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const session = request.cookies.get('admin_session');
    if (!(await hasValidAdminSession(session?.value))) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // Protect admin API routes (except login)
  if (pathname.startsWith('/api/admin') && !pathname.startsWith('/api/admin/login')) {
    const session = request.cookies.get('admin_session');
    if (!(await hasValidAdminSession(session?.value))) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/api/appointments/:path*'],
};
