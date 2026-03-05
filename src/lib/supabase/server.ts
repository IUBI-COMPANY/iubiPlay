import { createClient, type SupabaseClient } from '@supabase/supabase-js';

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
    throw new Error('[supabase][server] faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno');
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      // En servidor normalmente no persistes sesión en localStorage.
      persistSession: false,
    },
  });
}
