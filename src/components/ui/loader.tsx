"use client";

import React from "react";

type Props = {
  size?: number;
  className?: string;
};

export function Loader({ size = 32, className = "" }: Props) {
  const dim = `${size}px`;
  return (
    <div
      className={`inline-block rounded-full border-2 border-slate-600 border-t-violet-500 animate-spin ${className}`}
      style={{ width: dim, height: dim }}
      aria-label="Cargando"
      role="status"
    />
  );
}
