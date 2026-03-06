import Link from 'next/link';
import type { Game } from '@/src/types/game';
import { GameCard } from './game_card';
import { ChevronRight } from 'lucide-react';

type Props = {
  title: string;
  games: Game[];
  href: string;
};

export function GameRowCarousel({ title, games, href }: Props) {
  if (!games || games.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-white">
          {title}
        </h2>
        <Link 
          href={href} 
          className="group flex items-center gap-1 text-sm font-bold text-violet-600 dark:text-violet-400 hover:text-violet-500 transition-colors"
        >
          Explorar todo
          <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
      
      <div className="hide-scrollbar flex w-full gap-6 overflow-x-auto pb-6 -mx-2 px-2 snap-x">
        {games.map((game) => (
          <div key={game.id} className="snap-start first:pl-2 last:pr-2">
            <GameCard game={game} />
          </div>
        ))}
      </div>
    </div>
  );
}
