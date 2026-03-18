import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type ProfileMinimal = {
  id: string;
  username?: string | null;
  email?: string | null;
};

let supabaseClient: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const key =
      process.env.SUPABASE_SERVICE_ROLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      "";

    if (!url || !key) {
      throw new Error("[profiles-db] Falta configurar NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE key");
    }

    supabaseClient = createClient(url, key, { auth: { persistSession: false } });
  }

  return supabaseClient;
}

export async function getProfileById(id: string, client?: SupabaseClient): Promise<ProfileMinimal | null> {
  const supabase = client ?? getSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, email")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as ProfileMinimal;
}
