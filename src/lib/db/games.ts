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
  categoryId?: string;
  categoryIds?: string[];
  throwOnError?: boolean;
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

async function buildSummarySafe(): Promise<GamesSummary> {
  try {
    return await buildSummary();
  } catch (err) {
    console.error('[games-db] summary error', err);
    return { total: 0, published: 0, draft: 0, archived: 0 };
  }
}

export async function listGames(params: ListGamesParams = {}) {
  const {
    status,
    search,
    limit = 20,
    offset = 0,
    categoryId,
    categoryIds,
    throwOnError = false,
  } = params;
  const supabase = getSupabaseClient();

  const normalizedCategoryIds = Array.from(
    new Set([...(categoryIds ?? []), ...(categoryId ? [categoryId] : [])])
  ).filter(Boolean);

  try {
    let gameIds: string[] | null = null;
    if (normalizedCategoryIds.length > 0) {
      // Get game_ids for EACH category and find the intersection
      const results = await Promise.all(
        normalizedCategoryIds.map((id) =>
          supabase
            .from('game_categories')
            .select('game_id')
            .eq('category_id', id)
            .then(({ data, error }) => {
              if (error) throw new Error(error.message);
              return (data ?? []).map((r) => r.game_id as string);
            })
        )
      );

      // Find intersection
      if (results.length > 0) {
        let intersection = results[0];
        for (let i = 1; i < results.length; i++) {
          const s = new Set(results[i]);
          intersection = intersection.filter((id) => s.has(id));
        }
        
        if (intersection.length === 0) {
          const summary = await buildSummarySafe();
          return { items: [], total: 0, summary };
        }
        gameIds = Array.from(new Set(intersection));
      }
    }

    let itemsQuery = supabase
      .from('games')
      .select('*')
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (gameIds) {
      itemsQuery = itemsQuery.in(ID_COLUMN, gameIds);
    }

    if (status) {
      itemsQuery = itemsQuery.eq('status', status);
    }

    if (search?.trim()) {
      const term = `%${search.trim()}%`;
      itemsQuery = itemsQuery.or(`title.ilike.${term},slug.ilike.${term}`);
    }

    const { data, error } = await itemsQuery;
    if (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[games-db] listGames query error', error);
      }
      return { items: [], total: 0, summary: await buildSummarySafe() };
    }

    let countQuery = supabase
      .from('games')
      .select('id', { count: 'exact', head: true });

    if (gameIds) {
      countQuery = countQuery.in(ID_COLUMN, gameIds);
    }

    if (status) {
      countQuery = countQuery.eq('status', status);
    }

    if (search?.trim()) {
      const term = `%${search.trim()}%`;
      countQuery = countQuery.or(`title.ilike.${term},slug.ilike.${term}`);
    }

    const { count, error: countError } = await countQuery;
    if (countError && process.env.NODE_ENV !== 'production') {
      console.error('[games-db] listGames count error', countError);
    }

    const summary = await buildSummarySafe();

    return {
      items: (data ?? []).map((row) => normalizeGame(row as Record<string, unknown>)),
      total: count ?? (data?.length ?? 0),
      summary,
    };
  } catch (err) {
    if (throwOnError) {
      throw err;
    }

    if (process.env.NODE_ENV !== 'production') {
      console.error('[games-db] listGames error', err);
    }
    const emptySummary: GamesSummary = { total: 0, published: 0, draft: 0, archived: 0 };
    return { items: [], total: 0, summary: emptySummary };
  }
}

export async function getGameById(id: string, client?: SupabaseClient): Promise<Game | null> {
  const supabase = client ?? getSupabaseClient();
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq(ID_COLUMN, id)
    .single();
  if (error || !data) return null;
  return normalizeGame(data as Record<string, unknown>);
}

export async function getGameBySlug(slug: string, client?: SupabaseClient): Promise<Game | null> {
  const supabase = client ?? getSupabaseClient();
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('slug', slug)
    .single();
  if (error || !data) return null;
  return normalizeGame(data as Record<string, unknown>);
}

export async function createGame(
  input: Omit<Game, 'id' | 'created_at' | 'updated_at'>,
  client?: SupabaseClient
): Promise<Game> {
  const supabase = client ?? getSupabaseClient();
  const { data, error } = await supabase.from('games').insert(input).select('*').single();
  if (error || !data) throw new Error(error?.message ?? 'No se pudo crear');
  return normalizeGame(data as Record<string, unknown>);
}

export async function updateGame(
  id: string,
  patch: Partial<Game>,
  client?: SupabaseClient
): Promise<Game | null> {
  const supabase = client ?? getSupabaseClient();
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

export async function deleteGame(id: string, client?: SupabaseClient): Promise<boolean> {
  const supabase = client ?? getSupabaseClient();
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
