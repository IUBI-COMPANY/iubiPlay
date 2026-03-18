import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { getUserIdFromRequest } from "@/src/lib/supabase/auth";
import { setAuthCookies } from "@/src/lib/auth/cookies";

const schema = z.object({
  username: z
    .string()
    .trim()
    .min(3)
    .max(20)
    .regex(/^[a-z0-9_]+$/),
});

export async function PATCH(req: NextRequest) {
  const auth = await getUserIdFromRequest(req);
  if (!auth.userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Nombre inválido" }, { status: 400 });
  }

  const normalizedUsername = parsed.data.username.toLowerCase();

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return NextResponse.json({ error: "Configuración de Supabase incompleta" }, { status: 500 });
  }

  const client = SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } })
    : createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });

  const { data: existing } = await client
    .from("profiles")
    .select("id")
    .eq("username", normalizedUsername)
    .neq("id", auth.userId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Nombre de usuario ya existe" }, { status: 409 });
  }

  const { error } = await client
    .from("profiles")
    .update({ username: normalizedUsername })
    .eq("id", auth.userId);

  if (error) {
    return NextResponse.json({ error: "No se pudo actualizar" }, { status: 500 });
  }

  const res = NextResponse.json({ ok: true });
  if (auth.refreshedSession) setAuthCookies(res, auth.refreshedSession);
  return res;
}
