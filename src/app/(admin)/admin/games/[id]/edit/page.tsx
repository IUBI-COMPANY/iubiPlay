import { GameForm } from '@/src/components/admin/game_form';
import { getGameById } from '@/src/lib/db/games';
import { getGameCategorySelections } from '@/src/lib/db/categories';

type Props = { params: Promise<{ id: string }> };

export default async function EditGamePage({ params }: Props) {
  const { id } = await params;
  const [game, selections] = await Promise.all([
    getGameById(id),
    getGameCategorySelections(id),
  ]);

  if (!game) {
    return (
      <main className="space-y-4 p-6">
        <h2 className="text-2xl font-semibold">Editar juego</h2>
        <p className="text-sm text-red-600">Juego no encontrado.</p>
      </main>
    );
  }

  return (
    <main className="space-y-6 p-6">
      <header>
        <h2 className="text-2xl font-semibold">Editar juego</h2>
        <p className="text-sm text-gray-600">Actualiza los datos del juego.</p>
      </header>
      <GameForm mode="edit" gameId={game.id} initialData={game} initialSelections={selections} />
    </main>
  );
}
