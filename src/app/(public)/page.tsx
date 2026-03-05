import { GameHero } from '@/src/components/games/game_hero';
import { GameRowCarousel } from '@/src/components/games/game_row_carousel';
import { listCategories } from '@/src/lib/db/categories';
import { listGames } from '@/src/lib/db/games';

export const revalidate = 60;

export default async function PublicHomePage() {
  const { items: courseCategories } = await listCategories({
    type: 'course',
    is_active: true,
    limit: 6,
  });

  const [heroResult, newResult, popularResult, sections] = await Promise.all([
    listGames({ status: 'published', limit: 1, throwOnError: false }),
    listGames({ status: 'published', limit: 8, throwOnError: false }),
    listGames({ status: 'published', limit: 8, offset: 8, throwOnError: false }),
    Promise.all(
      courseCategories.map(async (category) => {
        const list = await listGames({
          status: 'published',
          limit: 8,
          categoryIds: [category.id],
          throwOnError: false,
        });
        return { category, games: list.items };
      })
    ),
  ]);

  const heroGame = heroResult.items[0] ?? null;

  return (
    <main className="space-y-10">
      <GameHero game={heroGame} />

      <GameRowCarousel title="Nuevos recursos" games={newResult.items} href="/games" />

      <GameRowCarousel title="Mas usados" games={popularResult.items} href="/games" />

      {sections.map(({ category, games }) => (
        <GameRowCarousel
          key={category.id}
          title={category.name}
          games={games}
          href={`/categories/${category.slug}`}
        />
      ))}
    </main>
  );
}