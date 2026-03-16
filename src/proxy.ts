
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const ACCESS_TOKEN_COOKIE = 'sb-access-token';
const REFRESH_TOKEN_COOKIE = 'sb-refresh-token';

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;


  // Protect /admin routes with single-session logic
  if (pathname.startsWith('/admin')) {
    const accessToken = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
    const refreshToken = req.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
    const sessionToken = req.cookies.get('session_token')?.value;
    const userId = req.cookies.get('sb-user-id')?.value;

    if (!accessToken && !refreshToken) {
      const url = req.nextUrl.clone();
      url.pathname = '/auth/login';
      url.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(url);
    }

    // Validación de sesión única
    if (!sessionToken || !userId) {
      const url = req.nextUrl.clone();
      url.pathname = '/auth/login';
      url.searchParams.set('redirectTo', pathname);
      const res = NextResponse.redirect(url);
      res.cookies.set('session_token', '', { httpOnly: true, path: '/', maxAge: 0 });
      res.cookies.set('sb-user-id', '', { httpOnly: true, path: '/', maxAge: 0 });
      return res;
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
    const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    // Consulta directa, no persistente
    return supabase
      .from('profiles')
      .select('session_token')
      .eq('id', userId)
      .single()
      .then(({ data, error }) => {
        if (error || !data || data.session_token !== sessionToken) {
          const url = req.nextUrl.clone();
          url.pathname = '/auth/login';
          url.searchParams.set('redirectTo', pathname);
          const res = NextResponse.redirect(url);
          res.cookies.set('session_token', '', { httpOnly: true, path: '/', maxAge: 0 });
          res.cookies.set('sb-user-id', '', { httpOnly: true, path: '/', maxAge: 0 });
          return res;
        }
        return NextResponse.next();
      });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
