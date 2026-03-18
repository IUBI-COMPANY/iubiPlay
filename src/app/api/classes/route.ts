import { NextRequest, NextResponse } from 'next/server';
import { listClassGameCounts, listUserClassesPaged, createUserClass } from '@/src/lib/db/classes';
import { getUserIdFromRequest } from '@/src/lib/supabase/auth';
import { setAuthCookies } from '@/src/lib/auth/cookies';

export async function GET(req: NextRequest) {
  const auth = await getUserIdFromRequest(req);
  if (!auth.userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  try {
    const url = new URL(req.url);
    const pageParam = Number(url.searchParams.get('page') ?? '1');
    const limitParam = Number(url.searchParams.get('limit') ?? '9');
    const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 9;
    const offset = (page - 1) * limit;

    const { items: classes, total } = await listUserClassesPaged(auth.userId, limit, offset);
    const counts = await listClassGameCounts(classes.map((c) => c.id));
    const items = classes.map((c) => ({ ...c, gameCount: counts[c.id] ?? 0 }));
    const res = NextResponse.json({ items, total, page, limit });
    if (auth.refreshedSession) setAuthCookies(res, auth.refreshedSession);
    return res;
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    if (process.env.NODE_ENV !== 'production') {
      console.error('[api/classes][GET] userId:', auth.userId, message, e);
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await getUserIdFromRequest(req);
  if (!auth.userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  const { name, description } = await req.json();
  if (!name) return NextResponse.json({ error: 'Missing name' }, { status: 400 });
  try {
    const newClass = await createUserClass(auth.userId, name, description);
    const res = NextResponse.json({ ...newClass, gameCount: 0 });
    if (auth.refreshedSession) setAuthCookies(res, auth.refreshedSession);
    return res;
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    if (process.env.NODE_ENV !== 'production') {
      console.error('[api/classes][POST] userId:', auth.userId, message, e);
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
