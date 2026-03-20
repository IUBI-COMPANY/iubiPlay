"use client";

import React from 'react';
import { useAuthUser } from '@/src/hooks/useAuthUser';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Search, 
  Menu, 
  X, 
  Rocket, 
  GraduationCap, 
  LogOut, 
  User, 
  LayoutDashboard,
  BookText, 
  Calculator,
  FlaskConical,
  Languages,
  Palette,
  Library,
  Globe,
  Music,
  Dumbbell,
  Users,
  Heart,
  Atom,
  Beaker,
  Radical,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/src/lib/utils';

type NavItem = { label: string; href: string; icon?: string };

type Props = {
  children: React.ReactNode;
  navItems: NavItem[];
};

export function PublicShell({ children, navItems }: Props) {
  const [isOpen, setIsOpen] = React.useState(false);
  const { user, loading: authLoading } = useAuthUser();
  const pathname = usePathname();
  const closeMenu = () => setIsOpen(false);

  const handleLogout = React.useCallback(async () => {
    try {
      const { getBrowserSupabaseClient } = await import('@/src/lib/supabase/client');
      const supabase = getBrowserSupabaseClient();
      await supabase.auth.signOut();
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (e) {
      console.error('Logout error', e);
    }
  }, []);

  const displayName = user?.username ?? user?.email ?? null;

  // Function to get icon based on item label
  const getIcon = (label: string, iconName?: string) => {
    const iconsMap: Record<string, React.ReactNode> = {
      'LayoutDashboard': <LayoutDashboard size={18} />,
      'Rocket': <Rocket size={18} />,
      'GraduationCap': <GraduationCap size={18} />,
      'BookText': <BookText size={18} />,
      'Calculator': <Calculator size={18} />,
      'FlaskConical': <FlaskConical size={18} />,
      'Languages': <Languages size={18} />,
      'Palette': <Palette size={18} />,
      'Library': <Library size={18} />,
      'Globe': <Globe size={18} />,
      'Music': <Music size={18} />,
      'Dumbbell': <Dumbbell size={18} />,
      'Users': <Users size={18} />,
      'Heart': <Heart size={18} />,
      'Atom': <Atom size={18} />,
      'Beaker': <Beaker size={18} />,
      'Radical': <Radical size={18} />,
    };

    if (iconName && iconsMap[iconName]) {
      return iconsMap[iconName];
    }

    const l = label.toLowerCase();
    
    // Iconos de navegación principal
    if (l.includes('principal') || l.includes('home')) return iconsMap['LayoutDashboard'];
    if (l.includes('herramienta') || l.includes('games')) return iconsMap['Rocket'];
    if (l.includes('estudio')) return iconsMap['GraduationCap'];
    
    // Mapeo inteligente por palabras clave para CURSOS
    if (l.includes('personal')) return iconsMap['Heart'];
    if (l.includes('sociales') || l.includes('social') || l.includes('society')) return iconsMap['Users'];
    if (l.includes('comunicacion') || l.includes('lenguaje') || l.includes('letras') || l.includes('spanish')) return iconsMap['BookText'];
    if (l.includes('matematica') || l.includes('math') || l.includes('numeros') || l.includes('logica')) return iconsMap['Radical'];
    if (l.includes('fisica')) return iconsMap['Atom'];
    if (l.includes('quimica')) return iconsMap['Beaker'];
    if (l.includes('ciencia') || l.includes('ambiente') || l.includes('nature')) return iconsMap['FlaskConical'];
    if (l.includes('ingles') || l.includes('english') || l.includes('idioma')) return iconsMap['Languages'];
    if (l.includes('arte') || l.includes('dibujo') || l.includes('plastica')) return iconsMap['Palette'];
    if (l.includes('historia')) return iconsMap['Library'];
    if (l.includes('geografia')) return iconsMap['Globe'];
    if (l.includes('música') || l.includes('music')) return iconsMap['Music'];
    if (l.includes('física') || l.includes('deporte') || l.includes('gym')) return iconsMap['Dumbbell'];
    
    // Fallback genérico para cursos si no hay coincidencia
    return iconsMap['GraduationCap'];
  };

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Sidebar - Desktop */}
      <aside className="hidden w-72 flex-col border-r border-slate-200/50 border-white/5 glass-panel sticky top-0 h-screen md:flex self-start">
        <div className="flex items-center gap-3 p-8">
          <span className="text-xl font-extrabold tracking-tight">
            <span className="text-white">IUBI</span><span className="text-violet-600">PLAY</span>
          </span>
        </div>

        <nav className="flex-1 space-y-2 p-6 overflow-y-auto">
          <p className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-white">
            Navegación
          </p>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "nav-link text-white",
                  isActive && "active"
                )}
              >
                {getIcon(item.label, item.icon)}
                {item.label}
              </Link>
            );
          })}

          {/* Mis Clases removido del sidebar */}
        </nav>

        <div className="p-6">
          <div className="rounded-2xl bg-indigo-50 p-4 border border-indigo-100">
            <p className="text-xs font-semibold text-indigo-700">¿Eres nuevo?</p>
            <p className="mt-1 text-[11px] text-indigo-600">Descubre recursos para potenciar tus estudios.</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex min-h-screen flex-1 flex-col min-w-0 relative">
        {/* Header */}
        <header 
          className={cn(
            "sticky top-0 z-50 w-full transition-all duration-200 px-4 py-6 md:px-8 bg-slate-900/95 backdrop-blur border-b border-white/10"
          )}
        >
          <div className="mx-auto flex w-full items-center justify-between gap-2 md:gap-4 min-w-0">
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-xl glass-panel text-white md:hidden"
                onClick={() => setIsOpen(true)}
              >
                <Menu size={20} />
              </button>
              <form action="/games" method="get" className="hidden lg:block flex-1 max-w-md">
                <div className="relative group transition-all">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 transition-colors">
                    <Search size={18} />
                  </span>
                  <input
                    name="search"
                    placeholder="Buscar herramientas..."
                    className="h-11 w-full rounded-2xl bg-slate-800 border border-transparent focus:border-violet-500/50 pl-11 pr-4 text-sm text-white placeholder:text-slate-300 outline-none transition-all"
                  />
                </div>
              </form>
            </div>

            <div className="flex items-center gap-2 md:gap-3 shrink-0">
              {authLoading ? null : user ? (
                <div className="flex items-center gap-2">
                  <Link
                    href="/my-classes"
                    className="hidden sm:flex items-center gap-2 rounded-2xl bg-violet-600 px-4 py-2.5 text-[13px] font-bold text-white shadow-lg shadow-violet-500/25 hover:bg-violet-700 transition-all hover:scale-[1.02] active:scale-95"
                  >
                    <BookText className="w-4 h-4" />
                    Ver Mis Clases
                  </Link>
                  <Link
                    href="/admin/games/new"
                    className="hidden sm:flex items-center gap-2 rounded-2xl bg-violet-600 px-4 py-2.5 text-[13px] font-bold text-white shadow-lg shadow-violet-500/25 hover:bg-violet-700 transition-all hover:scale-[1.02] active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    Contribuir
                  </Link>
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 rounded-2xl glass-panel px-4 py-2 text-sm font-medium hover:text-violet-200 transition-colors"
                  >
                    <User size={16} className="text-violet-500" />
                    <span>{displayName}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex h-10 w-10 items-center justify-center rounded-2xl text-slate-500 hover:text-red-500 hover:bg-white transition-colors"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link 
                    href="/auth/login" 
                    className="px-4 py-2 text-sm font-bold text-white hover:text-slate-300 transition-colors"
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
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 px-4 py-6 md:px-8 bg-slate-900/60">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {children}
          </motion.div>
        </main>

        <footer className="border-t border-white/10 bg-slate-900/80 px-6 py-8 md:px-8">
          <div className="mx-auto flex w-full flex-col items-start justify-between gap-6 text-sm text-slate-400 md:flex-row md:items-center">
            <div className="font-semibold text-white">
              <span className="text-white">IUBI</span>
              <span className="text-violet-500">PLAY</span>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/games" className="hover:text-violet-300 transition-colors">Juegos</Link>
              <Link href="/my-classes" className="hover:text-violet-300 transition-colors">Mis Clases</Link>
              <Link href="/profile" className="hover:text-violet-300 transition-colors">Perfil</Link>
            </div>
            <div className="text-xs text-slate-500">© {new Date().getFullYear()} IUBIPLAY</div>
          </div>
        </footer>

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
                className="fixed inset-y-0 left-0 z-70 w-72 bg-slate-900 text-white shadow-2xl md:hidden"
              >
                <div className="flex items-center justify-between p-6">
                  <span className="text-lg font-bold">
                    <span className="text-white">IUBI</span>
                    <span className="text-violet-600">PLAY</span>
                  </span>
                  <button
                    type="button"
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800"
                    onClick={closeMenu}
                  >
                    <X size={20} />
                  </button>
                </div>
                <nav className="mt-4 px-4 space-y-2">
                  {!authLoading && user && (
                    <Link
                      href="/my-classes"
                      onClick={closeMenu}
                      className="nav-link text-white hover:text-violet-400"
                    >
                      <BookText size={18} />
                      Ver Mis Clases
                    </Link>
                  )}
                  {navItems.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={closeMenu}
                      className={cn(
                        "nav-link text-white hover:text-violet-400",
                        pathname === item.href && "font-bold text-violet-400"
                      )}
                    >
                      {getIcon(item.label, item.icon)}
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
