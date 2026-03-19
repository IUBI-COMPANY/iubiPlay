import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Game, GameStatus } from '@/src/types/game';
import type { CategorySelections } from '@/src/types/category';
import { createGame, listGames } from '@/src/lib/db/games';
import { getCategoriesByGameIds, setGameCategories, validateCategorySelections } from '@/src/lib/db/categories';
import { getUserIdFromRequest, getWriteClientFromRequest } from '@/src/lib/supabase/auth';
import { setAuthCookies } from '@/src/lib/auth/cookies';
import { createClient, type Session } from '@supabase/supabase-js';

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

async function getUserRole(req: NextRequest): Promise<{ userId: string | null; role: string; refreshedSession?: Session }> {
  const auth = await getUserIdFromRequest(req);
  if (!auth.userId) return { userId: null, role: 'anonymous' };

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { userId: auth.userId, role: 'user', refreshedSession: auth.refreshedSession };
  }

  const accessToken =
    req.cookies.get('sb-access-token')?.value ?? auth.refreshedSession?.access_token;

  if (!accessToken) {
    return { userId: auth.userId, role: 'user', refreshedSession: auth.refreshedSession };
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', auth.userId)
    .maybeSingle();

  return { userId: auth.userId, role: profile?.role ?? 'user', refreshedSession: auth.refreshedSession };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const requestedStatus = searchParams.get('status') as GameStatus | null;
  const search = searchParams.get('search') ?? undefined;
  const categoryId = searchParams.get('category_id') ?? undefined;
  const limit = Math.min(Number(searchParams.get('limit') ?? 20), 50);
  const offset = Math.max(Number(searchParams.get('offset') ?? 0), 0);

  const { role, refreshedSession } = await getUserRole(req);
  const status =
    requestedStatus && requestedStatus !== 'published' && role !== 'admin'
      ? 'published'
      : requestedStatus ?? undefined;

  const result = await listGames({
    status: status ?? undefined,
    search,
    limit: Number.isFinite(limit) ? limit : 20,
    offset: Number.isFinite(offset) ? offset : 0,
    categoryId,
  });

  const categoriesByGameId = await getCategoriesByGameIds(result.items.map((item) => item.id));

  const res = NextResponse.json({ ...result, categoriesByGameId });
  if (refreshedSession) {
    setAuthCookies(res, refreshedSession);
  }
  return res;
}

export async function POST(req: NextRequest) {
  const auth = await getWriteClientFromRequest(req);
  if (!auth.client) {
    return NextResponse.json({ ok: false, message: auth.error ?? 'No autenticado' }, { status: 401 });
  }

  const authUser = await getUserIdFromRequest(req);

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
    const authedClient = auth.client;

    selections = await validateCategorySelections(
      { levels: body.levels ?? [], courses: body.courses ?? [] },
      { requireLevels: true, requireCourses: true, requireActive: true },
      authedClient
    );

    const created = await createGame(
      {
        title: body.title,
        slug: body.slug,
        redirect_url: body.redirect_url,
        cover_image_url: body.cover_image_url,
        platform: body.platform,
        status: body.status ?? 'draft',
        created_by: authUser.userId ?? undefined,
      },
      authedClient
    );

    await setGameCategories(created.id, selections, authedClient);

    const res = NextResponse.json({ ok: true, item: created }, { status: 201 });
    if (auth.refreshedSession) {
      setAuthCookies(res, auth.refreshedSession);
    }
    return res;
  } catch (err: unknown) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[api/games] create error', err);
    }
    const message = err instanceof Error ? err.message : 'No se pudo guardar el juego';
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
