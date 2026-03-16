"use client";

import React from 'react';
import * as yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useRouter } from 'next/navigation';
import type { Category } from '../../types/category';
import { 
  Plus, 
  ArrowLeft, 
  Layers, 
  LayoutGrid, 
  AlignLeft, 
  ListOrdered, 
  CheckCircle2, 
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

const schema = yup.object({
  name: yup.string().trim().required('Nombre requerido'),
  slug: yup.string().trim().required('Slug requerido'),
  type: yup.string().oneOf(['level', 'course']).required('Tipo requerido'),
  description: yup.string().trim().optional(),
  icon: yup.string().trim().optional(),
  is_active: yup.boolean().default(true),
  sort_order: yup.number().integer().min(0).optional().transform((value, original) => {
    if (original === '' || original === null || Number.isNaN(value)) return undefined;
    return value;
  }),
});

type FormData = yup.InferType<typeof schema>;

type Mode = 'create' | 'edit';

interface CategoryFormProps {
  mode?: Mode;
  categoryId?: string;
  initialData?: Partial<Category> | null;
}

const inputClass =
  'block w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 outline-none focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/10 transition-all placeholder:text-slate-400';

const DEFAULT_VALUES: FormData = {
  name: '',
  slug: '',
  type: 'level',
  description: '',
  is_active: true,
  sort_order: undefined,
};

function toFormValues(data?: Partial<Category> | null): FormData {
  return {
    name: data?.name ?? DEFAULT_VALUES.name,
    slug: data?.slug ?? DEFAULT_VALUES.slug,
    type: data?.type ?? DEFAULT_VALUES.type,
    description: data?.description ?? DEFAULT_VALUES.description,
    icon: data?.icon ?? '',
    is_active: data?.is_active ?? DEFAULT_VALUES.is_active,
    sort_order: typeof data?.sort_order === 'number' ? data.sort_order : DEFAULT_VALUES.sort_order,
  };
}

export function CategoryForm({ mode = 'create', categoryId, initialData }: CategoryFormProps) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    mode: 'onSubmit',
    defaultValues: toFormValues(initialData),
  });

  React.useEffect(() => {
    reset(toFormValues(initialData));
  }, [initialData, reset]);

  const [messageError, setMessageError] = React.useState<string | null>(null);
  const [messageSuccess, setMessageSuccess] = React.useState<string | null>(null);

  const onSubmit = async (values: FormData) => {
    setMessageError(null);
    setMessageSuccess(null);

    try {
      const url = mode === 'edit' && categoryId ? `/api/categories/${categoryId}` : '/api/categories';
      const method = mode === 'edit' ? 'PATCH' : 'POST';

      if (mode === 'edit' && !categoryId) {
        setMessageError('ID inválido');
        return;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        setMessageError(json?.message ?? 'No se pudo guardar la categoria');
        return;
      }

      setMessageSuccess(mode === 'edit' ? 'Categoría actualizada correctamente' : 'Categoría creada correctamente');
      setTimeout(() => {
        router.push('/admin/categories');
      }, 1500);
    } catch {
      setMessageError('Error al intentar guardar la categoría');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl mx-auto pb-12" noValidate>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-100">
            {mode === 'edit' ? 'Editar Categoría' : 'Nueva Categoría'}
          </h2>
          <p className="text-sm text-slate-400 mt-1">Define niveles educativos o cursos específicos.</p>
        </div>
        <button 
          type="button" 
          onClick={() => router.back()}
          className="flex items-center gap-2 p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold transition-all"
        >
          <ArrowLeft size={18} />
          Volver
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Nombre de la categoría</label>
              <div className="relative group">
                <LayoutGrid className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 transition-colors" size={18} />
                <input className={cn(inputClass, "pl-12")} placeholder="Ej. Primaria o Matemáticas" {...register('name')} />
              </div>
              {errors.name && <p className="text-[11px] font-bold text-red-500 px-1 italic">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Slug identificador</label>
              <input className={inputClass} placeholder="ej-primaria" {...register('slug')} />
              {errors.slug && <p className="text-[11px] font-bold text-red-500 px-1 italic">{errors.slug.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Tipo de categoría</label>
              <div className="relative group">
                <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 transition-colors pointer-events-none" size={18} />
                <select className={cn(inputClass, "pl-12 appearance-none")} {...register('type')}>
                  <option value="level">Nivel Educativo</option>
                  <option value="course">Curso / Materia</option>
                </select>
              </div>
              {errors.type && <p className="text-[11px] font-bold text-red-500 px-1 italic">{errors.type.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Orden de visualización</label>
              <div className="relative group">
                <ListOrdered className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 transition-colors" size={18} />
                <input className={cn(inputClass, "pl-12")} type="number" placeholder="0" {...register('sort_order')} />
              </div>
              {errors.sort_order && <p className="text-[11px] font-bold text-red-500 px-1 italic">{errors.sort_order.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Icono Lucide (Opcional)</label>
            <div className="relative group">
              <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 transition-colors" size={18} />
              <input 
                className={cn(inputClass, "pl-12")} 
                placeholder="Ej: BookText, Calculator, FlaskConical..." 
                {...register('icon')} 
              />
            </div>
            <p className="text-[9px] text-slate-400 px-1">Usa nombres de Lucide React (ej: Music, Palette, Globe).</p>
            {errors.icon && <p className="text-[11px] font-bold text-red-500 px-1 italic">{errors.icon.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Descripción (Opcional)</label>
            <div className="relative group">
              <AlignLeft className="absolute left-4 top-4 text-slate-400 group-focus-within:text-violet-500 transition-colors" size={18} />
              <textarea className={cn(inputClass, "pl-12 resize-none")} rows={3} placeholder="Breve descripción de la categoría..." {...register('description')} />
            </div>
            {errors.description && <p className="text-[11px] font-bold text-red-500 px-1 italic">{errors.description.message}</p>}
          </div>

          <div className="pt-4 border-t border-slate-700">
            <label className="inline-flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <input type="checkbox" className="sr-only peer" {...register('is_active')} />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-white/10 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-500 transition-colors"></div>
              </div>
              <span className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">Categoría activa</span>
            </label>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        <button 
          type="submit" 
          className="w-full btn-primary h-14 flex items-center justify-center gap-3 text-base shadow-xl shadow-violet-500/20 active:scale-[0.98] transition-all"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          ) : (
            <>
              <Plus size={20} />
              <span>{mode === 'edit' ? 'Guardar Cambios' : 'Crear Categoría'}</span>
            </>
          )}
        </button>
        
        {messageSuccess && (
          <div className="flex items-center gap-2 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-sm font-bold animate-in fade-in slide-in-from-top-4">
            <CheckCircle2 size={18} />
            {messageSuccess}
          </div>
        )}
        
        {messageError && (
          <div className="flex items-center gap-2 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 text-sm font-bold animate-shake">
            <AlertCircle size={18} />
            {messageError}
          </div>
        )}
      </div>
    </form>
  );
}
