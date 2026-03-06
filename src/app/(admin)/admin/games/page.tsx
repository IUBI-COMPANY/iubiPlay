import Link from 'next/link';
import { GamesTable } from '../../../../components/admin/games_table';

export default function AdminGamesPage() {
  return (
    <main className="space-y-6 p-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Juegos</h2>
          <p className="text-sm text-gray-600">Gestiona y publica juegos.</p>
        </div>
        <Link className="btn-primary" href="/admin/games/new">
          Nuevo juego
        </Link>
      </header>
      <GamesTable />
    </main>
  );
}
