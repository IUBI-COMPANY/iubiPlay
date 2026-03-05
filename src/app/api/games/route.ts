import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Game, GameStatus } from '@/src/types/game';
import { createGame, listGames } from '@/src/lib/db/games';

interface CreateGameBody {
  title: string;
  slug: string;
  redirect_url: string;
  cover_image_url: string;
  platform: Game['platform'];
  status?: GameStatus;
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
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') as GameStatus | null;
  const search = searchParams.get('search') ?? undefined;
  const limit = Math.min(Number(searchParams.get('limit') ?? 20), 50);
  const offset = Math.max(Number(searchParams.get('offset') ?? 0), 0);

  const result = await listGames({
    status: status ?? undefined,
    search,
    limit: Number.isFinite(limit) ? limit : 20,
    offset: Number.isFinite(offset) ? offset : 0,
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const body = parseCreateBody(await req.json().catch(() => null));
  if (!body) {
    return NextResponse.json({ ok: false, message: 'Body inválido' }, { status: 400 });
  }

  if (!body.title || !body.slug) {
    return NextResponse.json({ ok: false, message: 'Título y slug son requeridos' }, { status: 400 });
  }

  const created = await createGame({
    title: body.title,
    slug: body.slug,
    redirect_url: body.redirect_url,
    cover_image_url: body.cover_image_url,
    platform: body.platform,
    status: body.status ?? 'draft',
  });

  return NextResponse.json({ ok: true, item: created }, { status: 201 });
}
