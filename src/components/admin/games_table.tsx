"use client";

import React from 'react';
import Link from 'next/link';
import type { Game } from '../../types/game';
import type { Category } from '../../types/category';
import { 
  Plus, 
  Search, 
  Sparkles, 
  Trash2, 
  Edit3, 
  Eye, 
  EyeOff,
  Clock,
  CheckCircle2,
  Archive,
  Filter,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Gamepad2
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

type GamesResponse = {
  items: Game[];
  total: number;
  summary: {
    total: number;
    published: number;
    draft: number;
    archived: number;
  };
  categoriesByGameId?: Record<string, Category[]>;
};

const inputClass =
  'w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/10 transition-all';

const PAGE_SIZE = 10;
const CATEGORIES_CACHE_KEY = 'iubiplay:categories:active';
const CATEGORIES_CACHE_TTL_MS = 5 * 60 * 1000;

export function GamesTable() {
  const [items, setItems] = React.useState<Game[]>([]);
  const [summary, setSummary] = React.useState<GamesResponse['summary']>({
    total: 0,
    published: 0,
    draft: 0,
    archived: 0,
  });
  const [total, setTotal] = React.useState(0);
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [categoryIds, setCategoryIds] = React.useState<string[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [categoriesByGameId, setCategoriesByGameId] = React.useState<Record<string, Category[]>>({});

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const loadCategories = React.useCallback(async () => {
    try {
      if (typeof window !== 'undefined') {
        const cached = window.sessionStorage.getItem(CATEGORIES_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached) as { ts: number; items: Category[] };
          if (Date.now() - parsed.ts < CATEGORIES_CACHE_TTL_MS) {
            setCategories(Array.isArray(parsed.items) ? parsed.items : []);
            return;
          }
        }
      }

      const res = await fetch('/api/categories?is_active=true&limit=500');
      if (!res.ok) return;
      const data = (await res.json()) as { items: Category[] };
      const items = Array.isArray(data.items) ? data.items : [];
      setCategories(items);

      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(
          CATEGORIES_CACHE_KEY,
          JSON.stringify({ ts: Date.now(), items })
        );
      }
    } catch {
      // ignore
    }
  }, []);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (status) params.set('status', status);
      if (categoryIds.length) params.set('category_ids', categoryIds.join(','));
      params.set('limit', String(PAGE_SIZE));
      params.set('offset', String((page - 1) * PAGE_SIZE));

      const res = await fetch(`/api/games?${params.toString()}`, { cache: 'no-store' });
      const data = (await res.json()) as GamesResponse;

      if (!res.ok) {
        setError('No se pudo cargar el listado');
        setLoading(false);
        return;
      }

      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
      setSummary(data.summary ?? { total: 0, published: 0, draft: 0, archived: 0 });
      setCategoriesByGameId(data.categoriesByGameId ?? {});
    } catch {
      setError('Error al cargar el listado');
    } finally {
      setLoading(false);
    }
  }, [search, status, categoryIds, page]);

  React.useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const togglePublish = async (game: Game) => {
    if (!game.id) {
      setError('ID inválido del juego');
      return;
    }
    const nextStatus = game.status === 'published' ? 'draft' : 'published';
    try {
      const res = await fetch(`/api/games/${game.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        setError(payload?.message ?? 'No se pudo actualizar el estado');
        return;
      }
      await load();
    } catch {
      setError('Error al actualizar el estado');
    }
  };

  const deleteItem = async (game: Game) => {
    if (!game.id) {
      setError('ID inválido del juego');
      return;
    }
    if (!confirm(`Eliminar "${game.title}"?`)) return;
    try {
      const res = await fetch(`/api/games/${game.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        setError(payload?.message ?? 'No se pudo eliminar el juego');
        return;
      }
      await load();
    } catch {
      setError('Error al eliminar el juego');
    }
  };

  const onApplyFilters = () => {
    setPage(1);
    void load();
  };

  const getCategoryLabel = (gameId: string) => {
    const gameCategories = categoriesByGameId[gameId] ?? [];
    if (gameCategories.length === 0) return 'Sin categorías';
    const levels = gameCategories.filter((cat) => cat.type === 'level').map((cat) => cat.name);
    const courses = gameCategories.filter((cat) => cat.type === 'course').map((cat) => cat.name);
    const parts: string[] = [];
    if (levels.length) parts.push(`Nivel: ${levels.join(', ')}`);
    if (courses.length) parts.push(`Curso: ${courses.join(', ')}`);
    return parts.join(' | ');
  };

  return (
    <section className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
        {[
          { label: 'Total recursos', value: summary.total, color: 'text-violet-600', icon: Gamepad2 },
          { label: 'Publicados', value: summary.published, color: 'text-emerald-500', icon: CheckCircle2 },
          { label: 'Borradores', value: summary.draft, color: 'text-amber-500', icon: Clock },
          { label: 'Archivados', value: summary.archived, color: 'text-slate-400', icon: Archive },
        ].map((stat) => (
          <div key={stat.label} className="card-startup">
            <div className="card-startup-inner gap-2!">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  {stat.label}
                </p>
                <stat.icon size={14} className="text-slate-300 dark:text-slate-600" />
              </div>
              <p className={cn("text-3xl font-black tracking-tight", stat.color)}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-900 border border-slate-700 p-6 rounded-[2.5rem] flex flex-col gap-4 lg:flex-row lg:items-end">
        <div className="flex-1 space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">Búsqueda rápida</label>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 transition-colors" size={18} />
            <input
              className={cn(inputClass, "pl-12 h-12")}
              placeholder="Escribe título o slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        
        <div className="w-full lg:w-48 space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">Estado</label>
          <select
            className={cn(inputClass, "h-12 appearance-none")}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="published">Publicado</option>
            <option value="draft">Borrador</option>
            <option value="archived">Archivado</option>
          </select>
        </div>

        <button
          onClick={onApplyFilters}
          disabled={loading}
          className="btn-primary h-12 flex items-center justify-center gap-2 group min-w-[140px]"
        >
          {loading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          ) : (
            <>
              <Filter size={18} className="transition-transform group-hover:rotate-12" />
              <span>Filtrar</span>
            </>
          )}
        </button>

        <Link
          href="/admin/games/new"
          className="btn-primary h-12 flex items-center justify-center gap-2 bg-linear-to-br from-emerald-500 to-teal-600 shadow-emerald-500/20"
        >
          <Plus size={18} />
          <span>Nuevo recurso</span>
        </Link>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-2xl text-sm font-medium animate-shake">
          {error}
        </div>
      )}

      {/* Table Section */}
      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-700 text-sm">
            <thead className="bg-slate-800">
              <tr>
                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Media</th>
                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Recurso & Info</th>
                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 hidden md:table-cell">Identificador</th>
                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Estado</th>
                <th className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {items.map((game) => (
                <tr key={game.id} className="group hover:bg-slate-800 transition-colors">
                  <td className="px-6 py-4">
                    <div className="relative h-12 w-20 overflow-hidden rounded-xl border border-slate-700 shadow-sm transition-transform duration-300 group-hover:scale-105">
                      <img
                        src={game.cover_image_url || '/file.svg'}
                        alt={game.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        onError={(e) => { e.currentTarget.src = '/file.svg'; }}
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-extrabold text-slate-100 group-hover:text-violet-400 transition-colors">
                        {game.title}
                      </span>
                      <span className="text-[11px] font-medium text-slate-400 line-clamp-1 italic">
                        {getCategoryLabel(game.id || '')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <code className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2 py-1 rounded-lg">
                      {game.slug}
                    </code>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                      game.status === 'published' 
                        ? "bg-emerald-900/40 text-emerald-300" 
                        : "bg-amber-900/40 text-amber-300"
                    )}>
                      <span className={cn("h-1.5 w-1.5 rounded-full", game.status === 'published' ? "bg-emerald-500" : "bg-amber-500")}/>
                      {game.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1 translate-x-2 opacity-60 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                      <Link
                        href={`/admin/games/${game.id}/edit`}
                        className="p-2 rounded-xl text-slate-400 hover:text-violet-400 hover:bg-slate-800 transition-colors"
                        title="Editar"
                      >
                        <Edit3 size={18} />
                      </Link>
                      <button
                        onClick={() => togglePublish(game)}
                        className={cn(
                          "p-2 rounded-xl transition-colors",
                          game.status === 'published' 
                            ? "text-amber-400 hover:bg-slate-800" 
                            : "text-emerald-400 hover:bg-slate-800"
                        )}
                        title={game.status === 'published' ? 'Despublicar' : 'Publicar'}
                      >
                        {game.status === 'published' ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                      <button
                        onClick={() => deleteItem(game)}
                        className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic">
                    No se encontraron recursos disponibles.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
            Página <span className="text-slate-100 leading-none inline-block align-middle">{page}</span>
          </p>
          <span className="h-1 w-1 rounded-full bg-slate-700" />
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
            Total {totalPages}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="btn-secondary py-2 rounded-xl! disabled:opacity-30"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="btn-primary py-2 rounded-xl! disabled:opacity-30"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}
