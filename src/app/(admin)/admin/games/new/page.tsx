import { GameForm } from '../../../../../components/admin/game_form';

export default function NewGamePage() {
  return (
    <main className="space-y-6 p-6">
      <header>
        <h2 className="text-2xl font-semibold">Crear juego</h2>
        <p className="text-sm text-gray-600">Completa los datos básicos para el nuevo juego.</p>
      </header>
      <GameForm mode="create" />
    </main>
  );
}
