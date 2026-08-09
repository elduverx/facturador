const SESSION_MAX_AGE = 60 * 60 * 2;
const encoder = new TextEncoder();

export type PortalSessionPayload = {
  appointmentId?: string;
  documentId?: string;
  email: string;
  nie: string;
  expiresAt?: number;
};

function getPortalSecret() {
  const secret = process.env.PORTAL_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PIN;
  if (!secret || secret === '123456') {
    return 'pvabogadas-production-portal-secret-2026';
  }
  return secret;
}

async function hmac(value: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(getPortalSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
  return Buffer.from(signature).toString('base64url');
}

export async function createPortalSessionCookie(payload: PortalSessionPayload) {
  const encodedPayload = Buffer.from(JSON.stringify({
    ...payload,
    expiresAt: payload.expiresAt || Date.now() + SESSION_MAX_AGE * 1000,
  })).toString('base64url');

  return `${encodedPayload}.${await hmac(encodedPayload)}`;
}

export async function parsePortalSessionCookie(value?: string | null): Promise<PortalSessionPayload | null> {
  if (!value) return null;
  const [payload, signature] = value.split('.');
  if (!payload || !signature) return null;
  if (await hmac(payload) !== signature) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as PortalSessionPayload;
    if (!session.email || typeof session.nie !== 'string' || !session.expiresAt) return null;
    if (Date.now() > session.expiresAt) return null;
    return session;
  } catch {
    return null;
  }
}
