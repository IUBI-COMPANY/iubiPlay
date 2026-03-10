"use client";

import Link from 'next/link';
import type { Game } from '@/src/types/game';
import { GameCard } from './game_card';
import { ChevronRight } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';

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
      
      <div className="w-full relative">
        <Swiper
          slidesPerView="auto"
          spaceBetween={16}
          grabCursor={true}
          className="w-full pb-6!"
        >
          {games.map((game) => (
            <SwiperSlide key={game.id} className="w-[85%]! sm:w-[45%]! md:w-[30%]! lg:w-[22%]! xl:w-[18%]!">
              <GameCard game={game} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
}
