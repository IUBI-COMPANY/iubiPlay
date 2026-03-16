"use client";


import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SupabaseCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    async function checkProfile() {
      try {
        const { getBrowserSupabaseClient } = await import("@/src/lib/supabase/client");
        const supabase = getBrowserSupabaseClient();
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
    checkProfile();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
      <span className="text-lg font-bold animate-pulse">Cargando...</span>
    </div>
  );
}
