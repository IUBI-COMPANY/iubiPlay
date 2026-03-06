import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const ACCESS_TOKEN_COOKIE = 'sb-access-token';

/**
 * Crea un cliente de Supabase para uso en servidor (server-side).
 * Usar sólo en rutas API o en server components. NO exponer la service role key al cliente.
 * Variables esperadas:
 * - process.env.SUPABASE_SERVICE_ROLE_KEY (secreta)
 * - process.env.NEXT_PUBLIC_SUPABASE_URL
 */
export function createServerSupabaseClient(): SupabaseClient {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    // Fallar temprano para evitar errores ambiguos como "supabaseKey is required".
    throw new Error('[supabase][server] faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno');
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      // En servidor normalmente no persistes sesión en localStorage.
      persistSession: false,
    },
  });
}

export function createServerSupabaseClientWithAuth(token: string): SupabaseClient {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('[supabase][server] faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en el entorno');
  }

  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

export async function getServerSupabaseClientFromCookies(): Promise<SupabaseClient | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) return null;

  return createServerSupabaseClientWithAuth(token);
}
