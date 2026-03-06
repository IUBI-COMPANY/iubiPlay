import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Category, CategoryType, CategorySelections } from '../../types/category';

let supabaseClient: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
    const key =
      process.env.SUPABASE_SERVICE_ROLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      '';

    if (!url || !key) {
      throw new Error('[categories-db] Falta configurar NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE key');
    }

    supabaseClient = createClient(url, key, { auth: { persistSession: false } });
  }

  return supabaseClient;
}

function normalizeCategory(row: Record<string, unknown>): Category {
  return row as unknown as Category;
}

export interface ListCategoriesParams {
  type?: CategoryType;
  search?: string;
  limit?: number;
  offset?: number;
  is_active?: boolean;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

export interface ValidateSelectionsOptions {
  requireLevels?: boolean;
  requireCourses?: boolean;
  requireActive?: boolean;
}

export async function validateCategorySelections(
  selections: CategorySelections,
  options: ValidateSelectionsOptions = {},
  client?: SupabaseClient
): Promise<CategorySelections> {
  const { requireLevels = false, requireCourses = false, requireActive = false } = options;
  const combined = [...(selections.levels ?? []), ...(selections.courses ?? [])];
  const uniqueIds = Array.from(new Set(combined)).filter(Boolean);

  if (uniqueIds.some((id) => !isUuid(id))) {
    throw new Error('Hay categorias con ID invalido');
  }

  if (uniqueIds.length === 0) {
    if (requireLevels || requireCourses) {
      throw new Error('Selecciona al menos un nivel y un curso');
    }
    return { levels: [], courses: [] };
  }

  const supabase = client ?? getSupabaseClient();
  const { data, error } = await supabase
    .from('categories')
    .select('id,type,is_active')
    .in('id', uniqueIds);

  if (error) throw new Error(error.message);

  const rows = data ?? [];
  if (rows.length !== uniqueIds.length) {
    throw new Error('Una o mas categorias no existen');
  }

  if (requireActive && rows.some((row) => row.is_active === false)) {
    throw new Error('Hay categorias inactivas');
  }

  const validated: CategorySelections = { levels: [], courses: [] };
  for (const row of rows) {
    if (row.type === 'level') validated.levels.push(row.id);
    if (row.type === 'course') validated.courses.push(row.id);
  }

  if (requireLevels && validated.levels.length === 0) {
    throw new Error('Selecciona al menos un nivel');
  }

  if (requireCourses && validated.courses.length === 0) {
    throw new Error('Selecciona al menos un curso');
  }

  return validated;
}

export async function listCategories(params: ListCategoriesParams = {}) {
  const { type, search, limit = 50, offset = 0, is_active } = params;
  const supabase = getSupabaseClient();

  let query = supabase
    .from('categories')
    .select('*', { count: 'exact' })
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('name', { ascending: true })
    .range(offset, offset + limit - 1);

  if (type) {
    query = query.eq('type', type);
  }

  if (typeof is_active === 'boolean') {
    query = query.eq('is_active', is_active);
  }

  if (search?.trim()) {
    const term = `%${search.trim()}%`;
    query = query.or(`name.ilike.${term},slug.ilike.${term}`);
  }

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);

  return {
    items: (data ?? []).map((row) => normalizeCategory(row as Record<string, unknown>)),
    total: count ?? 0,
  };
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from('categories').select('*').eq('id', id).single();
  if (error || !data) return null;
  return normalizeCategory(data as Record<string, unknown>);
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .single();
  if (error || !data) return null;
  return normalizeCategory(data as Record<string, unknown>);
}

export async function createCategory(
  input: Omit<Category, 'id' | 'created_at' | 'updated_at'>
): Promise<Category> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('categories')
    .insert(input)
    .select('*')
    .single();
  if (error || !data) throw new Error(error?.message ?? 'No se pudo crear');
  return normalizeCategory(data as Record<string, unknown>);
}

export async function updateCategory(id: string, patch: Partial<Category>): Promise<Category | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('categories')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data ? normalizeCategory(data as Record<string, unknown>) : null;
}

export async function deleteCategory(id: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  const { error, data } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)
    .select('id');
  if (error) throw new Error(error.message);
  return Array.isArray(data) && data.length > 0;
}

export async function setGameCategories(
  gameId: string,
  selections: CategorySelections,
  client?: SupabaseClient
): Promise<void> {
  if (!gameId) return;
  const supabase = client ?? getSupabaseClient();
  const combined = [...(selections.levels ?? []), ...(selections.courses ?? [])];
  const uniqueIds = Array.from(new Set(combined)).filter(Boolean);

  const { error: deleteError } = await supabase.from('game_categories').delete().eq('game_id', gameId);
  if (deleteError) throw new Error(deleteError.message);

  if (uniqueIds.length === 0) return;

  const rows = uniqueIds.map((category_id) => ({ game_id: gameId, category_id }));
  const { error: insertError } = await supabase.from('game_categories').insert(rows);
  if (insertError) throw new Error(insertError.message);
}

export async function getGameCategorySelections(gameId: string): Promise<CategorySelections>;
export async function getGameCategorySelections(
  gameId: string,
  client: SupabaseClient
): Promise<CategorySelections>;
export async function getGameCategorySelections(
  gameId: string,
  client?: SupabaseClient
): Promise<CategorySelections> {
  const supabase = client ?? getSupabaseClient();
  const { data: links, error } = await supabase
    .from('game_categories')
    .select('category_id')
    .eq('game_id', gameId);

  if (error) throw new Error(error.message);

  const ids = (links ?? []).map((row) => row.category_id as string).filter(Boolean);
  if (ids.length === 0) {
    return { levels: [], courses: [] };
  }

  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .select('id,type')
    .in('id', ids);

  if (categoriesError) throw new Error(categoriesError.message);

  const selections: CategorySelections = { levels: [], courses: [] };
  for (const row of categories ?? []) {
    if (row.type === 'level') selections.levels.push(row.id);
    if (row.type === 'course') selections.courses.push(row.id);
  }

  return selections;
}

export async function getCategoriesByGameIds(gameIds: string[]): Promise<Record<string, Category[]>> {
  if (!gameIds.length) return {};
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('game_categories')
    .select('game_id, category:categories(id,name,slug,type,description,is_active,sort_order,created_at,updated_at)')
    .in('game_id', gameIds);

  if (error) throw new Error(error.message);

  const map: Record<string, Category[]> = {};
  for (const row of data ?? []) {
    const gameId = row.game_id as string;
    const rawCategory = row.category as unknown;
    const normalized = Array.isArray(rawCategory) ? rawCategory[0] : rawCategory;

    if (!gameId || !normalized || typeof normalized !== 'object') continue;

    const category = normalizeCategory(normalized as Record<string, unknown>);
    if (!map[gameId]) map[gameId] = [];
    map[gameId].push(category);
  }

  return map;
}
