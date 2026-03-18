"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    async function syncSessionAndRedirect() {
      try {
        const params = new URLSearchParams(window.location.search);
        const nextParam = params.get("next") ?? "/";
        const safeNext = nextParam.startsWith("/") ? nextParam : "/";

        const { getBrowserSupabaseClient } = await import("@/src/lib/supabase/client");
        const supabase = getBrowserSupabaseClient();
        const { data: sessionData } = await supabase.auth.getSession();
        if (process.env.NODE_ENV !== "production") {
          console.log("[Auth Callback] session:", sessionData?.session ? "[OK]" : "[NO]");
        }
        if (sessionData?.session) {
          await fetch("/api/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              access_token: sessionData.session.access_token,
              refresh_token: sessionData.session.refresh_token,
              expires_in: sessionData.session.expires_in,
            }),
          });
        }

        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (process.env.NODE_ENV !== "production") {
          console.log("[Auth Callback] /api/auth/me status:", res.status);
        }
        if (!res.ok) {
          router.replace("/auth/login");
          return;
        }

        const data = await res.json();
        if (process.env.NODE_ENV !== "production") {
          console.log("[Auth Callback] user:", data?.user ?? null);
        }
        const user = data?.user ?? null;
        if (!user?.id) {
          router.replace("/auth/login");
          return;
        }

        if (!user.username) {
          router.replace(
            `/auth/google-username?email=${encodeURIComponent(user.email || "")}&id=${encodeURIComponent(user.id)}`
          );
        } else {
          router.replace(safeNext);
        }
      } catch {
        router.replace("/auth/login");
      }
    }

    syncSessionAndRedirect();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
      <span className="text-lg font-bold animate-pulse">Cargando...</span>
    </div>
  );
}
