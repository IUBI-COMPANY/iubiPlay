import PublicHomePage from './(public)/page';
import { PublicShell } from '@/src/components/public/public_shell';
import { getPublicNavItems } from '@/src/lib/nav/public_nav';

export default async function HomePage() {
  const navItems = await getPublicNavItems();
  return (
    <PublicShell navItems={navItems}>
      <PublicHomePage />
    </PublicShell>
  );
}
