"use client";

import React from 'react';
import * as yup from 'yup';
import { useForm, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useRouter } from 'next/navigation';
import type { Game } from '../../types/game';
import type { Category, CategorySelections } from '../../types/category';
import { inferCategorySlugs } from '@/src/lib/games/auto_fill_rules';
import { 
  Sparkles, 
  Link as LinkIcon, 
  Image as ImageIcon, 
  Monitor, 
  CheckCircle2, 
  AlertCircle,
  ArrowLeft,
  Search,
  Zap,
  ChevronRight,
  Globe,
  Smartphone,
  Check
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

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
  'block w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/10 transition-all placeholder:text-slate-400';

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

const CATEGORIES_CACHE_KEY = 'iubiplay:categories:active';
const CATEGORIES_CACHE_TTL_MS = 5 * 60 * 1000;

export function GameForm({ mode = 'create', gameId, initialData, initialSelections }: GameFormProps) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    getValues,
    control,
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
  const [autoFillError, setAutoFillError] = React.useState<string | null>(null);
  const [autoFillLoading, setAutoFillLoading] = React.useState(false);

  const redirectUrl = useWatch({ control, name: 'redirect_url' });
  const coverPreview = useWatch({ control, name: 'cover_image_url' });
  const watchedLevels = useWatch({ control, name: 'levels' }) || [];
  const watchedCourses = useWatch({ control, name: 'courses' }) || [];

  const categoriesBySlug = React.useMemo(() => {
    const map = new Map<string, Category>();
    for (const category of [...levels, ...courses]) {
      map.set(category.slug, category);
    }
    return map;
  }, [courses, levels]);

  React.useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        if (typeof window !== 'undefined') {
          const cached = window.sessionStorage.getItem(CATEGORIES_CACHE_KEY);
          if (cached) {
            const parsed = JSON.parse(cached) as { ts: number; items: Category[] };
            if (Date.now() - parsed.ts < CATEGORIES_CACHE_TTL_MS) {
              const items = Array.isArray(parsed.items) ? parsed.items : [];
              if (!active) return;
              setLevels(items.filter((item) => item.type === 'level'));
              setCourses(items.filter((item) => item.type === 'course'));
              return;
            }
          }
        }

        const res = await fetch('/api/categories?is_active=true&limit=500');
        if (!res.ok) {
          if (!active) return;
          setCategoriesError('No se pudieron cargar las categorías');
          return;
        }

        const json = await res.json().catch(() => null);
        if (!active) return;

        const items = Array.isArray(json?.items) ? json.items : [];
        setLevels(items.filter((item: Category) => item.type === 'level'));
        setCourses(items.filter((item: Category) => item.type === 'course'));

        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem(
            CATEGORIES_CACHE_KEY,
            JSON.stringify({ ts: Date.now(), items })
          );
        }
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

  const slugify = React.useCallback((value: string) => {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }, []);

  const applyCategorySelection = React.useCallback((slugs: string[], target: 'levels' | 'courses') => {
    const ids = slugs
      .map((slug) => categoriesBySlug.get(slug)?.id)
      .filter((id): id is string => Boolean(id));

    if (ids.length) {
      setValue(target, ids, { shouldDirty: true, shouldValidate: true });
    }
  }, [categoriesBySlug, setValue]);

  const handleAutofill = React.useCallback(async () => {
    const redirect = getValues('redirect_url');
    if (!redirect) return;

    const currentTitle = getValues('title');
    const currentSlug = getValues('slug');
    const currentCover = getValues('cover_image_url');
    const currentLevels = getValues('levels');
    const currentCourses = getValues('courses');

    if (currentTitle || currentSlug || currentCover || currentLevels.length || currentCourses.length) {
      return;
    }

    setAutoFillError(null);
    setAutoFillLoading(true);

    try {
      const params = new URLSearchParams({ url: redirect });
      const res = await fetch(`/api/metadata?${params.toString()}`);
      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.data) {
        setAutoFillError(json?.message ?? 'No se pudo obtener metadatos');
        return;
      }

      const { title, description, image } = json.data as {
        title?: string | null;
        description?: string | null;
        image?: string | null;
      };

      if (title && !currentTitle) {
        setValue('title', title, { shouldDirty: true, shouldValidate: true });
      }

      if (title && !currentSlug) {
        setValue('slug', slugify(title), { shouldDirty: true, shouldValidate: true });
      }

      if (image && !currentCover) {
        setValue('cover_image_url', image, { shouldDirty: true, shouldValidate: true });
      }

      const inferred = inferCategorySlugs({ url: redirect, title: title ?? undefined, description: description ?? undefined });

      if (inferred.levelSlugs.length) {
        applyCategorySelection(inferred.levelSlugs, 'levels');
      } else if (!currentLevels.length && levels.length) {
        setValue('levels', [levels[0].id], { shouldDirty: true, shouldValidate: true });
      }

      if (inferred.courseSlugs.length) {
        applyCategorySelection(inferred.courseSlugs, 'courses');
      } else if (!currentCourses.length && courses.length) {
        setValue('courses', [courses[0].id], { shouldDirty: true, shouldValidate: true });
      }
    } catch {
      setAutoFillError('No se pudo autocompletar');
    } finally {
      setAutoFillLoading(false);
    }
  }, [applyCategorySelection, courses, getValues, levels, setValue, slugify]);

  React.useEffect(() => {
    if (!redirectUrl) return;
    const timer = setTimeout(() => {
      void handleAutofill();
    }, 600);

    return () => clearTimeout(timer);
  }, [redirectUrl, handleAutofill]);

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
        credentials: 'include',
        body: JSON.stringify(values),
      });
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        setMessageError(json?.message ?? 'No se pudo guardar el juego');
        return;
      }

      setMessageSuccess(mode === 'edit' ? 'Juego actualizado éxitosamente' : 'Juego creado éxitosamente');
      setTimeout(() => {
        router.push('/admin/games');
      }, 1500);
    } catch {
      setMessageError('Error al guardar el juego');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl mx-auto pb-12" noValidate>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            {mode === 'edit' ? 'Editar Recurso' : 'Crear Nuevo Recurso'}
          </h2>
          <p className="text-sm text-slate-500 mt-1">Completa los datos para publicar el material educativo.</p>
        </div>
        <button 
          type="button" 
          onClick={() => router.back()}
          className="flex items-center gap-2 p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 text-sm font-bold transition-all"
        >
          <ArrowLeft size={18} />
          Volver
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card-startup p-6!">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Título del recurso</label>
                <div className="relative group">
                  <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 transition-colors" size={18} />
                  <input className={cn(inputClass, "pl-12")} placeholder="Ej. El ciclo del agua interactivo" {...register('title')} />
                </div>
                {errors.title && <p className="text-[11px] font-bold text-red-500 px-1 italic">{errors.title.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Slug identificador</label>
                  <input className={inputClass} placeholder="el-ciclo-del-agua" {...register('slug')} />
                  {errors.slug && <p className="text-[11px] font-bold text-red-500 px-1 italic">{errors.slug.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Plataforma</label>
                  <select className={cn(inputClass, "appearance-none")} {...register('platform')}>
                    <option value="web">Web / Browser</option>
                    <option value="android">Android App</option>
                    <option value="ios">iOS App</option>
                    <option value="windows">Windows Software</option>
                    <option value="mac">macOS App</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">URL de redirección</label>
                <div className="relative group">
                  <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 transition-colors" size={18} />
                  <input className={cn(inputClass, "pl-12")} placeholder="https://ejemplo.com/recurso" {...register('redirect_url')} />
                </div>
                {errors.redirect_url && <p className="text-[11px] font-bold text-red-500 px-1 italic">{errors.redirect_url.message}</p>}
                {autoFillLoading && (
                  <div className="flex items-center gap-2 px-2 py-1">
                    <Zap size={14} className="text-violet-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-violet-500 uppercase tracking-widest">Autocompletando datos...</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="card-startup p-6!">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Taxonomía del Recurso</h3>
                <button
                  type="button"
                  onClick={() => handleAutofill()}
                  className="text-[10px] font-bold text-violet-500 hover:text-violet-600 uppercase tracking-wider flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/5 hover:bg-violet-500/10 transition-colors"
                  title="Actualizar sugerencias basadas en la URL"
                >
                  <Zap size={12} />
                  Sugerir de nuevo
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Niveles Educativos</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {levels.map((level) => (
                      <label 
                        key={level.id} 
                        className={cn(
                          "cursor-pointer flex items-center justify-between p-3 rounded-xl border transition-all",
                          watchedLevels.includes(level.id) 
                            ? "bg-violet-500/5 border-violet-500/50 text-violet-700 dark:text-violet-400" 
                            : "bg-white/5 border-slate-200 dark:border-white/5 text-slate-500 hover:border-slate-300 dark:hover:border-white/20"
                        )}
                      >
                        <span className="text-xs font-bold leading-none">{level.name}</span>
                        <input
                          type="checkbox"
                          value={level.id}
                          className="sr-only"
                          {...register('levels')}
                        />
                        {watchedLevels.includes(level.id) && <Check size={14} />}
                      </label>
                    ))}
                  </div>
                  {errors.levels && <p className="text-[11px] font-bold text-red-500 px-1 italic">{errors.levels.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Curso o Materia</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {courses.map((course) => (
                      <label 
                        key={course.id} 
                        className={cn(
                          "cursor-pointer flex items-center justify-between p-3 rounded-xl border transition-all",
                          watchedCourses.includes(course.id) 
                            ? "bg-indigo-500/5 border-indigo-500/50 text-indigo-700 dark:text-indigo-400" 
                            : "bg-white/5 border-slate-200 dark:border-white/5 text-slate-500 hover:border-slate-300 dark:hover:border-white/20"
                        )}
                      >
                        <span className="text-xs font-bold leading-none">{course.name}</span>
                        <input
                          type="checkbox"
                          value={course.id}
                          className="sr-only"
                          {...register('courses')}
                        />
                        {watchedCourses.includes(course.id) && <Check size={14} />}
                      </label>
                    ))}
                  </div>
                  {errors.courses && <p className="text-[11px] font-bold text-red-500 px-1 italic">{errors.courses.message}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Status and Preview */}
        <div className="space-y-6">
          <div className="card-startup p-6!">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Estado de publicación</label>
                <select className={cn(inputClass, "appearance-none")} {...register('status')}>
                  <option value="draft">🟡 Borrador (Privado)</option>
                  <option value="published">🟢 Publicado (Visible)</option>
                  <option value="archived">🔴 Archivado</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Imagen de portada (URL)</label>
                <div className="relative group">
                  <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 transition-colors" size={18} />
                  <input className={cn(inputClass, "pl-12")} placeholder="https://..." {...register('cover_image_url')} />
                </div>
                {errors.cover_image_url && <p className="text-[11px] font-bold text-red-500 px-1 italic">{errors.cover_image_url.message}</p>}
                
                <div className="mt-4 aspect-video rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 overflow-hidden relative group">
                  {coverPreview ? (
                    <img
                      src={coverPreview}
                      alt="Preview"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 gap-2">
                      <ImageIcon size={32} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Vista previa</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <button 
              type="submit" 
              className="w-full btn-primary h-14 flex items-center justify-center gap-3 text-base shadow-xl shadow-violet-500/20 active:scale-95 transition-all"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              ) : (
                <>
                  <Sparkles size={20} />
                  <span>{mode === 'edit' ? 'Guardar Cambios' : 'Publicar Recurso'}</span>
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
        </div>
      </div>
    </form>
  );
}
