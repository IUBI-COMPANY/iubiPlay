"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Gamepad2, 
  Tags, 
  Settings, 
  Sparkles, 
  Plus, 
  ArrowLeft,
  Menu,
  X,
  LogOut,
  User
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/src/lib/utils';

type Props = {
  children: React.ReactNode;
};

const navItems = [
  { label: 'Recursos', href: '/admin/games', icon: Gamepad2 },
  { label: 'Categorías', href: '/admin/categories', icon: Tags },
];

export function AdminShell({ children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isAuthChecking, setIsAuthChecking] = React.useState(true);
  const [authUser, setAuthUser] = React.useState<{ username: string | null; email: string | null } | null>(null);

  // Close menu when route changes
  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Auth check
  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (!res.ok) {
          router.push('/auth/login?redirectTo=' + encodeURIComponent(pathname));
          return;
        }
        const data = await res.json();
        setAuthUser({
          username: data?.user?.username ?? null,
          email: data?.user?.email ?? null,
        });
        setIsAuthChecking(false);
      } catch (e) {
        console.error("Auth check failed", e);
        router.push('/');
      }
    };
    checkAuth();
  }, [router, pathname]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      router.push('/');
    } catch (e) {
      console.error("Logout failed", e);
    }
  };

  const SidebarContent = () => (
    <>
      <div className="p-8 flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-linear-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/20">
          <Sparkles size={18} />
        </div>
        <span className="font-extrabold tracking-tight text-slate-900 dark:text-white">IUBI ADMIN</span>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-200",
                isActive 
                  ? "bg-violet-500 text-white shadow-lg shadow-violet-500/20" 
                  : "text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-100 dark:border-white/5">
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
        >
          <ArrowLeft size={18} />
          Volver a la web
        </Link>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-surface-muted dark:bg-[#020617]">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r border-slate-200/50 dark:border-white/5 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl hidden md:flex flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm md:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-950 shadow-2xl md:hidden flex flex-col"
            >
              <SidebarContent />
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="absolute top-6 right-4 p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 md:pl-64 min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-200/50 dark:border-white/5 px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 text-slate-500 md:hidden hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-sm md:text-lg font-black tracking-tight text-slate-900 dark:text-white uppercase">Gestión Administrativa</h1>
          </div>
          <div className="flex items-center gap-3">
            {authUser && (
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 text-sm font-medium">
                <User size={16} className="text-violet-500" />
                <span className="truncate max-w-[120px]">{authUser.username || authUser.email}</span>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-50/50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
              title="Cerrar sesión"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
          {isAuthChecking ? (
            <div className="flex h-[50vh] items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
            </div>
          ) : (
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
