import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Game, GameStatus } from '@/src/types/game';
import type { CategorySelections } from '@/src/types/category';
import { createGame, listGames } from '@/src/lib/db/games';
import { getCategoriesByGameIds, setGameCategories, validateCategorySelections } from '@/src/lib/db/categories';

function parseStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.filter((item) => typeof item === 'string').map((item) => item.trim()).filter(Boolean);
}

interface CreateGameBody {
  title: string;
  slug: string;
  redirect_url: string;
  cover_image_url: string;
  platform: Game['platform'];
  status?: GameStatus;
  levels?: string[];
  courses?: string[];
}

function parseCreateBody(data: unknown): CreateGameBody | null {
  if (!data || typeof data !== 'object') return null;
  const record = data as Record<string, unknown>;

  if (
    typeof record.title !== 'string' ||
    typeof record.slug !== 'string' ||
    typeof record.redirect_url !== 'string' ||
    typeof record.cover_image_url !== 'string' ||
    typeof record.platform !== 'string'
  ) {
    return null;
  }

  return {
    title: record.title.trim(),
    slug: record.slug.trim(),
    redirect_url: record.redirect_url.trim(),
    cover_image_url: record.cover_image_url.trim(),
    platform: record.platform as Game['platform'],
    status: (record.status as GameStatus | undefined) ?? 'draft',
    levels: parseStringArray(record.levels),
    courses: parseStringArray(record.courses),
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') as GameStatus | null;
  const search = searchParams.get('search') ?? undefined;
  const categoryId = searchParams.get('category_id') ?? undefined;
  const limit = Math.min(Number(searchParams.get('limit') ?? 20), 50);
  const offset = Math.max(Number(searchParams.get('offset') ?? 0), 0);

  const result = await listGames({
    status: status ?? undefined,
    search,
    limit: Number.isFinite(limit) ? limit : 20,
    offset: Number.isFinite(offset) ? offset : 0,
    categoryId,
  });

  const categoriesByGameId = await getCategoriesByGameIds(result.items.map((item) => item.id));

  return NextResponse.json({ ...result, categoriesByGameId });
}

export async function POST(req: NextRequest) {
  const body = parseCreateBody(await req.json().catch(() => null));
  if (!body) {
    return NextResponse.json({ ok: false, message: 'Body inválido' }, { status: 400 });
  }

  if (!body.title || !body.slug) {
    return NextResponse.json({ ok: false, message: 'Título y slug son requeridos' }, { status: 400 });
  }

  if (!body.levels?.length || !body.courses?.length) {
    return NextResponse.json(
      { ok: false, message: 'Selecciona al menos un nivel y un curso' },
      { status: 400 }
    );
  }

  let selections: CategorySelections;
  try {
    selections = await validateCategorySelections(
      { levels: body.levels ?? [], courses: body.courses ?? [] },
      { requireLevels: true, requireCourses: true, requireActive: true }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Categorias invalidas';
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }

  const created = await createGame({
    title: body.title,
    slug: body.slug,
    redirect_url: body.redirect_url,
    cover_image_url: body.cover_image_url,
    platform: body.platform,
    status: body.status ?? 'draft',
  });

  await setGameCategories(created.id, selections);

  return NextResponse.json({ ok: true, item: created }, { status: 201 });
}
