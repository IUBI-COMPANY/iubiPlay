import { NextRequest, NextResponse } from "next/server";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
import { setAuthCookies } from "@/src/lib/auth/cookies";
import crypto from "crypto";

type Body = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body | null;
    const accessToken = body?.access_token ?? "";
    const refreshToken = body?.refresh_token ?? "";

    if (!accessToken || !refreshToken) {
      return NextResponse.json({ ok: false, message: "Tokens faltantes" }, { status: 400 });
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return NextResponse.json(
        { ok: false, message: "Configuración de Supabase incompleta" },
        { status: 500 }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    });

    const { data, error } = await supabase.auth.getUser(accessToken);
    if (error || !data?.user) {
      return NextResponse.json({ ok: false, message: "Token inválido" }, { status: 401 });
    }

    const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
    const profileClient = SERVICE_ROLE_KEY
      ? createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } })
      : createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          auth: { persistSession: false },
          global: { headers: { Authorization: `Bearer ${accessToken}` } },
        });

    let sessionToken: string | null = null;
    try {
      const { data: existingProfile } = await profileClient
        .from("profiles")
        .select("id,session_token")
        .eq("id", data.user.id)
        .maybeSingle();
      if (!existingProfile) {
        sessionToken = crypto.randomUUID();
        await profileClient
          .from("profiles")
          .insert({
            id: data.user.id,
            email: data.user.email ?? null,
            role: "user",
            session_token: sessionToken,
          });
      } else if (!existingProfile.session_token) {
        sessionToken = crypto.randomUUID();
        await profileClient
          .from("profiles")
          .update({ session_token: sessionToken })
          .eq("id", data.user.id);
      }
    } catch (profileError) {
      // (debug) logs eliminados
    }

    const res = NextResponse.json({ ok: true });
    const session = {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: body?.expires_in ?? 60 * 60,
      token_type: "bearer",
      user: data.user,
    } as Session;
    setAuthCookies(res, session);
    if (sessionToken) {
      res.cookies.set("session_token", sessionToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
      res.cookies.set("sb-user-id", data.user.id, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    }
    return res;
  } catch {
    return NextResponse.json({ ok: false, message: "Error interno" }, { status: 500 });
  }
}
