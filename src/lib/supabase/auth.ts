import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';

const ACCESS_TOKEN_COOKIE = 'sb-access-token';
const REFRESH_TOKEN_COOKIE = 'sb-refresh-token';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

function createAnonClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('[supabase][server] faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en el entorno');
  }

  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });
}

async function createAuthedClient(accessToken: string, refreshToken?: string): Promise<SupabaseClient> {
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });

  if (refreshToken) {
    await client.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
  }

  return client;
}

function createServiceClient(): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('[supabase][server] faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno');
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

export async function getAuthedClientFromRequest(req: NextRequest): Promise<{
  client: SupabaseClient | null;
  refreshedSession?: Session;
  error?: string;
}> {
  const accessToken = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = req.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  if (!accessToken && !refreshToken) {
    return { client: null, error: 'No autenticado' };
  }

  const anonClient = createAnonClient();

  if (accessToken) {
    const { data, error } = await anonClient.auth.getUser(accessToken);
    if (!error && data?.user) {
      return { client: await createAuthedClient(accessToken, refreshToken) };
    }
  }

  if (refreshToken) {
    const { data, error } = await anonClient.auth.refreshSession({ refresh_token: refreshToken });
    if (!error && data?.session) {
      return {
        client: await createAuthedClient(data.session.access_token, data.session.refresh_token),
        refreshedSession: data.session,
      };
    }
  }

  return { client: null, error: 'No autenticado' };
}

export async function getUserIdFromRequest(req: NextRequest): Promise<{
  userId: string | null;
  refreshedSession?: Session;
  error?: string;
}> {
  const accessToken = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = req.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  if (!accessToken && !refreshToken) {
    return { userId: null, error: 'No autenticado' };
  }

  const anonClient = createAnonClient();

  if (accessToken) {
    const { data, error } = await anonClient.auth.getUser(accessToken);
    if (!error && data?.user?.id) {
      return { userId: data.user.id };
    }
  }

  if (refreshToken) {
    const { data, error } = await anonClient.auth.refreshSession({ refresh_token: refreshToken });
    if (!error && data?.session && data.user?.id) {
      return { userId: data.user.id, refreshedSession: data.session };
    }
  }

  return { userId: null, error: 'No autenticado' };
}

export async function getWriteClientFromRequest(req: NextRequest): Promise<{
  client: SupabaseClient | null;
  refreshedSession?: Session;
  error?: string;
}> {
  const auth = await getAuthedClientFromRequest(req);
  if (!auth.client) return auth;

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    return { client: null, error: 'SUPABASE_SERVICE_ROLE_KEY requerido para operaciones de escritura' };
  }

  return { client: createServiceClient(), refreshedSession: auth.refreshedSession };
}
