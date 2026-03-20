import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { setAuthCookies } from '@/src/lib/auth/cookies';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const nextParam = url.searchParams.get('next') ?? '/';
  let safeNext = '/';
  // Only allow relative paths, never full URLs or localhost
  if (/^https?:\/\//i.test(nextParam)) {
    try {
      const nextUrl = new URL(nextParam);
      if (nextUrl.hostname === 'iubi-play.vercel.app') {
        safeNext = nextUrl.pathname + (nextUrl.search || '');
      }
    } catch {
      safeNext = '/';
    }
  } else if (nextParam.startsWith('/')) {
    safeNext = nextParam;
  }

  // (debug) logs eliminados

  if (!code) {
    return NextResponse.redirect(new URL('/auth/login?error=missing_code', req.url));
  }

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return NextResponse.redirect(new URL('/auth/login?error=supabase_config', req.url));
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data?.session) {
    return NextResponse.redirect(new URL('/auth/login?error=auth_callback', req.url));
  }

  // (debug) logs eliminados

  const res = NextResponse.redirect(new URL(`/auth/callback?next=${encodeURIComponent(safeNext)}`, req.url));
  setAuthCookies(res, data.session);
  // (debug) logs eliminados
  return res;
}
