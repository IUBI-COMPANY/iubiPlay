import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { setAuthCookies } from '@/src/lib/auth/cookies';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');

  console.log('[OAuth Callback] URL:', req.url);
  console.log('[OAuth Callback] Code:', code);

  if (!code) {
    console.log('[OAuth Callback] Falta el parámetro code');
    return NextResponse.redirect(new URL('/auth/login?error=missing_code', req.url));
  }

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.log('[OAuth Callback] Configuración de Supabase incompleta');
    return NextResponse.redirect(new URL('/auth/login?error=supabase_config', req.url));
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data?.session) {
    console.log('[OAuth Callback] Error al intercambiar código:', error);
    return NextResponse.redirect(new URL('/auth/login?error=auth_callback', req.url));
  }

  console.log('[OAuth Callback] Sesión obtenida:', {
    user: data.session.user?.id,
    access_token: data.session.access_token ? '[OK]' : '[NO]',
    refresh_token: data.session.refresh_token ? '[OK]' : '[NO]',
  });

  const res = NextResponse.redirect(new URL('/', req.url));
  setAuthCookies(res, data.session);
  console.log('[OAuth Callback] Cookies seteadas');
  return res;
}
