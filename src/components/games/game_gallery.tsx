"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Thumbs, FreeMode, Mousewheel } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';
import 'swiper/css/free-mode';

type Props = {
  title: string;
  images: string[];
};

export function GameGallery({ title, images }: Props) {
  const [thumbsSwiper, setThumbsSwiper] = useState<any>(null);

  if (!images || images.length === 0) return null;

  return (
    <div className="w-full flex gap-4 h-[400px] md:h-[500px]">
      {/* Carrusel Vertical Izquierdo (Miniaturas) */}
      <div className="hidden md:block w-[120px] h-full">
        <Swiper
          onSwiper={setThumbsSwiper}
          direction="vertical"
          spaceBetween={12}
          slidesPerView="auto"
          freeMode={true}
          watchSlidesProgress={true}
          mousewheel={true}
          modules={[FreeMode, Navigation, Thumbs, Mousewheel]}
          className="h-full gallery-thumbs"
        >
          {images.map((img, index) => (
            <SwiperSlide key={index} className="h-[80px]! w-full rounded-2xl overflow-hidden cursor-pointer opacity-50 transition-opacity hover:opacity-100">
              <div className="relative w-full h-full">
                <Image
                  src={img}
                  alt={`Captura ${index + 1} de ${title}`}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Carrusel Principal */}
      <div className="flex-1 w-full h-full rounded-4xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xl group">
        <Swiper
          style={{
            '--swiper-navigation-color': '#fff',
            '--swiper-navigation-size': '24px',
            '--swiper-navigation-sides-offset': '24px',
          } as React.CSSProperties}
          spaceBetween={0}
          navigation={true}
          thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
          modules={[FreeMode, Navigation, Thumbs]}
          className="h-full w-full"
        >
          {images.map((img, index) => (
            <SwiperSlide key={index} className="w-full h-full relative">
              <Image
                src={img}
                alt={`Imagen principal ${index + 1} de ${title}`}
                fill
                className="object-cover"
                unoptimized
                priority={index === 0}
              />
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-black/50 to-transparent pointer-events-none" />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      <style jsx global>{`
        .gallery-thumbs .swiper-slide-thumb-active {
          opacity: 1 !important;
          border: 2px solid #8b5cf6;
        }
      `}</style>
    </div>
  );
}
