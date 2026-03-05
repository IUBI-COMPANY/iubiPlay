import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Game, GameStatus } from '../../types/game';

let supabaseClient: SupabaseClient | null = null;
const ID_COLUMN = process.env.GAMES_ID_COLUMN ?? 'id';

function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
    const key =
      process.env.SUPABASE_SERVICE_ROLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      '';

    if (!url || !key) {
      throw new Error('[games-db] Falta configurar NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE key');
    }

    supabaseClient = createClient(url, key, { auth: { persistSession: false } });
  }

  return supabaseClient;
}

function normalizeGame(row: Record<string, unknown>): Game {
  const normalizedId = row[ID_COLUMN];
  const base = row as unknown as Partial<Game>;
  return {
    ...base,
    id: typeof normalizedId === 'string' ? normalizedId : String(normalizedId ?? ''),
  } as Game;
}

export interface ListGamesParams {
  status?: GameStatus;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface GamesSummary {
  total: number;
  published: number;
  draft: number;
  archived: number;
}

async function countByStatus(status: GameStatus): Promise<number> {
  const supabase = getSupabaseClient();
  const { count, error } = await supabase
    .from('games')
    .select('id', { count: 'exact', head: true })
    .eq('status', status);

  if (error) throw new Error(error.message);
  return count ?? 0;
}

async function buildSummary(): Promise<GamesSummary> {
  const [published, draft, archived] = await Promise.all([
    countByStatus('published'),
    countByStatus('draft'),
    countByStatus('archived'),
  ]);

  return {
    total: published + draft + archived,
    published,
    draft,
    archived,
  };
}

export async function listGames(params: ListGamesParams = {}) {
  const { status, search, limit = 20, offset = 0 } = params;
  const supabase = getSupabaseClient();

  let query = supabase
    .from('games')
    .select('*', { count: 'exact' })
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq('status', status);
  }

  if (search?.trim()) {
    const term = `%${search.trim()}%`;
    query = query.or(`title.ilike.${term},slug.ilike.${term}`);
  }

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);

  const summary = await buildSummary();

  return {
    items: (data ?? []).map((row) => normalizeGame(row as Record<string, unknown>)),
    total: count ?? 0,
    summary,
  };
}

export async function getGameById(id: string): Promise<Game | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq(ID_COLUMN, id)
    .single();
  if (error || !data) return null;
  return normalizeGame(data as Record<string, unknown>);
}

export async function createGame(input: Omit<Game, 'id' | 'created_at' | 'updated_at'>): Promise<Game> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from('games').insert(input).select('*').single();
  if (error || !data) throw new Error(error?.message ?? 'No se pudo crear');
  return normalizeGame(data as Record<string, unknown>);
}

export async function updateGame(id: string, patch: Partial<Game>): Promise<Game | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('games')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq(ID_COLUMN, id)
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data ? normalizeGame(data as Record<string, unknown>) : null;
}

export async function deleteGame(id: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  const { error, data } = await supabase
    .from('games')
    .delete()
    .eq(ID_COLUMN, id)
    .select(ID_COLUMN);
  if (error) {
    throw new Error(error.message);
  }
  return Array.isArray(data) && data.length > 0;
}
