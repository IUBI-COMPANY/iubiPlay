"use client";

import React from 'react';
import * as yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useRouter } from 'next/navigation';
import type { Category } from '../../types/category';

const schema = yup.object({
  name: yup.string().trim().required('Nombre requerido'),
  slug: yup.string().trim().required('Slug requerido'),
  type: yup.string().oneOf(['level', 'course']).required('Tipo requerido'),
  description: yup.string().trim().optional(),
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
  'mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200';

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

      setMessageSuccess(mode === 'edit' ? 'Categoria actualizada' : 'Categoria creada');
      router.push('/admin/categories');
    } catch {
      setMessageError('Error al guardar la categoria');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {messageError && <p className="text-red-600">{messageError}</p>}
      {messageSuccess && <p className="text-green-600">{messageSuccess}</p>}

      <div>
        <label className="block text-sm font-medium">Nombre</label>
        <input className={inputClass} {...register('name')} />
        {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium">Slug</label>
        <input className={inputClass} {...register('slug')} />
        {errors.slug && <p className="text-sm text-red-600">{errors.slug.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium">Tipo</label>
        <select className={inputClass} {...register('type')}>
          <option value="level">Nivel</option>
          <option value="course">Curso</option>
        </select>
        {errors.type && <p className="text-sm text-red-600">{errors.type.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium">Descripción</label>
        <textarea className={inputClass} rows={3} {...register('description')} />
        {errors.description && <p className="text-sm text-red-600">{errors.description.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium">Orden</label>
        <input className={inputClass} type="number" {...register('sort_order')} />
        {errors.sort_order && <p className="text-sm text-red-600">{errors.sort_order.message}</p>}
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" className="h-4 w-4" {...register('is_active')} />
        <label className="text-sm">Activo</label>
      </div>

      <div>
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : mode === 'edit' ? 'Actualizar categoria' : 'Crear categoria'}
        </button>
      </div>
    </form>
  );
}
