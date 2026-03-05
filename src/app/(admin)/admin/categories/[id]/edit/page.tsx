import { CategoryForm } from '@/src/components/admin/category_form';
import { getCategoryById } from '@/src/lib/db/categories';

type Props = { params: Promise<{ id: string }> };

export default async function EditCategoryPage({ params }: Props) {
  const { id } = await params;
  const category = await getCategoryById(id);

  if (!category) {
    return (
      <main className="space-y-4 p-6">
        <h2 className="text-2xl font-semibold">Editar categoria</h2>
        <p className="text-sm text-red-600">Categoria no encontrada.</p>
      </main>
    );
  }

  return (
    <main className="space-y-6 p-6">
      <header>
        <h2 className="text-2xl font-semibold">Editar categoria</h2>
        <p className="text-sm text-gray-600">Actualiza los datos de la categoria.</p>
      </header>
      <CategoryForm mode="edit" categoryId={category.id} initialData={category} />
    </main>
  );
}
