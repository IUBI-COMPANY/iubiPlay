"use client";

import React from 'react';
import Link from 'next/link';

type NavItem = { label: string; href: string };

type Props = {
  children: React.ReactNode;
  navItems: NavItem[];
};

export function PublicShell({ children, navItems }: Props) {
  const [isOpen, setIsOpen] = React.useState(false);

  const closeMenu = () => setIsOpen(false);

  return (
    <div className="min-h-screen bg-[#1a0f2d] text-white">
      <div className="flex min-h-screen w-full">
        <aside className="hidden w-60 flex-col gap-6 border-r border-white/10 bg-[#241038] p-5 shadow-lg md:flex">
          <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
            IUBIPLAY
          </Link>
          <nav className="space-y-2 text-sm text-slate-200">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center gap-2 rounded-lg px-3 py-2 transition hover:bg-white/10"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-purple-300" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col gap-6 px-4 py-6 md:px-6">
          <header className="flex flex-wrap items-center gap-4 rounded-2xl bg-[#2c1346] px-4 py-4 shadow-lg md:px-6">
            <button
              type="button"
              className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm md:hidden"
              onClick={() => setIsOpen(true)}
              aria-label="Abrir menu"
            >
              ☰
            </button>
            <Link href="/" className="text-lg font-semibold text-white md:hidden">
              IubiPlay
            </Link>
            <form action="/games" method="get" className="flex-1">
              <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
                <input
                  name="search"
                  placeholder="Buscar"
                  className="w-full bg-transparent text-sm text-white placeholder:text-purple-200 outline-none"
                />
              </div>
            </form>
            <div className="flex items-center gap-2">
              <Link
                href="/auth/login"
                className="rounded-full border border-white/20 px-4 py-2 text-sm text-white hover:border-white/40"
              >
                Iniciar sesion
              </Link>
              <Link
                href="/auth/register"
                className="rounded-full bg-white/10 px-4 py-2 text-sm text-white"
              >
                Registrarse
              </Link>
            </div>
          </header>

          <main className="flex-1">{children}</main>
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={closeMenu} />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform rounded-r-2xl bg-[#241038] p-4 shadow-lg transition-transform md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-hidden={!isOpen}
      >
        <div className="flex items-center justify-between">
          <Link href="/" className="text-lg font-semibold" onClick={closeMenu}>
            IubiPlay
          </Link>
          <button
            type="button"
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm"
            onClick={closeMenu}
            aria-label="Cerrar menu"
          >
            ✕
          </button>
        </div>
        <nav className="mt-6 space-y-2 text-sm text-slate-200">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={closeMenu}
              className="flex items-center gap-2 rounded-lg px-3 py-2 transition hover:bg-white/10"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-purple-300" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
    </div>
  );
}
