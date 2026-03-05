import { listCategories } from '@/src/lib/db/categories';

export type PublicNavItem = { label: string; href: string };

const BASE_ITEMS: PublicNavItem[] = [
  { label: 'Principal', href: '/' },
  { label: 'Super herramientas', href: '/games' },
];

export async function getPublicNavItems(): Promise<PublicNavItem[]> {
  const { items: categories } = await listCategories({
    type: 'course',
    is_active: true,
    limit: 12,
  });

  const categoryItems = categories.map((category) => ({
    label: category.name,
    href: `/categories/${category.slug}`,
  }));

  return [BASE_ITEMS[0], ...categoryItems, BASE_ITEMS[1]];
}
