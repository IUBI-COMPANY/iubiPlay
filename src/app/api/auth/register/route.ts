import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { setAuthCookies } from '@/src/lib/auth/cookies';

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

interface RegisterBody {
  email: string;
  password: string;
  username: string;
}

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? 'unknown';
  return req.headers.get('x-real-ip') ?? 'unknown';
}

function isRateLimited(ip: string) {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || entry.resetAt <= now) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { limited: false, retryAfter: 0 };
  }

  entry.count += 1;
  if (entry.count > RATE_LIMIT_MAX) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { limited: true, retryAfter };
  }

  return { limited: false, retryAfter: 0 };
}

function parseRegisterBody(data: unknown): RegisterBody | null {
  if (!data || typeof data !== 'object') return null;
  const record = data as Record<string, unknown>;

  if (
    typeof record.email !== 'string' ||
    typeof record.password !== 'string' ||
    typeof record.username !== 'string'
  ) {
    return null;
  }

  return {
    email: record.email.trim(),
    password: record.password,
    username: record.username.trim().toLowerCase(),
  };
}

// Handler para POST /api/auth/register
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rate = isRateLimited(ip);
    if (rate.limited) {
      return NextResponse.json(
        { ok: false, message: 'Demasiadas solicitudes. Intenta más tarde.' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfter) } }
      );
    }

    const body = parseRegisterBody(await req.json());
    if (!body) {
      return NextResponse.json({ ok: false, message: 'Body inválido' }, { status: 400 });
    }

    const email = body.email;
    const password = body.password;
    const username = body.username;

    // Validaciones basicas
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ ok: false, message: 'Email invalido' }, { status: 400 });
    }
    if (!password || password.length < 8) {
      return NextResponse.json(
        { ok: false, message: 'La contrasena debe tener al menos 8 caracteres' },
        { status: 400 }
      );
    }
    if (!username || !/^[a-z0-9_]{3,20}$/.test(username)) {
      return NextResponse.json(
        { ok: false, message: 'Nombre de usuario invalido' },
        { status: 400 }
      );
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
    const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return NextResponse.json(
        { ok: false, message: 'Configuración de Supabase incompleta' },
        { status: 500 }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    });

    const { data: existingProfile, error: profileLookupError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (profileLookupError) {
      return NextResponse.json(
        { ok: false, message: 'No se pudo validar el nombre de usuario' },
        { status: 500 }
      );
    }

    if (existingProfile) {
      return NextResponse.json(
        { ok: false, message: 'El nombre de usuario ya existe' },
        { status: 409 }
      );
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${req.nextUrl.origin}/api/auth/callback`,
        data: {
          username,
        },
      },
    });

    if (error) {
      const message = process.env.NODE_ENV !== 'production'
        ? error.message
        : 'No se pudo crear el usuario';
      return NextResponse.json({ ok: false, message }, { status: 400 });
    }

    if (!data?.user) {
      return NextResponse.json(
        { ok: false, message: 'No se pudo crear el usuario' },
        { status: 400 }
      );
    }

    let res: NextResponse;
    if (data?.session && data?.user) {
      // Crea o actualiza el perfil en profiles
      await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          email: data.user.email,
          username,
        }, { onConflict: 'id' });

      setAuthCookies(res = NextResponse.redirect(new URL('/', req.url)), data.session);
      // --- Sesión única: genera y guarda session_token, setea cookies ---
      const crypto = await import('crypto');
      const sessionToken = crypto.randomUUID();
      await supabase
        .from('profiles')
        .update({ session_token: sessionToken })
        .eq('id', data.user.id);

      res.cookies.set('session_token', sessionToken, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      });
      res.cookies.set('sb-user-id', data.user.id, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      });
      // --- fin sesión única ---
    } else {
      // Si no hay sesión (registro con confirmación por correo), responde normal
      res = NextResponse.json(
        { ok: true, message: 'Revisa tu correo para continuar' },
        { status: 201 }
      );
    }
    return res;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error interno';
    if (process.env.NODE_ENV !== 'production') {
      return NextResponse.json({ ok: false, message }, { status: 500 });
    }
    return NextResponse.json({ ok: false, message: 'Error interno' }, { status: 500 });
  }
}
