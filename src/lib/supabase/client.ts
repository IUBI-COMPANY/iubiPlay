"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const rawAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// Limpieza defensiva de variables (evita espacios, saltos, comillas pegadas)
const SUPABASE_URL = rawUrl.trim();
const SUPABASE_ANON_KEY = rawAnonKey.trim().replace(/^['"]|['"]$/g, "");

let browserSupabase: SupabaseClient | null = null;

export function getBrowserSupabaseClient(): SupabaseClient {
    if (typeof window === "undefined") {
        throw new Error("getBrowserSupabaseClient debe ejecutarse en cliente");
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        throw new Error(
            "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY"
        );
    }

    if (!browserSupabase) {
        browserSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: { persistSession: true },
        });
    }

    return browserSupabase;
}


