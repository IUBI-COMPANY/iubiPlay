import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { setAuthCookies } from '@/src/lib/auth/cookies';

interface LoginBody {
  email: string;
  password: string;
}

function parseLoginBody(data: unknown): LoginBody | null {
  if (!data || typeof data !== 'object') return null;
  const record = data as Record<string, unknown>;
  if (typeof record.email !== 'string' || typeof record.password !== 'string') return null;
  return { email: record.email.trim(), password: record.password };
}

export async function POST(req: NextRequest) {
  try {
    const body = parseLoginBody(await req.json());
    if (!body) {
      return NextResponse.json({ ok: false, message: 'Body inválido' }, { status: 400 });
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

    const res = NextResponse.json({ ok: true, message: 'Login exitoso' });
    setAuthCookies(res, data.session);
    return res;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error interno';
    if (process.env.NODE_ENV !== 'production') {
      return NextResponse.json({ ok: false, message }, { status: 500 });
    }
    return NextResponse.json({ ok: false, message: 'Error interno' }, { status: 500 });
  }
}
