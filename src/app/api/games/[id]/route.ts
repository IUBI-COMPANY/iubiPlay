import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { GameStatus } from "@/src/types/game";
import { deleteGame, getGameById, updateGame } from "@/src/lib/db/games";

type Ctx = { params: Promise<{ id: string }> };

interface PatchBody {
  status?: GameStatus;
  title?: string;
}

function parsePatchBody(data: unknown): PatchBody | null {
  if (!data || typeof data !== "object") return null;
  const record = data as Record<string, unknown>;
  const body: PatchBody = {};

  if (typeof record.status === "string")
    body.status = record.status as GameStatus;
  if (typeof record.title === "string") body.title = record.title.trim();

  return body;
}

export async function GET(_: NextRequest, { params }: Ctx) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { ok: false, message: "ID inválido" },
      { status: 400 }
    );
  }
  const game = await getGameById(id);
  if (!game) {
    return NextResponse.json(
      { ok: false, message: "No encontrado" },
      { status: 404 }
    );
  }
  return NextResponse.json({ ok: true, item: game });
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { ok: false, message: "ID inválido" },
      { status: 400 }
    );
  }
  const body = parsePatchBody(await req.json().catch(() => null));
  if (!body) {
    return NextResponse.json(
      { ok: false, message: "Body inválido" },
      { status: 400 }
    );
  }

  if (body.status && !["draft", "published", "archived"].includes(body.status)) {
    return NextResponse.json(
      { ok: false, message: "Status inválido" },
      { status: 400 }
    );
  }

  try {
    const updated = await updateGame(id, body);
    if (!updated) {
      return NextResponse.json(
        { ok: false, message: "No encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, item: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json(
      { ok: false, message },
      { status: 500 }
    );
  }
}

export async function DELETE(_: NextRequest, { params }: Ctx) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { ok: false, message: "ID inválido" },
      { status: 400 }
    );
  }
  try {
    const deleted = await deleteGame(id);
    if (!deleted) {
      return NextResponse.json(
        { ok: false, message: "No encontrado" },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true, deleted: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json(
      { ok: false, message },
      { status: 500 }
    );
  }
}
