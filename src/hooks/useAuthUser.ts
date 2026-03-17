"use client";

import { getBrowserSupabaseClient } from '@/src/lib/supabase/client';
import { useEffect, useState } from 'react';

export function useAuthUser() {
  const [user, setUser] = useState<null | { id: string; email: string }>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function check() {
      try {
        const supabase = getBrowserSupabaseClient();
        const { data } = await supabase.auth.getUser();
        if (active && data?.user) {
          setUser({ id: data.user.id ?? '', email: data.user.email ?? '' });
        } else if (active) {
          setUser(null);
        }
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    }
    check();
    return () => { active = false; };
  }, []);

  return { user, loading };
}
