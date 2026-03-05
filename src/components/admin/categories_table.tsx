"use client";

import React from 'react';
import Link from 'next/link';
import type { Category, CategoryType } from '../../types/category';

type CategoriesResponse = {
  items: Category[];
  total: number;
};

const inputClass =
  'w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200';

const PAGE_SIZE = 10;

export function CategoriesTable() {
  const [items, setItems] = React.useState<Category[]>([]);
  const [total, setTotal] = React.useState(0);
  const [search, setSearch] = React.useState('');
  const [type, setType] = React.useState<CategoryType | ''>('');
  const [isActive, setIsActive] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (type) params.set('type', type);
      if (isActive) params.set('is_active', isActive);
      params.set('limit', String(PAGE_SIZE));
      params.set('offset', String((page - 1) * PAGE_SIZE));

      const res = await fetch(`/api/categories?${params.toString()}`, { cache: 'no-store' });
      const data = (await res.json()) as CategoriesResponse;

      if (!res.ok) {
        setError('No se pudo cargar el listado');
        setLoading(false);
        return;
      }

      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setError('Error al cargar el listado');
    } finally {
      setLoading(false);
    }
  }, [search, type, isActive, page]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const toggleActive = async (category: Category) => {
    if (!category.id) {
      setError('ID inválido de la categoria');
      return;
    }
    try {
      const res = await fetch(`/api/categories/${category.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !category.is_active }),
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

  const deleteItem = async (category: Category) => {
    if (!category.id) {
      setError('ID inválido de la categoria');
      return;
    }
    if (!confirm(`Eliminar "${category.name}"?`)) return;
    try {
      const res = await fetch(`/api/categories/${category.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        setError(payload?.message ?? 'No se pudo eliminar la categoria');
        return;
      }
      await load();
    } catch {
      setError('Error al eliminar la categoria');
    }
  };

  const onApplyFilters = () => {
    setPage(1);
    void load();
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium">Buscar</label>
          <input
            className={inputClass}
            placeholder="Buscar por nombre o slug"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full md:w-56">
          <label className="block text-sm font-medium">Tipo</label>
          <select
            className={inputClass}
            value={type}
            onChange={(e) => setType(e.target.value as CategoryType | '')}
          >
            <option value="">Todos</option>
            <option value="level">Nivel</option>
            <option value="course">Curso</option>
          </select>
        </div>
        <div className="w-full md:w-56">
          <label className="block text-sm font-medium">Estado</label>
          <select
            className={inputClass}
            value={isActive}
            onChange={(e) => setIsActive(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="true">Activo</option>
            <option value="false">Inactivo</option>
          </select>
        </div>
        <button type="button" onClick={onApplyFilters} className="btn-primary">
          {loading ? 'Actualizando...' : 'Aplicar'}
        </button>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-md border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Nombre</th>
              <th className="px-4 py-2 text-left">Slug</th>
              <th className="px-4 py-2 text-left">Tipo</th>
              <th className="px-4 py-2 text-left">Estado</th>
              <th className="px-4 py-2 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((category) => (
              <tr key={category.id}>
                <td className="px-4 py-2">{category.name}</td>
                <td className="px-4 py-2">{category.slug}</td>
                <td className="px-4 py-2">{category.type === 'level' ? 'Nivel' : 'Curso'}</td>
                <td className="px-4 py-2">{category.is_active ? 'Activo' : 'Inactivo'}</td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-3">
                    <Link className="text-blue-600" href={`/admin/categories/${category.id}/edit`}>
                      Editar
                    </Link>
                    <button
                      type="button"
                      className="text-blue-600"
                      onClick={() => toggleActive(category)}
                    >
                      {category.is_active ? 'Desactivar' : 'Activar'}
                    </button>
                    <button
                      type="button"
                      className="text-red-600"
                      onClick={() => deleteItem(category)}
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
                  No hay categorias para mostrar.
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
