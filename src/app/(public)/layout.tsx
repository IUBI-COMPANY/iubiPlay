


import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getPublicNavItems } from '@/src/lib/nav/public_nav';
import { PublicShell } from '@/src/components/public/public_shell';

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const navItems = await getPublicNavItems();

  // Validar si el usuario autenticado no tiene username
  const cookieStore = await cookies();
  const accessToken = cookieStore.get?.('sb-access-token')?.value;
  const refreshToken = cookieStore.get?.('sb-refresh-token')?.value;
  if (accessToken || refreshToken) {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || '';
      const apiUrl = baseUrl ? `${baseUrl}/api/auth/me` : '/api/auth/me';
      // Construye el header Cookie manualmente
      const cookieHeader = [
        accessToken ? `sb-access-token=${accessToken}` : '',
        refreshToken ? `sb-refresh-token=${refreshToken}` : ''
      ].filter(Boolean).join('; ');
      const res = await fetch(apiUrl, { headers: { Cookie: cookieHeader }, cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json?.user && !json.user.username) {
          redirect('/auth/google-username');
        }
      }
    } catch {}
  }

  return <PublicShell navItems={navItems}>{children}</PublicShell>;
}