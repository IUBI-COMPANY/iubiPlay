"use client";

import Link from 'next/link';
import Image from 'next/image';
import type { Game } from '@/src/types/game';
import { Play, Search, Sparkles } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, EffectFade, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/effect-fade';

type Props = {
  games: Game[];
};

const fallbackCover = '/file.svg';

export function GameHero({ games }: Props) {
  if (!games || games.length === 0) {
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

  return (
    <section className="group relative h-[350px] md:h-[480px] overflow-hidden rounded-3xl md:rounded-[2rem] bg-slate-900 shadow-xl md:shadow-2xl w-full">
      <Swiper
        modules={[Autoplay, Pagination, Navigation, EffectFade]}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        pagination={{ clickable: true, dynamicBullets: true }}
        navigation={true}
        loop={true}
        className="h-full w-full group/swiper [&_.swiper-button-prev]:hidden! md:[&_.swiper-button-prev]:flex! [&_.swiper-button-next]:hidden! md:[&_.swiper-button-next]:flex!"
        style={{
          '--swiper-pagination-color': '#8b5cf6',
          '--swiper-pagination-bullet-inactive-color': '#fff',
          '--swiper-pagination-bullet-inactive-opacity': '0.3',
          '--swiper-pagination-bottom': '16px',
          '--swiper-navigation-color': '#fff',
          '--swiper-navigation-size': '24px',
          '--swiper-navigation-sides-offset': '24px',
        } as React.CSSProperties}
      >
        {games.map((game) => {
          const heroImage = game.hero_image_url || game.cover_image_url || fallbackCover;
          
          return (
            <SwiperSlide key={game.id} className="relative h-full w-full">
              {/* Background Image Container */}
              <div className="absolute inset-0 h-full w-full">
                <Image
                  src={heroImage}
                  alt={game.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover/swiper:scale-105"
                  sizes="100vw"
                  priority
                  unoptimized
                />
                {/* Modern Gradients - Re-centered for centered content */}
                <div className="absolute inset-0 bg-slate-950/40 pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 via-transparent to-slate-950/20 pointer-events-none" />
              </div>

              {/* Content Container - Centered using absolute centering */}
              <div className="absolute inset-0 z-10 flex items-center p-6 md:p-10 lg:p-16">
                <div className="flex flex-col items-start gap-4 max-w-3xl">
                  <div className="inline-flex items-center gap-2 rounded-full bg-violet-500/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-300 backdrop-blur-md border border-violet-500/30">
                    <Sparkles size={12} className="text-violet-400" />
                    Destacado
                  </div>

                  <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-5xl lg:text-5xl drop-shadow-lg wrap-anywhere line-clamp-2">
                    {game.title}
                  </h1>

                  {game.short_description && (
                    <p className="text-sm md:text-lg text-white/90 font-medium leading-relaxed max-w-xl line-clamp-2 drop-shadow-md">
                      {game.short_description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-3 pt-2">
                    <Link
                      href={`/games/${game.slug}`}
                      className="btn-primary flex items-center gap-2 px-8 z-20 shadow-lg shadow-violet-500/20"
                    >
                      <Play size={18} fill="currentColor" />
                      Ver Detalles
                    </Link>
                    
                    <Link
                      href="/games"
                      className="flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-white/20 hover:border-white/50 backdrop-blur-sm shadow-sm active:scale-95 z-20"
                    >
                      <Search size={18} />
                      Explorar
                    </Link>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </section>
  );
}
