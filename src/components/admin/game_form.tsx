"use client";

import React from 'react';
import * as yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useRouter } from 'next/navigation';
import type { Game } from '../../types/game';
import type { Category, CategorySelections } from '../../types/category';

const schema = yup.object({
  title: yup.string().trim().required('Título requerido'),
  slug: yup.string().trim().required('Slug requerido'),
  redirect_url: yup.string().trim().url('URL inválida').required('URL requerida'),
  cover_image_url: yup.string().trim().url('URL inválida').required('Cover requerida'),
  platform: yup.string().oneOf(['web', 'android', 'ios', 'windows', 'mac']).required('Plataforma requerida'),
  status: yup.string().oneOf(['draft', 'published', 'archived']).default('draft'),
  levels: yup.array(yup.string().trim()).min(1, 'Selecciona al menos un nivel').default(() => []),
  courses: yup.array(yup.string().trim()).min(1, 'Selecciona al menos un curso').default(() => []),
});

type FormData = yup.InferType<typeof schema>;

type Mode = 'create' | 'edit';

interface GameFormProps {
  mode?: Mode;
  gameId?: string;
  initialData?: Partial<Game> | null;
  initialSelections?: CategorySelections | null;
}

const inputClass =
  'mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200';

const DEFAULT_VALUES: FormData = {
  title: '',
  slug: '',
  redirect_url: '',
  cover_image_url: '',
  platform: 'web',
  status: 'draft',
  levels: [],
  courses: [],
};

function toFormValues(data?: Partial<Game> | null, selections?: CategorySelections | null): FormData {
  return {
    title: data?.title ?? DEFAULT_VALUES.title,
    slug: data?.slug ?? DEFAULT_VALUES.slug,
    redirect_url: data?.redirect_url ?? DEFAULT_VALUES.redirect_url,
    cover_image_url: data?.cover_image_url ?? DEFAULT_VALUES.cover_image_url,
    platform: data?.platform ?? DEFAULT_VALUES.platform,
    status: data?.status ?? DEFAULT_VALUES.status,
    levels: selections?.levels ?? DEFAULT_VALUES.levels,
    courses: selections?.courses ?? DEFAULT_VALUES.courses,
  };
}

export function GameForm({ mode = 'create', gameId, initialData, initialSelections }: GameFormProps) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    mode: 'onSubmit',
    defaultValues: toFormValues(initialData, initialSelections),
  });

  React.useEffect(() => {
    reset(toFormValues(initialData, initialSelections));
  }, [initialData, initialSelections, reset]);

  const [messageError, setMessageError] = React.useState<string | null>(null);
  const [messageSuccess, setMessageSuccess] = React.useState<string | null>(null);
  const [levels, setLevels] = React.useState<Category[]>([]);
  const [courses, setCourses] = React.useState<Category[]>([]);
  const [categoriesError, setCategoriesError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [levelsRes, coursesRes] = await Promise.all([
          fetch('/api/categories?type=level&is_active=true&limit=200'),
          fetch('/api/categories?type=course&is_active=true&limit=200'),
        ]);

        if (!levelsRes.ok || !coursesRes.ok) {
          if (!active) return;
          setCategoriesError('No se pudieron cargar las categorías');
          return;
        }

        const levelsJson = await levelsRes.json().catch(() => null);
        const coursesJson = await coursesRes.json().catch(() => null);

        if (!active) return;

        setLevels(Array.isArray(levelsJson?.items) ? levelsJson.items : []);
        setCourses(Array.isArray(coursesJson?.items) ? coursesJson.items : []);
      } catch (err: unknown) {
        if (!active) return;
        const message = err instanceof Error ? err.message : 'No se pudieron cargar las categorías';
        setCategoriesError(message);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  const onSubmit = async (values: FormData) => {
    setMessageError(null);
    setMessageSuccess(null);

    try {
      const url = mode === 'edit' && gameId ? `/api/games/${gameId}` : '/api/games';
      const method = mode === 'edit' ? 'PATCH' : 'POST';

      if (mode === 'edit' && !gameId) {
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
        setMessageError(json?.message ?? 'No se pudo guardar el juego');
        return;
      }

      setMessageSuccess(mode === 'edit' ? 'Juego actualizado' : 'Juego creado');
      router.push('/admin/games');
    } catch {
      setMessageError('Error al guardar el juego');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {messageError && <p className="text-red-600">{messageError}</p>}
      {messageSuccess && <p className="text-green-600">{messageSuccess}</p>}
      {categoriesError && <p className="text-sm text-amber-600">{categoriesError}</p>}

      <div>
        <label className="block text-sm font-medium">Título</label>
        <input className={inputClass} {...register('title')} />
        {errors.title && <p className="text-sm text-red-600">{errors.title.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium">Slug</label>
        <input className={inputClass} {...register('slug')} />
        {errors.slug && <p className="text-sm text-red-600">{errors.slug.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium">URL de redirección</label>
        <input className={inputClass} {...register('redirect_url')} />
        {errors.redirect_url && <p className="text-sm text-red-600">{errors.redirect_url.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium">Cover</label>
        <input className={inputClass} {...register('cover_image_url')} />
        {errors.cover_image_url && <p className="text-sm text-red-600">{errors.cover_image_url.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium">Plataforma</label>
        <select className={inputClass} {...register('platform')}>
          <option value="web">Web</option>
          <option value="android">Android</option>
          <option value="ios">iOS</option>
          <option value="windows">Windows</option>
          <option value="mac">Mac</option>
        </select>
        {errors.platform && <p className="text-sm text-red-600">{errors.platform.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium">Estado</label>
        <select className={inputClass} {...register('status')}>
          <option value="draft">Borrador</option>
          <option value="published">Publicado</option>
          <option value="archived">Archivado</option>
        </select>
        {errors.status && <p className="text-sm text-red-600">{errors.status.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium">Niveles</label>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {levels.length === 0 && <p className="text-sm text-gray-500">Sin niveles disponibles.</p>}
          {levels.map((level) => (
            <label key={level.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                value={level.id}
                className="h-4 w-4 rounded border-gray-300"
                {...register('levels')}
              />
              <span>{level.name}</span>
            </label>
          ))}
        </div>
        {errors.levels && <p className="text-sm text-red-600">{errors.levels.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium">Cursos</label>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {courses.length === 0 && <p className="text-sm text-gray-500">Sin cursos disponibles.</p>}
          {courses.map((course) => (
            <label key={course.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                value={course.id}
                className="h-4 w-4 rounded border-gray-300"
                {...register('courses')}
              />
              <span>{course.name}</span>
            </label>
          ))}
        </div>
        {errors.courses && <p className="text-sm text-red-600">{errors.courses.message}</p>}
      </div>

      <div>
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : mode === 'edit' ? 'Actualizar juego' : 'Crear juego'}
        </button>
      </div>
    </form>
  );
}
