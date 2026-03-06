-- Habilita lectura publica (anon) para categorias y juegos publicados.
-- Ejecuta en el SQL editor de Supabase.

alter table if exists public.categories enable row level security;
drop policy if exists "public read categories" on public.categories;
create policy "public read categories"
  on public.categories
  for select
  using (is_active = true);

alter table if exists public.games enable row level security;
drop policy if exists "public read published games" on public.games;
create policy "public read published games"
  on public.games
  for select
  using (status = 'published');

alter table if exists public.game_categories enable row level security;
drop policy if exists "public read game_categories for published games" on public.game_categories;
create policy "public read game_categories for published games"
  on public.game_categories
  for select
  using (
    exists (
      select 1
      from public.games g
      where g.id = public.game_categories.game_id
        and g.status = 'published'
    )
  );
