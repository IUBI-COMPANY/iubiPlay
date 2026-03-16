import type { Session } from '@supabase/supabase-js';
import type { NextResponse } from 'next/server';

const ACCESS_TOKEN_COOKIE = 'sb-access-token';
const REFRESH_TOKEN_COOKIE = 'sb-refresh-token';

export function setAuthCookies(res: NextResponse, session: Session) {
  const isProd = process.env.NODE_ENV === 'production';
  const secure = isProd ? true : false;
  if (!isProd) {
     
    console.warn('[setAuthCookies] Cookies httpOnly sin secure en local/dev');
  }
  res.cookies.set(ACCESS_TOKEN_COOKIE, session.access_token, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: session.expires_in ?? 60 * 60,
  });
  res.cookies.set(REFRESH_TOKEN_COOKIE, session.refresh_token, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}
