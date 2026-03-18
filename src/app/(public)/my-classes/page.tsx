"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthUser } from "@/src/hooks/useAuthUser";
import { BookText } from "lucide-react";
import type { UserClass } from "@/src/types/class";

export default function MyClassesPage() {
  const { user, loading: authLoading } = useAuthUser();
  type ClassWithCount = UserClass & { gameCount?: number };
  const [classes, setClasses] = useState<ClassWithCount[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 9;

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetch(`/api/classes?page=${page}&limit=${pageSize}`)
      .then((res) => res.json())
      .then((data) => {
        setClasses(data.items || []);
        setTotal(data.total ?? 0);
        setLoading(false);
      });
  }, [user, page]);

  const startEdit = (c: UserClass) => {
    setEditingId(c.id);
    setEditingName(c.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const saveEdit = async (c: UserClass) => {
    if (!user) return;
    const name = editingName.trim();
    if (!name) return;
    setSavingId(c.id);
    try {
      const res = await fetch(`/api/classes/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (res.ok) {
        setClasses((prev) =>
          prev.map((item) => (item.id === c.id ? { ...item, name: data.name } : item))
        );
        cancelEdit();
      }
    } finally {
      setSavingId(null);
    }
  };

  const createClass = async () => {
    if (!user) return;
    const name = createName.trim();
    if (name.length < 3) {
      setCreateError("Mínimo 3 caracteres");
      return;
    }
    setCreateError(null);
    setCreating(true);
    try {
      const res = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (res.ok) {
        setClasses((prev) => [data, ...prev]);
        setTotal((prev) => prev + 1);
        setCreateName("");
        setShowCreate(false);
      } else {
        setCreateError(data?.error || "No se pudo crear");
      }
    } finally {
      setCreating(false);
    }
  };

  const deleteClass = async (c: UserClass) => {
    if (!user) return;
    const ok = window.confirm(`¿Eliminar la clase "${c.name}"?`);
    if (!ok) return;
    setDeletingId(c.id);
    try {
      const res = await fetch(`/api/classes/${c.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setClasses((prev) => prev.filter((item) => item.id !== c.id));
        setTotal((prev) => Math.max(0, prev - 1));
      }
    } finally {
      setDeletingId(null);
    }
  };

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
        <Link href="/auth/login" className="btn-primary mt-6">Iniciar sesión</Link>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto py-12 space-y-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-violet-600/15 flex items-center justify-center">
            <BookText size={26} className="text-violet-600" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white">Mis Clases</h1>
            <p className="text-sm text-slate-400">Organiza tus recursos por clase y accede rápido.</p>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300">
          <span className="h-2 w-2 rounded-full bg-violet-500" />
          {total} clases
        </div>
      </header>

      <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-4 sm:p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-white">Nueva clase</p>
          <p className="text-xs text-slate-400">Crea una clase para organizar tus juegos.</p>
        </div>
        {showCreate ? (
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <input
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="Nombre de la clase"
              className="w-full sm:w-64 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500"
            />
            <div className="flex gap-2">
              <button
                onClick={createClass}
                disabled={creating}
                className="px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold disabled:opacity-50"
              >
                {creating ? "Creando..." : "Crear"}
              </button>
              <button
                onClick={() => {
                  setShowCreate(false);
                  setCreateError(null);
                }}
                className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
            </div>
            {createError && (
              <div className="text-xs font-semibold text-red-400">{createError}</div>
            )}
          </div>
        ) : (
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold"
          >
            Crear clase
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-lg font-bold animate-pulse text-white">Cargando...</div>
      ) : classes.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-slate-900 p-8 text-center">
          <p className="text-lg font-semibold text-white">Aún no tienes clases creadas</p>
          <p className="text-sm text-slate-400 mt-2">
            Crea una clase al añadir un juego desde su detalle.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((c) => (
            <li
              key={c.id}
              className="group rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-xl shadow-black/10 transition hover:border-violet-500/40 hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {editingId === c.id ? (
                    <input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="w-full rounded-xl border border-violet-500/30 bg-slate-800 px-3 py-2 text-sm font-semibold text-white placeholder:text-slate-500"
                      aria-label="Nombre de la clase"
                    />
                  ) : (
                    <h3 className="text-lg font-bold text-white truncate">{c.name}</h3>
                  )}
                  <p className="text-xs text-slate-500 mt-1">
                    {c.gameCount ?? 0} juegos
                  </p>
                </div>
                <div className="h-10 w-10 rounded-2xl bg-violet-600/15 flex items-center justify-center">
                  <BookText size={18} className="text-violet-500" />
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                {editingId === c.id ? (
                  <>
                    <button
                      onClick={() => saveEdit(c)}
                      disabled={savingId === c.id}
                      className="px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold disabled:opacity-50"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white"
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => startEdit(c)}
                      className="px-4 py-2 text-sm font-semibold text-violet-300 hover:text-white"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => deleteClass(c)}
                      disabled={deletingId === c.id}
                      className="px-4 py-2 text-sm font-semibold text-red-400 hover:text-red-300"
                    >
                      Eliminar
                    </button>
                    <Link href={`/my-classes/${c.id}`} className="px-4 py-2 rounded-xl bg-white text-slate-900 text-sm font-semibold hover:bg-slate-100">
                      Ver detalles
                    </Link>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {total > pageSize && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-xl border border-white/10 bg-slate-900 text-sm font-semibold text-slate-300 disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="text-xs font-semibold text-slate-400">
            Página {page} de {Math.max(1, Math.ceil(total / pageSize))}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= Math.ceil(total / pageSize)}
            className="px-4 py-2 rounded-xl border border-white/10 bg-slate-900 text-sm font-semibold text-slate-300 disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      )}
    </main>
  );
}
