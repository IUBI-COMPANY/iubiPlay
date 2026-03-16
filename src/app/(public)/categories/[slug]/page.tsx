import Link from 'next/link';
import { GameCard } from '@/src/components/games/game_card';
import { GradeSwiper } from '@/src/components/public/grade_swiper';
import { getCategoryBySlug, listCategories } from '@/src/lib/db/categories';
import { listGames } from '@/src/lib/db/games';
import { cn } from '@/src/lib/utils';

const PAGE_SIZE = 24;

function buildQuery(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      search.set(key, String(value));
    }
  });
  return search.toString();
}

type Props = {
  params: Promise<{ slug: string }>;
  searchParams?: {
    search?: string;
    level?: string;
    page?: string;
  };
};

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { level, page: pageRaw } = (await searchParams) ?? {};
  const category = await getCategoryBySlug(slug);
  
  // Obtener niveles y parsearlos para el filtro jerárquico
  const { items: allLevels } = await listCategories({ type: 'level', limit: 100 });
  
  const parsedLevels = allLevels.map(l => {
    const name = l.name.toLowerCase();
    const grade = l.name.match(/\d+/) ? l.name.match(/\d+/)![0] + '°' : l.name;
    let stage: 'Primaria' | 'Secundaria' | 'Otro' = 'Otro';
    if (name.includes('primaria')) stage = 'Primaria';
    else if (name.includes('secundaria')) stage = 'Secundaria';
    return { ...l, grade, stage };
  }).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  const currentLevelObj = level ? parsedLevels.find(l => l.slug === level) : null;
  const activeStage = currentLevelObj?.stage ?? 'Primaria';

  if (!category) {
    return (
      <section className="rounded-xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
        Categoria no encontrada.
      </section>
    );
  }

  const page = Math.max(Number(pageRaw ?? 1), 1);
  const offset = (page - 1) * PAGE_SIZE;

  // Filtrar por categoría actual (curso) Y por nivel si está seleccionado
  const categoryIds = [category.id];
  if (level) {
    const selectedLevel = allLevels.find(l => l.slug === level);
    if (selectedLevel) categoryIds.push(selectedLevel.id);
  }

  const result = await listGames({
    status: 'published',
    limit: PAGE_SIZE,
    offset,
    categoryIds,
    throwOnError: false,
  });

  const totalPages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));
  const prevQuery = buildQuery({ level, page: page > 1 ? page - 1 : undefined });
  const nextQuery = buildQuery({ level, page: page < totalPages ? page + 1 : undefined });

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400">Categoría</p>
          <h1 className="text-3xl font-black tracking-tight text-white">{category.name}</h1>
        </div>
        <div className="pt-6 space-y-6">
          {/* Stage Filter (Tabs-like) */}
          <div className="flex items-center p-1 w-fit bg-slate-100 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10">
            {['Primaria', 'Secundaria'].map((s) => {
              const isActive = activeStage === s;
              const firstLevelOfStage = parsedLevels.find(l => l.stage === s);
              return (
                <Link
                  key={s}
                  href={`/categories/${category.slug}?level=${firstLevelOfStage?.slug ?? ''}`}
                  className={cn(
                    "px-6 py-2.5 rounded-xl text-sm font-black transition-all",
                    isActive
                      ? "bg-white dark:bg-white/10 text-violet-600 dark:text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  )}
                >
                  {s}
                </Link>
              );
            })}
          </div>

          {/* Grade Selector (Numbers) via Swiper */}
          <div className="flex items-center gap-3">
            <GradeSwiper 
              parsedLevels={parsedLevels}
              activeStage={activeStage}
              currentLevelSlug={level}
              basePath={`/categories/${category.slug}`}
            />
          </div>
        </div>
      </header>

      {result.items.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
          No hay juegos para esta categoria.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {result.items.map((game, index) => (
            <GameCard key={game.id} game={game} priority={index < 4} />
          ))}
        </div>
      )}

      <div className="flex flex-col items-center gap-4 text-sm text-slate-300 py-4">
        <div className="flex gap-3">
          <Link
            className={`rounded-xl border border-white/10 px-6 py-2.5 font-bold transition-all ${page <= 1 ? 'pointer-events-none opacity-50' : 'hover:border-white/30 bg-white/5'}`}
            href={prevQuery ? `/categories/${category.slug}?${prevQuery}` : `/categories/${category.slug}`}
          >
            Anterior
          </Link>
          <Link
            className={`rounded-xl border border-white/10 px-6 py-2.5 font-bold transition-all ${page >= totalPages ? 'pointer-events-none opacity-50' : 'hover:border-white/30 bg-white/5'}`}
            href={nextQuery ? `/categories/${category.slug}?${nextQuery}` : `/categories/${category.slug}`}
          >
            Siguiente
          </Link>
        </div>
        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
          Pagina {page} de {totalPages}
        </span>
      </div>
    </section>
  );
}
