import { NextResponse } from 'next/server';

const ACCESS_TOKEN_COOKIE = 'sb-access-token';
const REFRESH_TOKEN_COOKIE = 'sb-refresh-token';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  const cookieOptions: Partial<{ httpOnly: boolean; sameSite: "lax" | "strict" | "none"; secure: boolean; path: string; maxAge: number }> = {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  };
  res.cookies.set(ACCESS_TOKEN_COOKIE, '', cookieOptions);
  res.cookies.set(REFRESH_TOKEN_COOKIE, '', cookieOptions);
  res.cookies.set('session_token', '', cookieOptions);
  res.cookies.set('sb-user-id', '', cookieOptions);
  return res;
}
