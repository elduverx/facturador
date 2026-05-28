import { NextResponse } from 'next/server';

const ADMIN_COOKIE = 'admin_session';

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(ADMIN_COOKIE);
  return response;
}
