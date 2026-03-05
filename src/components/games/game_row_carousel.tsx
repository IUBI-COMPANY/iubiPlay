import Link from 'next/link';
import type { Game } from '@/src/types/game';
import { GameCard } from './game_card';

type Props = {
  title: string;
  games: Game[];
  href?: string;
};

export function GameRowCarousel({ title, games, href }: Props) {
  if (games.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {href && (
          <Link href={href} className="text-xs font-medium text-purple-200 hover:text-white">
            Ver todo
          </Link>
        )}
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {games.map((game, index) => (
          <GameCard key={game.id} game={game} priority={index < 2} />
        ))}
      </div>
    </section>
  );
}
