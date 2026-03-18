import { NextRequest, NextResponse } from "next/server";
import { deleteUserClass, updateUserClass } from "@/src/lib/db/classes";
import { getUserIdFromRequest } from "@/src/lib/supabase/auth";
import { setAuthCookies } from "@/src/lib/auth/cookies";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await getUserIdFromRequest(req);
  if (!auth.userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: "Missing class id" }, { status: 400 });

  const body = await req.json();
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const description = typeof body?.description === "string" ? body.description : undefined;
  if (!name) return NextResponse.json({ error: "Missing name" }, { status: 400 });

  try {
    const updated = await updateUserClass(auth.userId, id, name, description);
    const res = NextResponse.json(updated);
    if (auth.refreshedSession) setAuthCookies(res, auth.refreshedSession);
    return res;
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await getUserIdFromRequest(req);
  if (!auth.userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: "Missing class id" }, { status: 400 });

  try {
    const deleted = await deleteUserClass(auth.userId, id);
    const res = NextResponse.json({ ok: deleted });
    if (auth.refreshedSession) setAuthCookies(res, auth.refreshedSession);
    return res;
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
