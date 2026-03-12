import Link from 'next/link';
import { GamesTable } from '@/src/components/admin/games_table';

export default function AdminGamesPage() {
  return (
    <main className="space-y-6 p-6 bg-slate-900">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Juegos</h2>
          <p className="text-sm text-slate-300">Gestiona y publica juegos.</p>
        </div>
        <Link className="btn-primary" href="/admin/games/new">
          Nuevo juego
        </Link>
      </header>
      <GamesTable />
    </main>
  );
}
