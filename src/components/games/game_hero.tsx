import Link from 'next/link';
import Image from 'next/image';
import type { Game } from '@/src/types/game';
import { Play, Search, Sparkles } from 'lucide-react';

type Props = {
  game: Game | null;
};

const fallbackCover = '/file.svg';

export function GameHero({ game }: Props) {
  if (!game) {
    return (
      <section className="card-startup min-h-[300px] flex items-center justify-center">
        <div className="card-startup-inner text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-400">
            <Sparkles size={24} />
          </div>
          <h1 className="text-2xl font-bold mt-4">Próximamente</h1>
          <p className="text-sm text-slate-500 max-w-xs">Estamos preparando los mejores recursos para tus estudios.</p>
        </div>
      </section>
    );
  }

  const heroImage = game.hero_image_url || game.cover_image_url || fallbackCover;

  return (
    <section className="group relative min-h-[400px] md:min-h-[450px] overflow-hidden rounded-[2.5rem] bg-slate-900 shadow-2xl transition-all duration-500">
      {/* Background Image with Parallax-like effect */}
      <div className="absolute inset-0">
        <Image
          src={heroImage}
          alt={game.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105 opacity-60"
          sizes="100vw"
          priority
          unoptimized
        />
        {/* Modern Gradients */}
        <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/40 to-transparent" />
        <div className="absolute inset-0 bg-linear-to-r from-slate-950 via-slate-950/20 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col justify-end p-8 md:p-12 lg:p-16">
        <div className="flex flex-col items-start gap-6 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-violet-500/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-300 backdrop-blur-md border border-violet-500/30">
            <Sparkles size={12} className="text-violet-400" />
            Destacado de la semana
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-white md:text-5xl lg:text-6xl drop-shadow-sm">
            {game.title}
          </h1>

          {game.short_description && (
            <p className="text-base text-slate-300/90 leading-relaxed max-w-xl line-clamp-2 md:line-clamp-none">
              {game.short_description}
            </p>
          )}

          <div className="flex flex-wrap gap-4 pt-2">
            <Link 
              href={game.redirect_url || `/games/${game.slug}`}
              target={game.redirect_url ? "_blank" : undefined}
              rel={game.redirect_url ? "noreferrer" : undefined}
              className="btn-primary flex items-center gap-2 px-8"
            >
              <Play size={18} fill="currentColor" />
              Ver ahora
            </Link>
            
            <Link
              href="/games"
              className="flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-white/20 hover:border-white/50 backdrop-blur-sm shadow-sm active:scale-95"
            >
              <Search size={18} />
              Explorar
            </Link>
          </div>
        </div>
      </div>

      {/* Subtle overlay lines for texture */}
      <div className="absolute inset-0 pointer-events-none opacity-10 bg-[radial-gradient(circle_at_1px_1px,#ffffff1a_1px,transparent_0)] bg-size-[32px_32px]" />
    </section>
  );
}
