import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { setAuthCookies } from '@/src/lib/auth/cookies';

const ACCESS_TOKEN_COOKIE = 'sb-access-token';
const REFRESH_TOKEN_COOKIE = 'sb-refresh-token';


export async function GET(req: NextRequest) {
  // Permite token por header Authorization o cookie
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.replace('Bearer ', '')
    : req.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = req.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  const sessionTokenCookie = req.cookies.get('session_token')?.value;

  if (!token && !refreshToken) {
    return NextResponse.json({ ok: false, message: 'No autenticado' }, { status: 401 });
  }

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return NextResponse.json(
      { ok: false, message: 'Configuracion de Supabase incompleta' },
      { status: 500 }
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });

  if (token) {
    const { data, error } = await supabase.auth.getUser(token);

    if (!error && data?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('username,role,session_token')
        .eq('id', data.user.id)
        .maybeSingle();
      // Validación de sesión única
      if (profile?.session_token && sessionTokenCookie && profile.session_token !== sessionTokenCookie) {
        return NextResponse.json({ ok: false, message: 'Sesión inválida (otro dispositivo ha iniciado sesión)' }, { status: 401 });
      }
      return NextResponse.json({
        ok: true,
        user: {
          username: profile?.username ?? null,
          email: data.user.email ?? null,
          role: profile?.role ?? 'user',
        },
      });
    }
  }

  if (!refreshToken) {
    return NextResponse.json({ ok: false, message: 'No autenticado' }, { status: 401 });
  }

  const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (refreshError || !refreshData?.session || !refreshData.user) {
    return NextResponse.json({ ok: false, message: 'No autenticado' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('username,role,session_token')
    .eq('id', refreshData.user.id)
    .maybeSingle();

  // Validación de sesión única
  if (profile?.session_token && sessionTokenCookie && profile.session_token !== sessionTokenCookie) {
    return NextResponse.json({ ok: false, message: 'Sesión inválida (otro dispositivo ha iniciado sesión)' }, { status: 401 });
  }

  const res = NextResponse.json({
    ok: true,
    user: {
      username: profile?.username ?? null,
      email: refreshData.user.email ?? null,
      role: profile?.role ?? 'user',
    },
  });

  setAuthCookies(res, refreshData.session);
  return res;
}


