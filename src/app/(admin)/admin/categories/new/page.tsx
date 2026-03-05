import { CategoryForm } from '@/src/components/admin/category_form';

export default function NewCategoryPage() {
  return (
    <main className="space-y-6 p-6">
      <header>
        <h2 className="text-2xl font-semibold">Crear categoria</h2>
        <p className="text-sm text-gray-600">Completa los datos de la nueva categoria.</p>
      </header>
      <CategoryForm mode="create" />
    </main>
  );
}
