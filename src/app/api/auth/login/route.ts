import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { setAuthCookies } from '@/src/lib/auth/cookies';
import crypto from 'crypto';

interface LoginBody {
  email: string;
  password: string;
}

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 8;
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? 'unknown';
  return req.headers.get('x-real-ip') ?? 'unknown';
}

function isRateLimited(key: string) {
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  if (!entry || entry.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { limited: false, retryAfter: 0 };
  }
  entry.count += 1;
  if (entry.count > RATE_LIMIT_MAX) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { limited: true, retryAfter };
  }
  return { limited: false, retryAfter: 0 };
}

function parseLoginBody(data: unknown): LoginBody | null {
  if (!data || typeof data !== 'object') return null;
  const record = data as Record<string, unknown>;
  if (typeof record.email !== 'string' || typeof record.password !== 'string') return null;
  return { email: record.email.trim(), password: record.password };
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const ipRate = isRateLimited(`ip:${ip}`);
    if (ipRate.limited) {
      return NextResponse.json(
        { ok: false, message: 'Demasiadas solicitudes. Intenta más tarde.' },
        { status: 429, headers: { 'Retry-After': String(ipRate.retryAfter) } }
      );
    }

    const body = parseLoginBody(await req.json());
    if (!body) {
      return NextResponse.json({ ok: false, message: 'Body inválido' }, { status: 400 });
    }

    const emailRate = isRateLimited(`email:${body.email.toLowerCase()}`);
    if (emailRate.limited) {
      return NextResponse.json(
        { ok: false, message: 'Demasiadas solicitudes. Intenta más tarde.' },
        { status: 429, headers: { 'Retry-After': String(emailRate.retryAfter) } }
      );
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
    const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return NextResponse.json({ ok: false, message: 'Configuración de Supabase incompleta' }, { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
    const { data, error } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password,
    });

    if (error || !data.session) {
      const isUnconfirmed = error?.message?.toLowerCase().includes('email not confirmed');
      if (isUnconfirmed) {
        return NextResponse.json(
          { ok: false, message: 'Debes confirmar tu correo antes de iniciar sesión' },
          { status: 403 }
        );
      }

      const message = process.env.NODE_ENV !== 'production'
        ? error?.message ?? 'Login fallido'
        : 'Credenciales inválidas';
      return NextResponse.json({ ok: false, message }, { status: 401 });
    }

      // --- Redirección tras login exitoso para setear cookies correctamente ---
      let redirectTo = req.nextUrl.searchParams.get('redirectTo') || '/';
      // Only allow relative paths, never full URLs or localhost
      if (/^https?:\/\//i.test(redirectTo)) {
        try {
          const url = new URL(redirectTo);
          // Only allow our production domain
          if (url.hostname !== 'iubi-play.vercel.app') {
            redirectTo = '/';
          } else {
            redirectTo = url.pathname + (url.search || '');
          }
        } catch {
          redirectTo = '/';
        }
      } else if (!redirectTo.startsWith('/')) {
        redirectTo = '/';
      }
      const res = NextResponse.redirect(new URL(redirectTo, req.url));
    setAuthCookies(res, data.session);

    // --- Sesión única: genera y guarda session_token, setea cookies ---
    const userId = data.user?.id;
    if (userId) {
      const sessionToken = crypto.randomUUID();
      await supabase
        .from('profiles')
        .update({ session_token: sessionToken })
        .eq('id', userId);

      res.cookies.set('session_token', sessionToken, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      });
      res.cookies.set('sb-user-id', userId, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      });
    }
    // --- fin sesión única ---
      return res; // This line remains unchanged
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error interno';
    if (process.env.NODE_ENV !== 'production') {
      return NextResponse.json({ ok: false, message }, { status: 500 });
    }
    return NextResponse.json({ ok: false, message: 'Error interno' }, { status: 500 });
  }
}
