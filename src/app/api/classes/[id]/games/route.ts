import { NextRequest, NextResponse } from "next/server";
import { getUserClassById, listGamesInClass } from "@/src/lib/db/classes";
import { getGameById } from "@/src/lib/db/games";
import { getUserIdFromRequest } from "@/src/lib/supabase/auth";
import { setAuthCookies } from "@/src/lib/auth/cookies";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await getUserIdFromRequest(req);
  if (!auth.userId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  const { id: classId } = await context.params;
  if (!classId) {
    return NextResponse.json({ error: "Missing class id" }, { status: 400 });
  }
  try {
    const owned = await getUserClassById(auth.userId, classId);
    if (!owned) return NextResponse.json({ error: "Clase no encontrada" }, { status: 404 });
    const links = await listGamesInClass(classId);
    const gameIds = links.map((item) => item.game_id).filter(Boolean);
    if (gameIds.length === 0) {
      const res = NextResponse.json({ items: [] });
      if (auth.refreshedSession) setAuthCookies(res, auth.refreshedSession);
      return res;
    }
    const games = await Promise.all(gameIds.map((id) => getGameById(id)));
    const res = NextResponse.json({ items: games.filter(Boolean) });
    if (auth.refreshedSession) setAuthCookies(res, auth.refreshedSession);
    return res;
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
