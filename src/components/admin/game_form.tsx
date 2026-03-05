"use client";

import React from 'react';
import * as yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useRouter } from 'next/navigation';
import type { Game } from '../../types/game';

const schema = yup.object({
  title: yup.string().trim().required('Título requerido'),
  slug: yup.string().trim().required('Slug requerido'),
  redirect_url: yup.string().trim().url('URL inválida').required('URL requerida'),
  cover_image_url: yup.string().trim().url('URL inválida').required('Cover requerida'),
  platform: yup.string().oneOf(['web', 'android', 'ios', 'windows', 'mac']).required('Plataforma requerida'),
  status: yup.string().oneOf(['draft', 'published', 'archived']).default('draft'),
});

type FormData = yup.InferType<typeof schema>;

type Mode = 'create' | 'edit';

interface GameFormProps {
  mode?: Mode;
  gameId?: string;
  initialData?: Partial<Game> | null;
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
};

function toFormValues(data?: Partial<Game> | null): FormData {
  return {
    title: data?.title ?? DEFAULT_VALUES.title,
    slug: data?.slug ?? DEFAULT_VALUES.slug,
    redirect_url: data?.redirect_url ?? DEFAULT_VALUES.redirect_url,
    cover_image_url: data?.cover_image_url ?? DEFAULT_VALUES.cover_image_url,
    platform: data?.platform ?? DEFAULT_VALUES.platform,
    status: data?.status ?? DEFAULT_VALUES.status,
  };
}

export function GameForm({ mode = 'create', gameId, initialData }: GameFormProps) {
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
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : mode === 'edit' ? 'Actualizar juego' : 'Crear juego'}
        </button>
      </div>
    </form>
  );
}
