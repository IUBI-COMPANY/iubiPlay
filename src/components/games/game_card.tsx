import Link from 'next/link';
import Image from 'next/image';
import type { Game } from '@/src/types/game';

type Props = {
  game: Game;
  priority?: boolean;
};

const fallbackCover = '/file.svg';

export function GameCard({ game, priority = false }: Props) {
  const cover = game.cover_image_url || fallbackCover;

  return (
    <Link
      href={`/games/${game.slug}`}
      className="group flex min-w-[220px] flex-col overflow-hidden rounded-xl border border-white/10 bg-white/5 transition hover:-translate-y-1 hover:border-white/20"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden">
        <Image
          src={cover}
          alt={game.title}
          fill
          sizes="(max-width: 768px) 70vw, (max-width: 1200px) 30vw, 20vw"
          className="object-cover transition duration-300 group-hover:scale-105"
          priority={priority}
          unoptimized
        />
      </div>
      <div className="space-y-1 p-3">
        <h3 className="line-clamp-1 text-sm font-semibold text-white">{game.title}</h3>
        {game.short_description && (
          <p className="line-clamp-2 text-xs text-slate-300">{game.short_description}</p>
        )}
      </div>
    </Link>
  );
}
