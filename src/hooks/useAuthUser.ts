"use client";

import { getBrowserSupabaseClient } from '@/src/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { ReactNode } from 'react';
import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type AuthProfile = {
  username: string | null;
  role: string | null;
};

export type AuthUser = {
  id: string;
  email: string | null;
  username: string | null;
  role: string;
};

type AuthUserState = {
  user: AuthUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

type ApiMeUser = {
  id: string;
  email: string | null;
  username: string | null;
  role: string | null;
};

type ApiMeResponse =
  | { ok: true; user: ApiMeUser }
  | { ok: false; message?: string };

const AuthUserContext = createContext<AuthUserState | null>(null);

async function fetchProfile(userId: string) {
  const supabase = getBrowserSupabaseClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('username,role')
    .eq('id', userId)
    .maybeSingle<AuthProfile>();

  if (error) return null;
  return data ?? null;
}

function buildAuthUser(authUser: User, profile: AuthProfile | null): AuthUser {
  return {
    id: authUser.id,
    email: authUser.email ?? null,
    username: profile?.username ?? null,
    role: profile?.role ?? 'user',
  };
}

function buildAuthUserFromApi(user: ApiMeUser): AuthUser {
  return {
    id: user.id,
    email: user.email ?? null,
    username: user.username ?? null,
    role: user.role ?? 'user',
  };
}

async function fetchApiUser(): Promise<AuthUser | null> {
  try {
    const res = await fetch('/api/auth/me', {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as ApiMeResponse;
    if (!json || !json.ok) return null;
    return buildAuthUserFromApi(json.user);
  } catch {
    return null;
  }
}

function useAuthUserState(enabled: boolean): AuthUserState {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    const supabase = getBrowserSupabaseClient();

    const safeSetUser = (value: AuthUser | null) => {
      if (active) setUser(value);
    };

    const syncUser = async (authUser: User | null) => {
      if (!authUser) {
        safeSetUser(null);
        return;
      }

      const profile = await fetchProfile(authUser.id);
      if (!active) return;
      safeSetUser(buildAuthUser(authUser, profile));
    };

    const init = async () => {
      if (active) setLoading(true);
      try {
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          await syncUser(data.user);
        } else {
          const apiUser = await fetchApiUser();
          if (active) safeSetUser(apiUser);
        }
      } catch {
        safeSetUser(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    init();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setLoading(true);
      syncUser(session?.user ?? null)
        .catch(() => {
          safeSetUser(null);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [enabled]);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const supabase = getBrowserSupabaseClient();
      const { data } = await supabase.auth.getUser();
      await (async () => {
        if (data?.user) {
          const profile = await fetchProfile(data.user.id);
          setUser(buildAuthUser(data.user, profile));
          return;
        }
        const apiUser = await fetchApiUser();
        setUser(apiUser);
      })();
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  return useMemo(() => ({ user, loading, refresh }), [user, loading, refresh]);
}

export function AuthUserProvider({ children }: { children: ReactNode }) {
  const state = useAuthUserState(true);
  return createElement(AuthUserContext.Provider, { value: state }, children);
}

export function useAuthUser() {
  const context = useContext(AuthUserContext);
  const fallback = useAuthUserState(!context);
  return context ?? fallback;
}
