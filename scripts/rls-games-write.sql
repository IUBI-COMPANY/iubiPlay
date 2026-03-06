-- Habilitar RLS si no esta activo
alter table public.games enable row level security;
alter table public.game_categories enable row level security;

-- Politicas de escritura para usuarios autenticados (admin panel)
drop policy if exists "games insert authenticated" on public.games;
create policy "games insert authenticated"
  on public.games
  for insert
  to authenticated
  with check (auth.uid() is not null);

drop policy if exists "games update authenticated" on public.games;
create policy "games update authenticated"
  on public.games
  for update
  to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

drop policy if exists "games delete authenticated" on public.games;
create policy "games delete authenticated"
  on public.games
  for delete
  to authenticated
  using (auth.uid() is not null);

-- Opcional (solo desarrollo): permitir inserts anon para pruebas locales
-- drop policy if exists "games insert anon dev" on public.games;
-- create policy "games insert anon dev"
--   on public.games
--   for insert
--   to anon
--   with check (true);

drop policy if exists "game_categories insert authenticated" on public.game_categories;
create policy "game_categories insert authenticated"
  on public.game_categories
  for insert
  to authenticated
  with check (auth.uid() is not null);

drop policy if exists "game_categories delete authenticated" on public.game_categories;
create policy "game_categories delete authenticated"
  on public.game_categories
  for delete
  to authenticated
  using (auth.uid() is not null);
