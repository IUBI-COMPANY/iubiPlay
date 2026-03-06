"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Search, 
  Menu, 
  X, 
  Rocket, 
  GraduationCap, 
  Gamepad2, 
  LogOut, 
  User, 
  Bell, 
  Sparkles,
  LayoutDashboard,
  SearchIcon,
  Moon,
  Sun
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/src/lib/utils';

type NavItem = { label: string; href: string };

type Props = {
  children: React.ReactNode;
  navItems: NavItem[];
};

export function PublicShell({ children, navItems }: Props) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [authUser, setAuthUser] = React.useState<{ username: string | null; email: string | null } | null>(null);
  const [authReady, setAuthReady] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const pathname = usePathname();

  const closeMenu = () => setIsOpen(false);

  React.useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  React.useEffect(() => {
    let active = true;

    const loadUser = async () => {
      try {
        const res = await fetch('/api/auth/me', {
          credentials: 'include',
          cache: 'no-store',
        });
        if (!res.ok) {
          if (active) setAuthUser(null);
          return;
        }
        const json = (await res.json()) as {
          ok?: boolean;
          user?: { username?: string | null; email?: string | null };
        };
        if (active && json?.ok && json.user) {
          setAuthUser({
            username: json.user.username ?? null,
            email: json.user.email ?? null,
          });
        }
      } catch (e) {
        console.error("Auth check failed", e);
      } finally {
        if (active) setAuthReady(true);
      }
    };

    loadUser();

    return () => {
      active = false;
    };
  }, [pathname]);

  const handleLogout = React.useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } finally {
      setAuthUser(null);
      setAuthReady(true);
    }
  }, []);

  const displayName = authUser?.username ?? authUser?.email ?? null;

  // Function to get icon based on item label
  const getIcon = (label: string) => {
    const l = label.toLowerCase();
    if (l.includes('principal') || l.includes('home')) return <LayoutDashboard size={18} />;
    if (l.includes('herramienta') || l.includes('games')) return <Rocket size={18} />;
    if (l.includes('estudio') || l.includes('course')) return <GraduationCap size={18} />;
    return <Gamepad2 size={18} />;
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar - Desktop */}
      <aside className="hidden w-72 flex-col border-r border-slate-200/50 dark:border-white/5 glass-panel sticky top-0 h-screen md:flex">
        <div className="flex items-center gap-3 p-8">
          <span className="text-xl font-extrabold tracking-tight bg-linear-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            IUBIPLAY
          </span>
        </div>

        <nav className="flex-1 space-y-2 p-6 overflow-y-auto">
          <p className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Navegación
          </p>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "nav-link text-slate-600 dark:text-slate-300",
                  isActive && "active"
                )}
              >
                {getIcon(item.label)}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-6">
          <div className="rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 p-4 border border-indigo-100 dark:border-indigo-500/20">
            <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-400">¿Eres nuevo?</p>
            <p className="mt-1 text-[11px] text-indigo-600 dark:text-indigo-300/80">Descubre recursos para potenciar tus estudios.</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex min-h-screen flex-1 flex-col">
        {/* Header */}
        <header 
          className={cn(
            "sticky top-0 z-40 w-full transition-all duration-200 px-4 py-3 md:px-8",
            scrolled ? "bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/5 py-3" : "bg-transparent py-5"
          )}
        >
          <div className="mx-auto flex w-full items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-xl glass-panel text-slate-600 dark:text-white md:hidden"
                onClick={() => setIsOpen(true)}
              >
                <Menu size={20} />
              </button>
              <form action="/games" method="get" className="hidden sm:block">
                <div className="relative group transition-all">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 transition-colors">
                    <Search size={18} />
                  </span>
                  <input
                    name="search"
                    placeholder="Buscar herramientas..."
                    className="h-11 w-64 rounded-2xl bg-slate-100 dark:bg-white/5 border border-transparent focus:border-violet-500/50 pl-11 pr-4 text-sm outline-none transition-all focus:w-80"
                  />
                </div>
              </form>
            </div>

            <div className="flex items-center gap-3">
              {displayName ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 rounded-2xl glass-panel px-4 py-2 text-sm font-medium">
                    <User size={16} className="text-violet-500" />
                    <span>{displayName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex h-10 w-10 items-center justify-center rounded-2xl text-slate-500 hover:text-red-500 hover:bg-red-50/50 dark:hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              ) : authReady ? (
                <div className="flex items-center gap-2">
              <Link 
                href="/auth/login" 
                className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Entrar
              </Link>
              <Link 
                href="/auth/register" 
                className="btn-primary"
              >
                Regístrate
              </Link>
            </div>
              ) : null}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 px-4 py-6 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {children}
          </motion.div>
        </main>

        {/* Mobile Sidebar */}
        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-sm md:hidden" 
                onClick={closeMenu} 
              />
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 left-0 z-70 w-72 bg-white dark:bg-slate-900 shadow-2xl md:hidden"
              >
                <div className="flex items-center justify-between p-6">
                  <span className="text-lg font-bold">IUBIPLAY</span>
                  <button
                    type="button"
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-white/5"
                    onClick={closeMenu}
                  >
                    <X size={20} />
                  </button>
                </div>
                <nav className="mt-4 px-4 space-y-2">
                  {navItems.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={closeMenu}
                      className={cn(
                        "nav-link",
                        pathname === item.href && "active"
                      )}
                    >
                      {getIcon(item.label)}
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}