"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthUser } from "@/src/hooks/useAuthUser";
import type { Game } from "@/src/types/game";

type Props = { params: Promise<{ id: string }> };

export default function MyClassDetailPage({ params }: Props) {
  const { user, loading: authLoading } = useAuthUser();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { id } = await params;
      if (!user) return;
      try {
        const res = await fetch(`/api/classes/${id}/games`);
        const data = await res.json();
        if (!active) return;
        setGames(data.items || []);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [params, user]);

  if (authLoading) {
    return (
      <main className="min-h-[50vh] flex items-center justify-center">
        <span className="text-lg font-bold animate-pulse">Cargando...</span>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-[50vh] flex flex-col items-center justify-center">
        <h1 className="text-3xl font-black">Debes iniciar sesión</h1>
        <Link href="/auth/login" className="btn-primary mt-6">
          Iniciar sesión
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto py-12 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Juegos de la clase</h1>
          <p className="text-sm text-slate-400">Accede rápido a los recursos guardados.</p>
        </div>
        <Link href="/my-classes" className="text-sm font-semibold text-violet-400 hover:text-violet-300">
          Volver
        </Link>
      </div>

      {loading ? (
        <div className="text-lg font-bold animate-pulse">Cargando...</div>
      ) : games.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-slate-900 p-8 text-center">
          <p className="text-lg font-semibold text-white">Aún no hay juegos en esta clase</p>
          <p className="text-sm text-slate-400 mt-2">Agrega juegos desde su detalle.</p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => (
            <li key={game.id} className="rounded-3xl border border-white/10 bg-slate-900/80 p-4 shadow-xl shadow-black/10">
              <div className="w-full h-40 rounded-2xl overflow-hidden bg-slate-800 mb-3">
                <img
                  src={game.cover_image_url || game.hero_image_url || "/file.svg"}
                  alt={game.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <h2 className="font-bold text-white">{game.title}</h2>
              {game.short_description && (
                <p className="text-sm text-slate-400 mt-1">{game.short_description}</p>
              )}
              <Link href={`/games/${game.slug}`} className="mt-4 inline-flex px-4 py-2 rounded-xl bg-white text-slate-900 text-sm font-semibold hover:bg-slate-100">
                Ver juego
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
