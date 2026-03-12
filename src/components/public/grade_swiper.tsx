"use client";

import React from 'react';
import Link from 'next/link';
import { cn } from '@/src/lib/utils';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';

type Level = {
  id: string;
  slug: string;
  name: string;
  grade: string;
  stage: string;
};

type Props = {
  parsedLevels: Level[];
  activeStage: string;
  currentLevelSlug?: string;
  basePath: string;
};

export function GradeSwiper({ parsedLevels, activeStage, currentLevelSlug, basePath }: Props) {
  const filteredLevels = parsedLevels.filter((l) => l.stage === activeStage);

  return (
    <div className="w-full relative">
      <Swiper
        slidesPerView="auto"
        spaceBetween={12}
        grabCursor={true}
        className="w-full"
      >
        <SwiperSlide className="w-auto!">
          <Link
            href={basePath}
            className={cn(
              "px-5 py-2.5 rounded-xl text-xs font-black transition-all border uppercase tracking-wider flex items-center justify-center h-11 bg-violet-600 text-white border-transparent shadow-lg shadow-violet-500/20",
              !currentLevelSlug && "bg-violet-700 text-white"
            )}
          >
            Todos
          </Link>
        </SwiperSlide>

        {filteredLevels.map((l) => (
          <SwiperSlide key={l.id} className="w-auto!">
            <Link
              href={`${basePath}?level=${l.slug}`}
              className={cn(
                "min-w-[48px] px-4 h-11 flex items-center justify-center rounded-xl text-sm font-black transition-all border bg-white text-violet-600 border-slate-200",
                currentLevelSlug === l.slug && "shadow-lg shadow-violet-500/30 bg-white text-violet-700 border-violet-500"
              )}
              passHref
            >
              {l.grade}
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
