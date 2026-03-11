"use client";

import React from 'react';

import { Category } from '@/src/types/category';

import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';

type Props = {
  categories: Category[];
};

export function CategoryCoverflow({ categories }: Props) {
  if (!categories || categories.length === 0) return null;

  return (
    <div className="w-full pt-6 pb-12">
      <div className="flex flex-col items-center mb-10">
        <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-800 dark:text-white mb-3">
          Explora por Cursos
        </h2>
        <p className="text-slate-500 dark:text-slate-400">Desliza para descubrir más</p>
      </div>


    </div>
  );
}
