import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { UserClass, UserClassGame } from '@/src/types/class';

let supabaseClient: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
    if (!url || !key) throw new Error('Missing Supabase env vars');
    supabaseClient = createClient(url, key, { auth: { persistSession: false } });
  }
  return supabaseClient;
}

export async function listUserClasses(userId: string): Promise<UserClass[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('user_classes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data as UserClass[];
}

export async function listUserClassesPaged(
  userId: string,
  limit: number,
  offset: number
): Promise<{ items: UserClass[]; total: number }> {
  const supabase = getSupabaseClient();
  const { data, error, count } = await supabase
    .from('user_classes')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw new Error(error.message);
  return { items: (data ?? []) as UserClass[], total: count ?? 0 };
}

export async function createUserClass(userId: string, name: string, description?: string): Promise<UserClass> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('user_classes')
    .insert([{ user_id: userId, name, description }])
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data as UserClass;
}

export async function updateUserClass(
  userId: string,
  classId: string,
  name: string,
  description?: string
): Promise<UserClass> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('user_classes')
    .update({ name, description })
    .eq('id', classId)
    .eq('user_id', userId)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data as UserClass;
}

export async function addGameToClass(classId: string, gameId: string): Promise<UserClassGame> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('user_class_games')
    .insert([{ class_id: classId, game_id: gameId }])
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data as UserClassGame;
}

export async function listGamesInClass(classId: string): Promise<UserClassGame[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('user_class_games')
    .select('*')
    .eq('class_id', classId)
    .order('added_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data as UserClassGame[];
}

export async function listClassGameCounts(classIds: string[]): Promise<Record<string, number>> {
  const ids = classIds.filter(Boolean);
  if (ids.length === 0) return {};
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('user_class_games')
    .select('class_id')
    .in('class_id', ids);
  if (error) throw new Error(error.message);
  const counts: Record<string, number> = {};
  (data ?? []).forEach((row) => {
    const id = row.class_id as string;
    counts[id] = (counts[id] ?? 0) + 1;
  });
  return counts;
}

export async function getUserClassById(userId: string, classId: string): Promise<UserClass | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('user_classes')
    .select('*')
    .eq('id', classId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as UserClass) ?? null;
}

export async function deleteUserClass(userId: string, classId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('user_classes')
    .delete()
    .eq('id', classId)
    .eq('user_id', userId)
    .select('id');
  if (error) throw new Error(error.message);
  return Array.isArray(data) && data.length > 0;
}
