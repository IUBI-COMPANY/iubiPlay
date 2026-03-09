"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Pagination, Autoplay } from 'swiper/modules';
import { Category } from '@/src/types/category';

import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';

type Props = {
  categories: Category[];
};

export function CategoryCoverflow({ categories }: Props) {
  if (!categories || categories.length === 0) return null;

  // Premium abstract 3D images from Unsplash
  const abstractImages = [
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80", // Liquid purple/blue
    "https://images.unsplash.com/photo-1557672172-298e090bd0f1?auto=format&fit=crop&w=600&q=80", // Abstract mesh pink
    "https://images.unsplash.com/photo-1557682250-33bd709cbe85?auto=format&fit=crop&w=600&q=80", // Abstract mesh green
    "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=600&q=80", // Abstract mesh dark blue
    "https://images.unsplash.com/photo-1557682224-5b8590cddfbd?auto=format&fit=crop&w=600&q=80", // Abstract mesh purple
    "https://images.unsplash.com/photo-1557682260-96773eb01377?auto=format&fit=crop&w=600&q=80", // Abstract mesh colorful
  ];

  const getCategoryImage = (slug: string, index: number) => {
    const s = slug.toLowerCase();
    
    // Sociales (conexiones, historia humana, calidez)
    if (s.includes('sociales') || s.includes('social')) 
      return "https://images.unsplash.com/photo-1511884642898-4c92249e20b6?auto=format&fit=crop&w=600&q=80";
    
    // Comunicación y Lenguaje (Formas abstractas y libros)
    if (s.includes('comunicacion') || s.includes('lenguaje')) 
      return "https://images.unsplash.com/photo-1512314889357-e157c22f938d?auto=format&fit=crop&w=600&q=80";
    
    // Matemáticas (Signos matemáticos, ecuaciones, pizarra)
    if (s.includes('matematica') || s.includes('math')) 
      return "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=600&q=80";
    
    // Ciencias y Tecnología (Moleculas 3D abstractas y nítidas)
    if (s.includes('ciencia') || s.includes('nature') || s.includes('quimica') || s.includes('tecnologia')) 
      return "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=600&q=80";
    
    // Inglés / Idiomas (formas abstractas, colores vivos y modernos)
    if (s.includes('ingles') || s.includes('idioma')) 
      return "https://images.unsplash.com/photo-1572044162444-ad60f128bdea?auto=format&fit=crop&w=600&q=80";
    
    // Arte (pintura fluida hipercolorida - Fluid acrylic pour)
    if (s.includes('arte') || s.includes('cultura') || s.includes('dibujo')) 
      return "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=600&q=80";
    
    // Historia (Textura dorada antigua / Monumental)
    if (s.includes('historia')) 
      return "https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=600&q=80";
    
    // Geografía (Mapas abstractos / topografía 3D)
    if (s.includes('geografia')) 
      return "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=600&q=80";
    
    // Música (Ondas sonoras, vibraciones de luz, neon)
    if (s.includes('musica')) 
      return "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=600&q=80";
    
    // Física / Educación Física (Movimiento, energía luminosa)
    if (s.includes('fisica') || s.includes('deporte')) 
      return "https://images.unsplash.com/photo-1554629947-334ff61d85dc?auto=format&fit=crop&w=600&q=80";
    
    // Fallback: rotación de texturas abstractas de malla por defecto
    return abstractImages[index % abstractImages.length];
  };

  return (
    <div className="w-full pt-6 pb-12 overflow-hidden">
      <div className="flex flex-col items-center mb-10">
        <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-800 dark:text-white mb-3">
          Explora por Cursos
        </h2>
        <p className="text-slate-500 dark:text-slate-400">Desliza en 3D para descubrir más</p>
      </div>

      <Swiper
        effect={'coverflow'}
        grabCursor={true}
        centeredSlides={true}
        slidesPerView={'auto'}
        loop={true}
        autoplay={{
          delay: 3500,
          disableOnInteraction: false,
        }}
        coverflowEffect={{
          rotate: 30, // Grados de rotación de las tarjetas laterales
          stretch: 0, // Espacio entre tarjetas
          depth: 150, // Profundidad (z-index offset)
          modifier: 1, // Multiplicador de efecto
          slideShadows: true, // Sombras 3D
        }}
        pagination={{ clickable: true, dynamicBullets: true }}
        modules={[EffectCoverflow, Pagination, Autoplay]}
        className="w-full max-w-5xl pb-12!"
        style={{
          '--swiper-pagination-color': '#8b5cf6',
        } as React.CSSProperties}
      >
        {categories.map((cat, index) => {
          const bgImage = getCategoryImage(cat.slug, index);
          return (
            <SwiperSlide key={cat.id} className="w-[300px] sm:w-[350px] h-[550px]">
              <Link href={`/categories/${cat.slug}`} className="block w-full h-full relative group">
                <div className={`w-full h-full rounded-3xl p-[2px] shadow-2xl transition-all duration-300 group-hover:scale-[1.03] bg-linear-to-b from-white/20 to-white/5`}>
                  
                  {/* Outer container to clip the image */}
                  <div className="w-full h-full rounded-[22px] overflow-hidden relative">
                    
                    {/* Premium Abstract Image Background */}
                    <div className="absolute inset-0">
                      <Image 
                        src={bgImage} 
                        alt={cat.name} 
                        fill 
                        className="object-cover transition-transform duration-700 group-hover:scale-110" 
                        sizes="(max-width: 768px) 300px, 350px"
                        unoptimized
                      />
                      {/* Dark overlay to ensure text readability */}
                      <div className="absolute inset-0 bg-slate-900/50 mix-blend-multiply" />
                      {/* Gradient overlay from bottom */}
                      <div className="absolute inset-0 bg-linear-to-t from-slate-950/90 via-slate-900/30 to-transparent" />
                    </div>

                    {/* Content Layer with Frosted Glass feeling */}
                    <div className="relative w-full h-full flex flex-col items-center justify-center p-8 text-white">
                      {/* Central bold title text */}
                      <div className="relative z-10 flex flex-col items-center justify-center transform transition-transform duration-500 group-hover:-translate-y-2 group-hover:scale-105 w-full">
                        <h3 className="text-4xl sm:text-5xl font-black text-center mb-5 drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] tracking-tighter uppercase px-2 leading-none">
                          {cat.name}
                        </h3>

                        {cat.description && (
                          <div className="w-12 h-1.5 bg-white/50 rounded-full mb-5 shadow-md" />
                        )}

                        {cat.description && (
                          <p className="text-sm border-t border-transparent text-center text-white/95 line-clamp-3 font-semibold leading-relaxed px-4 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                            {cat.description}
                          </p>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              </Link>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </div>
  );
}
