import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  const { username, userId } = await req.json();
  if (!username || !userId) {
    return NextResponse.json({ ok: false, message: 'Datos incompletos' }, { status: 400 });
  }
  if (!/^[a-z0-9_]{3,20}$/.test(username)) {
    return NextResponse.json({ ok: false, message: 'Nombre de usuario inválido' }, { status: 400 });
  }
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });

  // Verifica que no exista el username
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ ok: false, message: 'Ese nombre de usuario ya existe' }, { status: 409 });
  }

  // Actualiza el profile
  const { error } = await supabase
    .from('profiles')
    .update({ username })
    .eq('id', userId);
  if (error) {
    return NextResponse.json({ ok: false, message: 'No se pudo guardar el nombre de usuario' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
