import type { ReactNode } from 'react';
import { PublicShell } from '@/src/components/public/public_shell';
import { getPublicNavItems } from '@/src/lib/nav/public_nav';

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const navItems = await getPublicNavItems();
  return <PublicShell navItems={navItems}>{children}</PublicShell>;
}