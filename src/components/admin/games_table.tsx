"use client";

import React from 'react';
import Link from 'next/link';
import type { Game } from '../../types/game';
import type { Category } from '../../types/category';

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
  'w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200';

const PAGE_SIZE = 10;

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
  const [categoryId, setCategoryId] = React.useState('');
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [categoriesByGameId, setCategoriesByGameId] = React.useState<Record<string, Category[]>>({});

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const loadCategories = React.useCallback(async () => {
    try {
      const res = await fetch('/api/categories?is_active=true&limit=500');
      if (!res.ok) return;
      const data = (await res.json()) as { items: Category[] };
      setCategories(Array.isArray(data.items) ? data.items : []);
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
      if (categoryId) params.set('category_id', categoryId);
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
  }, [search, status, categoryId, page]);

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
    if (gameCategories.length === 0) return 'Sin categorias';
    const levels = gameCategories.filter((cat) => cat.type === 'level').map((cat) => cat.name);
    const courses = gameCategories.filter((cat) => cat.type === 'course').map((cat) => cat.name);
    const parts: string[] = [];
    if (levels.length) parts.push(`Nivel: ${levels.join(', ')}`);
    if (courses.length) parts.push(`Curso: ${courses.join(', ')}`);
    return parts.join(' | ');
  };

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-md border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Total</p>
          <p className="text-2xl font-semibold">{summary.total}</p>
        </div>
        <div className="rounded-md border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Publicados</p>
          <p className="text-2xl font-semibold">{summary.published}</p>
        </div>
        <div className="rounded-md border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Borradores</p>
          <p className="text-2xl font-semibold">{summary.draft}</p>
        </div>
        <div className="rounded-md border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Archivados</p>
          <p className="text-2xl font-semibold">{summary.archived}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium">Buscar</label>
          <input
            className={inputClass}
            placeholder="Buscar por titulo o slug"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full md:w-56">
          <label className="block text-sm font-medium">Estado</label>
          <select
            className={inputClass}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="published">Publicado</option>
            <option value="draft">Borrador</option>
            <option value="archived">Archivado</option>
          </select>
        </div>
        <div className="w-full md:w-64">
          <label className="block text-sm font-medium">Categoria</label>
          <select
            className={inputClass}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">Todas</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.type === 'level' ? 'Nivel' : 'Curso'}: {cat.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={onApplyFilters}
          className="btn-primary"
        >
          {loading ? 'Actualizando...' : 'Aplicar'}
        </button>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-md border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Titulo</th>
              <th className="px-4 py-2 text-left">Slug</th>
              <th className="px-4 py-2 text-left">Categorias</th>
              <th className="px-4 py-2 text-left">Estado</th>
              <th className="px-4 py-2 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((game) => (
              <tr key={game.id}>
                <td className="px-4 py-2">{game.title}</td>
                <td className="px-4 py-2">{game.slug}</td>
                <td className="px-4 py-2 text-xs text-gray-700">{getCategoryLabel(game.id)}</td>
                <td className="px-4 py-2">{game.status}</td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-3">
                    <Link
                      className="text-blue-600"
                      href={`/admin/games/${game.id}/edit`}
                    >
                      Editar
                    </Link>
                    <button
                      type="button"
                      className="text-blue-600"
                      onClick={() => togglePublish(game)}
                      disabled={!game.id}
                    >
                      {game.status === 'published' ? 'Despublicar' : 'Publicar'}
                    </button>
                    <button
                      type="button"
                      className="text-red-600"
                      onClick={() => deleteItem(game)}
                      disabled={!game.id}
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && items.length === 0 && (
              <tr>
                <td className="px-4 py-6" colSpan={5}>
                  No hay juegos para mostrar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Página {page} de {totalPages}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            className="btn-primary"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Anterior
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Siguiente
          </button>
        </div>
      </div>
    </section>
  );
}
