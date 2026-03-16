"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    async function syncSessionAndRedirect() {
      try {
        const { getBrowserSupabaseClient } = await import("@/src/lib/supabase/client");
        const supabase = getBrowserSupabaseClient();
        // Forzar la sincronización de la sesión
        await supabase.auth.getSession();
        // Ahora consulta el usuario
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.replace("/auth/login");
          return;
        }
        // Busca el perfil en la tabla profiles
        const { data: profile } = await supabase
          .from("profiles")
          .select("username,email,id")
          .eq("id", user.id)
          .maybeSingle();
        if (!profile?.username) {
          router.replace(`/auth/google-username?email=${encodeURIComponent(profile?.email || user.email || "")}&id=${encodeURIComponent(user.id)}`);
        } else {
          router.replace("/");
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
