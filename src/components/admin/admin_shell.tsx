"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 

  Gamepad2, 
  Tags, 

  ArrowLeft,
  Menu,
  LogOut,
  User
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
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
  const [isAuthChecking, setIsAuthChecking] = React.useState(true);
  const [authUser, setAuthUser] = React.useState<{ username: string | null; email: string | null; role?: string | null } | null>(null);

  // Close menu when route changes
  React.useEffect(() => {
    // setIsMobileMenuOpen(false);
  }, [pathname]);

  // Auth check
  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        let res = await fetch('/api/auth/me', { credentials: 'include' });
        if (res.status === 401) {
          // Fallback: intenta obtener el token con el SDK de Supabase
          try {
            const { getBrowserSupabaseClient } = await import('@/src/lib/supabase/client');
            const supabase = getBrowserSupabaseClient();
            const { data: sessionData } = await supabase.auth.getSession();
            const accessToken = sessionData?.session?.access_token;
            if (accessToken) {
              res = await fetch('/api/auth/me', {
                headers: { Authorization: `Bearer ${accessToken}` },
                cache: 'no-store',
              });
            }
          } catch {}
        }
        if (!res.ok) {
          router.push('/auth/login?redirectTo=' + encodeURIComponent(pathname));
          return;
        }
        const data = await res.json();
        const userRole = data?.user?.role ?? null;
        if (userRole !== 'user' && userRole !== 'admin') {
          router.push('/');
          return;
        }
        setAuthUser({
          username: data?.user?.username ?? null,
          email: data?.user?.email ?? null,
          role: userRole,
        });
        setIsAuthChecking(false);
      } catch (e) {
        console.error("Auth check failed", e);
        router.push('/');
      }
    };
    checkAuth();
  }, [router, pathname]);
  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        let res = await fetch('/api/auth/me', { credentials: 'include' });
        if (res.status === 401) {
          // Fallback: intenta obtener el token con el SDK de Supabase
          try {
            const { getBrowserSupabaseClient } = await import('@/src/lib/supabase/client');
            const supabase = getBrowserSupabaseClient();
            const { data: sessionData } = await supabase.auth.getSession();
            const accessToken = sessionData?.session?.access_token;
            if (accessToken) {
              res = await fetch('/api/auth/me', {
                headers: { Authorization: `Bearer ${accessToken}` },
                cache: 'no-store',
              });
            }
          } catch (e) {
            console.error('Fallback auth error', e);
          }
        }
        if (!res.ok) {
          router.push('/auth/login?redirectTo=' + encodeURIComponent(pathname));
          return;
        }
        const data = await res.json();
        const userRole = data?.user?.role ?? null;
        if (userRole !== 'admin' && userRole !== 'user') {
          router.push('/');
          return;
        }
        setAuthUser({
          username: data?.user?.username ?? null,
          email: data?.user?.email ?? null,
          role: userRole,
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

  return (
    <div className="flex min-h-screen">
      {/* Sidebar - Desktop */}
      <aside className="hidden w-72 flex-col border-r border-white/5 glass-panel sticky top-0 h-screen md:flex self-start bg-slate-900">
        <div className="flex items-center gap-3 p-8">
          <span className="text-xl font-extrabold tracking-tight">
            <span className="text-white">IUBI</span><span className="text-violet-600">PLAY</span>
          </span>
        </div>
        <nav className="flex-1 space-y-2 p-6 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "nav-link text-white",
                  isActive && "bg-violet-600 text-white shadow-lg shadow-violet-500/20"
                )}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-6">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-white hover:bg-violet-600 transition-all"
          >
            <ArrowLeft size={18} />
            Volver a la web
          </Link>
        </div>
      </aside>
      {/* Main Content */}
      <div className="flex min-h-screen flex-1 flex-col min-w-0 relative bg-slate-900">
        {/* Header */}
        <header className="sticky top-0 z-40 w-full transition-all duration-200 px-4 py-6 md:px-8 bg-slate-900">
          <div className="mx-auto flex w-full items-center justify-between gap-2 md:gap-4 min-w-0">
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-xl glass-panel text-white md:hidden"
                // onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu size={20} />
              </button>
              <h1 className="text-sm md:text-lg font-black tracking-tight text-white uppercase">Colabora con la Comunidad</h1>
            </div>
            <div className="flex items-center gap-3">
              {authUser && (
                <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-2xl glass-panel text-sm font-medium text-white">
                  <User size={16} className="text-violet-500" />
                  <span className="truncate max-w-[120px]">{authUser.username || authUser.email}</span>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-50/50 rounded-xl transition-colors"
                title="Cerrar sesión"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </header>
        {/* Page Content */}
        <main className="flex-1 px-4 py-6 md:px-8">
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
        </main>
      </div>
    </div>
  );
}
