import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/src/lib/supabase/server';

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

interface RegisterBody {
  email: string;
  password: string;
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

  if (typeof record.email !== 'string' || typeof record.password !== 'string') return null;

  return {
    email: record.email.trim(),
    password: record.password,
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

    // Validaciones básicas
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ ok: false, message: 'Email inválido' }, { status: 400 });
    }
    if (!password || password.length < 8) {
      return NextResponse.json({ ok: false, message: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();


    const { error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
    });

    if (error) {
      const message = process.env.NODE_ENV !== 'production'
        ? error.message
        : 'No se pudo crear el usuario';
      return NextResponse.json({ ok: false, message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, message: 'Revisa tu correo para continuar' }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error interno';
    if (process.env.NODE_ENV !== 'production') {
      return NextResponse.json({ ok: false, message }, { status: 500 });
    }
    return NextResponse.json({ ok: false, message: 'Error interno' }, { status: 500 });
  }
}
