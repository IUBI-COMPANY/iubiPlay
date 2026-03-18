import { NextRequest, NextResponse } from 'next/server';
import { addGameToClass, getUserClassById } from '@/src/lib/db/classes';
import { getUserIdFromRequest } from '@/src/lib/supabase/auth';
import { setAuthCookies } from '@/src/lib/auth/cookies';

export async function POST(req: NextRequest) {
  const auth = await getUserIdFromRequest(req);
  if (!auth.userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  const { classId, gameId } = await req.json();
  if (!classId || !gameId) return NextResponse.json({ error: 'Missing classId or gameId' }, { status: 400 });
  try {
    const owned = await getUserClassById(auth.userId, classId);
    if (!owned) return NextResponse.json({ error: 'Clase no encontrada' }, { status: 404 });
    const result = await addGameToClass(classId, gameId);
    const res = NextResponse.json(result);
    if (auth.refreshedSession) setAuthCookies(res, auth.refreshedSession);
    return res;
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
