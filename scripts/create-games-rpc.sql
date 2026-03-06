-- RPCs para busqueda y conteo de juegos con filtros.
-- Ejecuta en el SQL editor de Supabase.

create or replace function public.search_games(
  p_status text default null,
  p_search text default null,
  p_limit int default 20,
  p_offset int default 0,
  p_category_ids uuid[] default null
)
returns setof public.games
language sql
stable
as $$
  select g.*
  from public.games g
  where (p_status is null or g.status = p_status::game_status)
    and (p_search is null or g.title ilike '%' || p_search || '%' or g.slug ilike '%' || p_search || '%')
    and (
      p_category_ids is null
      or exists (
        select 1
        from public.game_categories gc
        where gc.game_id = g.id
          and gc.category_id = any(p_category_ids)
      )
    )
  order by g.updated_at desc
  limit p_limit
  offset p_offset;
$$;

create or replace function public.count_games(
  p_status text default null,
  p_search text default null,
  p_category_ids uuid[] default null
)
returns bigint
language sql
stable
as $$
  select count(*)
  from public.games g
  where (p_status is null or g.status = p_status::game_status)
    and (p_search is null or g.title ilike '%' || p_search || '%' or g.slug ilike '%' || p_search || '%')
    and (
      p_category_ids is null
      or exists (
        select 1
        from public.game_categories gc
        where gc.game_id = g.id
          and gc.category_id = any(p_category_ids)
      )
    );
$$;
