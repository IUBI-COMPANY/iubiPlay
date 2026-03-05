import Link from 'next/link';
import { FiltersBar } from '@/src/components/games/filters_bar';
import { GameCard } from '@/src/components/games/game_card';
import { getCategoryBySlug } from '@/src/lib/db/categories';
import { listGames } from '@/src/lib/db/games';

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
    page?: string;
  };
};

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    return (
      <section className="rounded-xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
        Categoria no encontrada.
      </section>
    );
  }

  const search = searchParams?.search?.trim() ?? '';
  const page = Math.max(Number(searchParams?.page ?? 1), 1);
  const offset = (page - 1) * PAGE_SIZE;

  const result = await listGames({
    status: 'published',
    search: search || undefined,
    limit: PAGE_SIZE,
    offset,
    categoryIds: [category.id],
    throwOnError: false,
  });

  const totalPages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));
  const prevQuery = buildQuery({ search, page: page > 1 ? page - 1 : undefined });
  const nextQuery = buildQuery({ search, page: page < totalPages ? page + 1 : undefined });

  return (
    <section className="space-y-6">
      <header className="space-y-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-purple-200">Categoria</p>
          <h1 className="text-2xl font-semibold text-white">{category.name}</h1>
        </div>
        <FiltersBar defaultValue={search} action={`/categories/${category.slug}`} />
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

      <div className="flex items-center justify-between text-sm text-slate-300">
        <span>
          Pagina {page} de {totalPages}
        </span>
        <div className="flex gap-3">
          <Link
            className={`rounded-md border border-white/10 px-3 py-2 ${page <= 1 ? 'pointer-events-none opacity-50' : 'hover:border-white/30'}`}
            href={prevQuery ? `/categories/${category.slug}?${prevQuery}` : `/categories/${category.slug}`}
          >
            Anterior
          </Link>
          <Link
            className={`rounded-md border border-white/10 px-3 py-2 ${page >= totalPages ? 'pointer-events-none opacity-50' : 'hover:border-white/30'}`}
            href={nextQuery ? `/categories/${category.slug}?${nextQuery}` : `/categories/${category.slug}`}
          >
            Siguiente
          </Link>
        </div>
      </div>
    </section>
  );
}
