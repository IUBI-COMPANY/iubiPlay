import Link from 'next/link';
import Image from 'next/image';

import type { Game } from '@/src/types/game';

type Props = {
  game: Game | null;
};

const fallbackCover = '/file.svg';

export function GameHero({ game }: Props) {
  if (!game) {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white">
        <h1 className="text-2xl font-semibold">Catalogo de juegos</h1>
        <p className="mt-2 text-sm text-slate-300">Agrega juegos publicados para destacarlos aqui.</p>
      </section>
    );
  }

  const heroImage = game.hero_image_url || game.cover_image_url || fallbackCover;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5">
      <div className="absolute inset-0">
        <Image
          src={heroImage}
          alt={game.title}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 70vw"
          priority
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/50 to-transparent" />
      </div>
      <div className="relative z-10 flex flex-col gap-4 p-8 text-white">
        <p className="text-xs uppercase tracking-[0.2em] text-purple-200">Destacado</p>
        <h1 className="text-3xl font-semibold md:text-4xl">{game.title}</h1>
        {game.short_description && (
          <p className="max-w-xl text-sm text-slate-200">{game.short_description}</p>
        )}
        <div className="flex flex-wrap gap-3">
          <Link href={`/games/${game.slug}`} className="btn-primary">
            Ver juego
          </Link>
          {game.redirect_url && (
            <a
              className="rounded-md border border-white/30 px-4 py-2 text-sm text-white hover:border-white"
              href={game.redirect_url}
              target="_blank"
              rel="noreferrer"
            >
              Abrir
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
