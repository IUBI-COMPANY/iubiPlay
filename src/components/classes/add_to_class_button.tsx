"use client";
import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Plus } from "lucide-react";
import { useAuthUser } from "@/src/hooks/useAuthUser";
import type { Game } from "@/src/types/game";
import type { UserClass } from "@/src/types/class";
import { z } from "zod";

interface Props {
  game: Game;
}

export function AddToClassButton({ game }: Props) {
  const { user } = useAuthUser();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [classes, setClasses] = useState<UserClass[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creatingName, setCreatingName] = useState("");
  const [creating, setCreating] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [selectedHasGame, setSelectedHasGame] = useState(false);

  const nameSchema = useMemo(
    () => z.string().trim().min(3, "Mínimo 3 caracteres").max(40, "Máximo 40 caracteres"),
    []
  );

  useEffect(() => {
    if (!isOpen || !user) return;
    let active = true;
    (async () => {
      const res = await fetch("/api/classes");
      const data = await res.json();
      if (!active) return;
      if (res.ok) {
        setClasses(data.items || []);
        setSelectedId(data.items?.[0]?.id ?? null);
      } else {
        setError(data?.error || "Error al obtener clases");
      }
    })();
    return () => {
      active = false;
    };
  }, [isOpen, user]);

  useEffect(() => {
    if (!isOpen || !user || !selectedId) {
      setSelectedHasGame(false);
      return;
    }
    let active = true;
    (async () => {
      const res = await fetch(`/api/classes/${selectedId}/games`);
      const data = await res.json();
      if (!active) return;
      const items: Game[] = Array.isArray(data.items) ? data.items : [];
      const exists = items.some((item: Game) => item?.id === game.id);
      setSelectedHasGame(exists);
    })();
    return () => {
      active = false;
    };
  }, [isOpen, selectedId, user, game.id]);

  const canAdd = useMemo(() => {
    if (classes.length > 0) return Boolean(selectedId);
    return creatingName.trim().length > 0;
  }, [classes.length, selectedId, creatingName]);

  const handleOpen = () => {
    if (!user) {
      window.location.href = `/auth/login?redirectTo=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    setError(null);
    setSuccess(false);
    setIsOpen(true);
    setNameError(null);
  };

  const handleCreateClass = async (): Promise<string | null> => {
    if (!user) return null;
    const parsed = nameSchema.safeParse(creatingName);
    if (!parsed.success) {
      setNameError(parsed.error.issues[0]?.message ?? "Nombre inválido");
      return null;
    }
    const name = parsed.data;
    try {
      setCreating(true);
      const createRes = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const created = await createRes.json();
      if (!createRes.ok) {
        setError(created?.error || "No se pudo crear la clase");
        return null;
      }
      const newClass = created as UserClass;
      setClasses((prev) => [newClass, ...prev]);
      setSelectedId(newClass.id);
      setCreatingName("");
      setNameError(null);
      return newClass.id;
    } catch {
      setError("No se pudo crear la clase");
      return null;
    } finally {
      setCreating(false);
    }
  };

  const handleAdd = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      let classId = selectedId;
      if (selectedHasGame) {
        setError("Este juego ya está en la clase seleccionada");
        return;
      }
      if (!classes.length) {
        classId = await handleCreateClass();
      }
      if (!classId) {
        setError("Selecciona o crea una clase");
        return;
      }
      const res2 = await fetch("/api/classes/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId, gameId: game.id }),
      });
      if (!res2.ok) {
        const err = await res2.json();
        const message =
          err?.error?.toLowerCase?.().includes("duplicate") ||
          err?.error?.toLowerCase?.().includes("unique")
            ? "Este juego ya está en esa clase"
            : err.error || "Error al añadir a la clase";
        setError(message);
        return;
      }
      setSuccess(true);
      setIsOpen(false);
    } catch {
      setError("Error al añadir a la clase");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        className="w-full h-14 rounded-3xl border border-violet-600 bg-violet-600 text-white font-semibold flex items-center justify-center gap-3 shadow-xl shadow-violet-500/10 hover:bg-violet-700 hover:border-violet-700 transition px-8 text-[14.5px] disabled:opacity-70 disabled:cursor-not-allowed"
        onClick={handleOpen}
        disabled={loading}
        aria-label="Add to My Class"
      >
        <Plus size={24} />
        {success ? "¡Añadido!" : "Añadir a mi clase"}
      </button>

      {isOpen &&
        createPortal(
          <div className="fixed inset-0 z-[80] flex items-center justify-center">
            <div
              className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
          <div className="relative w-full max-w-md mx-4 rounded-3xl bg-slate-900 text-white p-6 shadow-2xl border border-slate-800 transition-all duration-200 animate-in fade-in-0 zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Añadir a clase</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="mb-4 text-sm font-medium text-red-400">{error}</div>
            )}

              {classes.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-slate-300">Selecciona una clase</p>
                  <div className="space-y-2 max-h-56 overflow-auto">
                    {classes.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedId(c.id)}
                      className={`w-full text-left px-4 py-3 rounded-2xl border transition ${
                        selectedId === c.id
                          ? "border-violet-500/60 bg-violet-500/10 text-violet-200"
                          : "border-slate-700 hover:border-violet-400 text-slate-200"
                      }`}
                    >
                      {c.name}
                    </button>
                    ))}
                  </div>
                  {selectedHasGame && (
                    <div className="text-xs font-semibold text-amber-300">
                      Este juego ya está en la clase seleccionada.
                    </div>
                  )}
                  <div className="pt-2">
                    <p className="text-xs font-semibold text-slate-400 mb-2">¿Crear nueva clase?</p>
                    <div className="flex gap-2">
                      <input
                        value={creatingName}
                        onChange={(e) => setCreatingName(e.target.value)}
                        placeholder="Nombre de la clase"
                        className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500"
                      />
                      <button
                        onClick={handleCreateClass}
                        disabled={creating || !creatingName.trim()}
                        className="px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold disabled:opacity-50"
                      >
                        Crear
                      </button>
                    </div>
                    {nameError && (
                      <div className="mt-2 text-xs font-semibold text-red-400">{nameError}</div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-slate-300">Crea tu primera clase</p>
                  <input
                    value={creatingName}
                    onChange={(e) => setCreatingName(e.target.value)}
                    placeholder="Nombre de la clase"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500"
                  />
                  {nameError && (
                    <div className="text-xs font-semibold text-red-400">{nameError}</div>
                  )}
                </div>
              )}

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleAdd}
                disabled={loading || !canAdd}
                className="px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold disabled:opacity-50"
              >
                {loading ? "Añadiendo..." : "Añadir"}
              </button>
            </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
