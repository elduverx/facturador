import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createHash } from 'crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

type SessionPayload = {
  emisor?: Prisma.JsonValue | null;
  clients?: Prisma.JsonValue | null;
  recentClients?: Prisma.JsonValue | null;
  invoices?: Prisma.JsonValue | null;
  settings?: Prisma.JsonValue | null;
  logo?: string | null;
};

type SessionUpdatePayload = {
  emisor?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
  clients?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
  recentClients?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
  invoices?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
  settings?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
  logo?: string | null;
};

const toJsonUpdateValue = (
  value: unknown,
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined => {
  if (value === undefined) return undefined;
  if (value === null) return Prisma.DbNull;
  return value as Prisma.InputJsonValue;
};

const getSessionId = async () => {
  const headersList = await headers();
  const forwarded = headersList.get('x-forwarded-for') || '';
  const ip =
    forwarded.split(',')[0]?.trim() ||
    headersList.get('x-real-ip') ||
    headersList.get('cf-connecting-ip') ||
    'unknown';

  const userAgent = headersList.get('user-agent') || '';
  return createHash('sha256').update(`${ip}|${userAgent}`).digest('hex');
};

const toResponsePayload = (session: SessionPayload | null) => {
  if (!session) return {};
  return {
    emisor: session.emisor ?? undefined,
    clients: session.clients ?? undefined,
    recentClients: session.recentClients ?? undefined,
    invoices: session.invoices ?? undefined,
    settings: session.settings ?? undefined,
    logo: session.logo ?? null,
  };
};

export async function GET() {
  const id = await getSessionId();

  const session = await prisma.sessionData.findUnique({
    where: { id },
    select: {
      emisor: true,
      clients: true,
      recentClients: true,
      invoices: true,
      settings: true,
      logo: true,
    },
  });

  return NextResponse.json(toResponsePayload(session), {
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}

export async function PATCH(request: Request) {
  const id = await getSessionId();
  let body: SessionPayload = {};

  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const data: SessionUpdatePayload = {};
  const createData: Prisma.SessionDataCreateInput = { id };

  if ('emisor' in body) {
    const value = toJsonUpdateValue(body.emisor);
    if (value !== undefined) {
      data.emisor = value;
      createData.emisor = value;
    }
  }
  if ('clients' in body) {
    const value = toJsonUpdateValue(body.clients);
    if (value !== undefined) {
      data.clients = value;
      createData.clients = value;
    }
  }
  if ('recentClients' in body) {
    const value = toJsonUpdateValue(body.recentClients);
    if (value !== undefined) {
      data.recentClients = value;
      createData.recentClients = value;
    }
  }
  if ('invoices' in body) {
    const value = toJsonUpdateValue(body.invoices);
    if (value !== undefined) {
      data.invoices = value;
      createData.invoices = value;
    }
  }
  if ('settings' in body) {
    const value = toJsonUpdateValue(body.settings);
    if (value !== undefined) {
      data.settings = value;
      createData.settings = value;
    }
  }
  if ('logo' in body) {
    const value = body.logo ?? null;
    data.logo = value;
    createData.logo = value;
  }

  await prisma.sessionData.upsert({
    where: { id },
    update: data,
    create: createData,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const id = await getSessionId();
  await prisma.sessionData.delete({ where: { id } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
