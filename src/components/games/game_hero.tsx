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
    <section className="group relative min-h-[400px] md:min-h-[450px] overflow-hidden rounded-3xl md:rounded-[2.5rem] bg-slate-900 shadow-xl md:shadow-2xl w-full">
      <Swiper
        modules={[Autoplay, Pagination, Navigation, EffectFade]}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        pagination={{ clickable: true, dynamicBullets: true }}
        navigation={true}
        loop={true}
        className="h-full w-full absolute inset-0 pb-8 group/swiper [&_.swiper-button-prev]:hidden! md:[&_.swiper-button-prev]:flex! [&_.swiper-button-next]:hidden! md:[&_.swiper-button-next]:flex!"
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
            <SwiperSlide key={game.id} className="relative w-full h-full bg-slate-900">
              {/* Background Image */}
              <div className="absolute inset-0 overflow-hidden">
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
                <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/40 to-transparent pointer-events-none" />
                <div className="absolute inset-0 bg-linear-to-r from-slate-950 via-slate-950/20 to-transparent pointer-events-none" />
              </div>

              {/* Content */}
              <div className="relative z-10 flex h-full flex-col justify-end p-6 md:py-12 md:pr-12 md:pl-20 lg:py-16 lg:pr-16 lg:pl-24 mb-8">
                <div className="flex flex-col items-start gap-6 max-w-3xl">
                  <div className="inline-flex items-center gap-2 rounded-full bg-violet-500/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-300 backdrop-blur-md border border-violet-500/30">
                    <Sparkles size={12} className="text-violet-400" />
                    Destacado
                  </div>

                  <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-5xl lg:text-6xl drop-shadow-sm wrap-anywhere line-clamp-3 md:line-clamp-none">
                    {game.title}
                  </h1>

                  {game.short_description && (
                    <p className="text-base text-slate-300/90 leading-relaxed max-w-xl line-clamp-2 md:line-clamp-none">
                      {game.short_description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-4 pt-2">
                    <Link 
                      href={`/games/${game.slug}`}
                      className="btn-primary flex items-center gap-2 px-8 z-20"
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

      {/* Subtle overlay lines for texture */}
      <div className="absolute inset-0 pointer-events-none opacity-10 bg-[radial-gradient(circle_at_1px_1px,#ffffff1a_1px,transparent_0)] bg-size-[32px_32px] z-20" />
    </section>
  );
}
