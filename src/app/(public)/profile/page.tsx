"use client";

import React, { useEffect, useState } from "react";
import { z } from "zod";
import { useAuthUser } from "@/src/hooks/useAuthUser";
import { Loader } from "@/src/components/ui/loader";
import { getBrowserSupabaseClient } from "@/src/lib/supabase/client";

const usernameSchema = z
  .string()
  .trim()
  .min(3, "Mínimo 3 caracteres")
  .max(20, "Máximo 20 caracteres")
  .regex(/^[a-z0-9_]+$/, "Solo minúsculas, números y _");

const passwordSchema = z
  .string()
  .min(8, "Mínimo 8 caracteres")
  .max(72, "Máximo 72 caracteres");

export default function ProfilePage() {
  const { user, loading, refresh } = useAuthUser();
  const [username, setUsername] = useState(user?.username ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [classes, setClasses] = useState<Array<{ id: string; name: string; gameCount?: number }>>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);

  useEffect(() => {
    setUsername(user?.username ?? "");
  }, [user?.username]);

  useEffect(() => {
    if (!user) return;
    setLoadingClasses(true);
    (async () => {
      try {
        const res = await fetch("/api/classes?limit=6&page=1");
        const data = await res.json();
        if (res.ok) {
          setClasses(Array.isArray(data?.items) ? data.items : []);
        }
      } finally {
        setLoadingClasses(false);
      }
    })();
  }, [user?.id]);

  if (loading) {
    return (
      <main className="min-h-[50vh] flex items-center justify-center">
        <Loader size={36} />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-[50vh] flex items-center justify-center">
        <span className="text-lg font-bold">Debes iniciar sesión</span>
      </main>
    );
  }

  const handleSave = async () => {
    const parsed = usernameSchema.safeParse(username);
    if (!parsed.success) {
      setMessage(parsed.error.issues[0]?.message ?? "Nombre inválido");
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/profile/username", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: parsed.data }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data?.error || "No se pudo actualizar");
        return;
      }
      setMessage("Nombre actualizado");
      await refresh();
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSave = async () => {
    const parsed = passwordSchema.safeParse(newPassword);
    if (!parsed.success) {
      setPasswordMessage(parsed.error.issues[0]?.message ?? "Contraseña inválida");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage("Las contraseñas no coinciden");
      return;
    }

    setSavingPassword(true);
    setPasswordMessage(null);
    try {
      const supabase = getBrowserSupabaseClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setPasswordMessage(error.message || "No se pudo actualizar la contraseña");
        return;
      }
      setPasswordMessage("Contraseña actualizada");
      setNewPassword("");
      setConfirmPassword("");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <main className="max-w-3xl mx-auto py-12 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-black text-white">Perfil</h1>
        <p className="text-sm text-slate-400">Gestiona tu información básica.</p>
      </header>

      <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 space-y-4">
        <div>
          <p className="text-xs font-semibold text-slate-400">Email</p>
          <p className="text-base font-semibold text-white">{user.email ?? "Sin email"}</p>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 space-y-4">
        <div>
          <p className="text-xs font-semibold text-slate-400">Nombre de usuario</p>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500"
            placeholder="tu_usuario"
          />
        </div>
        {message && <div className="text-sm font-semibold text-violet-300">{message}</div>}
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400">Mis clases</p>
            <p className="text-[11px] text-slate-500">Accesos rápidos a tus clases</p>
          </div>
          <a href="/my-classes" className="text-xs font-semibold text-violet-300 hover:text-violet-200">
            Ver todas
          </a>
        </div>
        {loadingClasses ? (
          <div className="text-sm text-slate-400">Cargando clases...</div>
        ) : classes.length === 0 ? (
          <div className="text-sm text-slate-400">Aún no tienes clases.</div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {classes.map((c) => (
              <a
                key={c.id}
                href={`/my-classes/${c.id}`}
                className="rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate">{c.name}</span>
                  <span className="text-[11px] text-slate-400">{c.gameCount ?? 0} juegos</span>
                </div>
              </a>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 space-y-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-400">Cambiar contraseña</p>
          <p className="text-[11px] text-slate-500">Debes tener sesión activa.</p>
        </div>
        <div className="grid gap-3">
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500"
            placeholder="Nueva contraseña"
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500"
            placeholder="Confirmar contraseña"
          />
        </div>
        {passwordMessage && <div className="text-sm font-semibold text-violet-300">{passwordMessage}</div>}
        <div className="flex gap-2">
          <button
            onClick={handlePasswordSave}
            disabled={savingPassword}
            className="px-4 py-2 rounded-xl bg-slate-200 text-slate-900 text-sm font-semibold disabled:opacity-50"
          >
            {savingPassword ? "Actualizando..." : "Actualizar contraseña"}
          </button>
        </div>
      </section>
    </main>
  );
}
