import Link from 'next/link';
import Image from 'next/image';
import type { Game } from '@/src/types/game';
import { ArrowUpRight } from 'lucide-react';

type Props = {
  game: Game;
  priority?: boolean;
};

const fallbackCover = '/file.svg';

export function GameCard({ game, priority = false }: Props) {
  const cover = game.cover_image_url || fallbackCover;
  const href = `/games/${game.slug}`;

  return (
    <Link
      href={href}
      className="card-startup w-full flex flex-col group overflow-hidden"
    >
      <div className="card-startup-inner p-0! flex flex-col h-full overflow-hidden">
        <div className="relative h-40 w-full overflow-hidden rounded-2xl bg-slate-100 dark:bg-white/5">
          <Image
            src={cover}
            alt={game.title}
            fill
            sizes="240px"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            priority={priority}
            unoptimized
          />
          <div className="absolute inset-0 bg-linear-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all">
            <ArrowUpRight size={18} />
          </div>
        </div>
        <div className="flex flex-1 flex-col justify-between p-4 bg-transparent">
          <div className="space-y-1">
            <h3 className="line-clamp-1 text-base font-bold text-white group-hover:text-violet-500 transition-colors">
              {game.title}
            </h3>
            {game.short_description && (
              <p className="line-clamp-2 text-xs text-slate-500 dark:text-white leading-snug">
                {game.short_description}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-2 mt-2">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white">Recurso</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
