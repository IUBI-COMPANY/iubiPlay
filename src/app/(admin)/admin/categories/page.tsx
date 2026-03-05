import Link from 'next/link';
import { CategoriesTable } from '@/src/components/admin/categories_table';

export default function AdminCategoriesPage() {
  return (
    <main className="space-y-6 p-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Categorias</h2>
          <p className="text-sm text-gray-600">Gestiona niveles y cursos.</p>
        </div>
        <Link className="btn-primary" href="/admin/categories/new">
          Nueva categoria
        </Link>
      </header>
      <CategoriesTable />
    </main>
  );
}
