import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { setAuthCookies } from '@/src/lib/auth/cookies';

const ACCESS_TOKEN_COOKIE = 'sb-access-token';
const REFRESH_TOKEN_COOKIE = 'sb-refresh-token';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = req.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

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
      const username = await resolveUsername(supabase, data.user.id, data.user.user_metadata);
      return NextResponse.json({
        ok: true,
        user: {
          username,
          email: data.user.email ?? null,
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

  const username = await resolveUsername(
    supabase,
    refreshData.user.id,
    refreshData.user.user_metadata
  );

  const res = NextResponse.json({
    ok: true,
    user: {
      username,
      email: refreshData.user.email ?? null,
    },
  });

  setAuthCookies(res, refreshData.session);
  return res;
}

async function resolveUsername(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  userMetadata: Record<string, unknown> | null | undefined
): Promise<string | null> {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', userId)
    .maybeSingle();

  if (!profileError && profile?.username) {
    return profile.username;
  }

  return typeof userMetadata?.username === 'string' ? userMetadata.username : null;
}
