"use client";

import React from 'react';
import Link from 'next/link';
import type { Category, CategoryType } from '../../types/category';
import { 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  ToggleLeft, 
  ToggleRight,
  ChevronLeft,
  ChevronRight,
  Filter,
  Layers,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

type CategoriesResponse = {
  items: Category[];
  total: number;
};

const inputClass =
  'w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/10 transition-all';

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
    <section className="space-y-8">
      {/* Search and Filters */}
      <div className="bg-slate-900 border border-slate-700 p-6 rounded-[2.5rem] flex flex-col gap-4 lg:flex-row lg:items-end">
        <div className="flex-1 space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Buscar Categorías</label>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 transition-colors" size={18} />
            <input
              className={cn(inputClass, "pl-12 h-12")}
              placeholder="Nombre o slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="w-full lg:w-44 space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Tipo</label>
          <select
            className={cn(inputClass, "h-12 appearance-none")}
            value={type}
            onChange={(e) => setType(e.target.value as CategoryType | '')}
          >
            <option value="">Todos</option>
            <option value="level">Nivel</option>
            <option value="course">Curso</option>
          </select>
        </div>

        <div className="w-full lg:w-44 space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Estado</label>
          <select
            className={cn(inputClass, "h-12 appearance-none")}
            value={isActive}
            onChange={(e) => setIsActive(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="true">Activo</option>
            <option value="false">Inactivo</option>
          </select>
        </div>

        <button
          onClick={onApplyFilters}
          className="btn-primary h-12 flex items-center justify-center gap-2 min-w-[120px]"
        >
          <Filter size={18} />
          {loading ? '...' : 'Filtrar'}
        </button>

        <Link
          href="/admin/categories/new"
          className="btn-primary h-12 flex items-center justify-center gap-2 bg-linear-to-br from-violet-600 to-indigo-600"
        >
          <Plus size={18} />
          <span>Nueva</span>
        </Link>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-2xl text-sm font-medium">
          {error}
        </div>
      )}

      {/* Table Section */}
      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-700 text-sm">
            <thead className="bg-slate-800">
              <tr>
                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Nombre & Info</th>
                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 hidden md:table-cell">Slug Identificador</th>
                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Tipo</th>
                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Estado</th>
                <th className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {items.map((category) => (
                <tr key={category.id} className="group hover:bg-slate-800 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-violet-400 transition-colors">
                        <Layers size={18} />
                      </div>
                      <span className="font-extrabold text-slate-100 leading-tight">
                        {category.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <code className="text-[11px] font-mono text-slate-400 bg-slate-800 px-3 py-1 rounded-lg">
                      {category.slug}
                    </code>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                      category.type === 'level' 
                        ? "border-blue-500/40 text-blue-300 bg-blue-900/40" 
                        : "border-orange-500/40 text-orange-300 bg-orange-900/40"
                    )}>
                      {category.type === 'level' ? 'Nivel' : 'Curso'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                      category.is_active 
                        ? "bg-emerald-900/40 text-emerald-300" 
                        : "bg-red-900/40 text-red-300"
                    )}>
                      {category.is_active ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                      {category.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <Link
                        href={`/admin/categories/${category.id}/edit`}
                        className="p-2 rounded-xl text-slate-400 hover:text-violet-400 hover:bg-slate-800 transition-colors"
                        title="Editar"
                      >
                        <Edit3 size={18} />
                      </Link>
                      <button
                        onClick={() => toggleActive(category)}
                        className={cn(
                          "p-2 rounded-xl transition-colors",
                          category.is_active ? "text-amber-400 hover:bg-slate-800" : "text-emerald-400 hover:bg-slate-800"
                        )}
                        title={category.is_active ? 'Desactivar' : 'Activar'}
                      >
                        {category.is_active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                      </button>
                      <button
                        onClick={() => deleteItem(category)}
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
                    Sin categorías para mostrar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
          Página <span className="text-slate-100">{page}</span> de {totalPages}
        </p>
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
