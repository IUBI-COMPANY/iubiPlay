"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function GoogleUsernamePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const userId = searchParams.get("id") || "";
  // Sugerir username basado en el email solo en el primer render
  const [username, setUsername] = useState(() => {
    if (email) {
      const suggestion = email.split("@")[0]?.replace(/[^a-z0-9_]/gi, "_").toLowerCase().slice(0, 20);
      return suggestion || "";
    }
    return "";
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Redirección automática si ya tiene username
  useEffect(() => {
    const checkProfile = async () => {
      if (!userId) return;
      try {
        const res = await fetch(`/api/auth/me`, { credentials: 'include', cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          if (json?.user?.username) {
            // Ya tiene username, redirige
            router.replace("/");
          }
        }
      } catch {}
    };
    checkProfile();
  }, [userId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/google/username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, userId }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.message || "No se pudo guardar el nombre de usuario");
        setLoading(false);
        return;
      }
      router.push("/");
    } catch {
      setError("Error de red");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-900 p-8 rounded-xl shadow-lg w-full max-w-md space-y-6"
      >
        <h2 className="text-2xl font-bold text-center text-slate-900 dark:text-white mb-2">
          Elige tu nombre de usuario
        </h2>
        <p className="text-center text-slate-500 dark:text-slate-400 text-sm mb-4">
          Para completar tu registro con Google, elige un nombre de usuario único.
        </p>
        <input
          type="text"
          className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
          placeholder="Nombre de usuario"
          value={username}
          onChange={e => setUsername(e.target.value)}
          minLength={3}
          maxLength={20}
          pattern="^[a-z0-9_]+$"
          required
          autoFocus
        />
        {error && (
          <div className="text-red-500 text-sm text-center">{error}</div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 flex items-center justify-center rounded-xl bg-violet-600 text-white text-sm font-bold transition-all hover:bg-violet-700 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 shadow-lg shadow-violet-500/10"
        >
          {loading ? "Guardando..." : "Guardar y continuar"}
        </button>
      </form>
    </div>
  );
}
