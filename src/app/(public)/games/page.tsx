import Link from 'next/link';
import { GameCard } from '@/src/components/games/game_card';
import { listGames } from '@/src/lib/db/games';
import { listCategories } from '@/src/lib/db/categories';
import { GradeSwiper } from '@/src/components/public/grade_swiper';
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
  searchParams?: {
    level?: string;
    page?: string;
    search?: string;
  };
};

export default async function GamesPage({ searchParams }: Props) {
  const { level, page: pageRaw, search } = (await searchParams) ?? {};

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

  const page = Math.max(Number(pageRaw ?? 1), 1);
  const offset = (page - 1) * PAGE_SIZE;

  // Filtrar solo por nivel
  const categoryIds: string[] = [];
  if (level) {
    const selectedLevel = allLevels.find(l => l.slug === level);
    if (selectedLevel) categoryIds.push(selectedLevel.id);
  }

  const result = await listGames({
    status: 'published',
    search,
    limit: PAGE_SIZE,
    offset,
    categoryIds: categoryIds.length > 0 ? categoryIds : undefined,
    throwOnError: false,
  });

  const totalPages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));
  const prevQuery = buildQuery({ level, search, page: page > 1 ? page - 1 : undefined });
  const nextQuery = buildQuery({ level, search, page: page < totalPages ? page + 1 : undefined });

  return (
    <section className="space-y-6 rounded-xl">
      <header className="space-y-6 pb-4">
        <h1 className="text-3xl font-black tracking-tight text-white">Todo el Contenido</h1>
        <div className="space-y-6">
          {/* Stage Filter (Tabs-like) */}
          <div className="flex items-center p-1 w-fit bg-white rounded-2xl border border-slate-200">
            {['Primaria', 'Secundaria'].map((s) => {
              const isActive = activeStage === s;
              const firstLevelOfStage = parsedLevels.find(l => l.stage === s);
              return (
                <Link
                  key={s}
                  href={`/games?level=${firstLevelOfStage?.slug ?? ''}`}
                  className={cn(
                    "px-6 py-2.5 rounded-xl text-sm font-black transition-all text-violet-600",
                    isActive
                      ? "bg-slate-100 text-violet-700 shadow-lg border-violet-500"
                      : "hover:text-violet-700"
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
              basePath="/games"
            />
          </div>
        </div>
      </header>

      {result.items.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-slate-800 p-6 text-sm text-slate-300">
          {search ? `No se encontraron juegos para "${search}".` : "No se encontraron juegos con esos filtros."}
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
            className={`rounded-xl border border-white/10 px-6 py-2.5 font-bold transition-all bg-slate-800 ${page <= 1 ? 'pointer-events-none opacity-50' : 'hover:border-white/30'}`}
            href={prevQuery ? `/games?${prevQuery}` : '/games'}
          >
            Anterior
          </Link>
          <Link
            className={`rounded-xl border border-white/10 px-6 py-2.5 font-bold transition-all bg-slate-800 ${page >= totalPages ? 'pointer-events-none opacity-50' : 'hover:border-white/30'}`}
            href={nextQuery ? `/games?${nextQuery}` : '/games'}
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
