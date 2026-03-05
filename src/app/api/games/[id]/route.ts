import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { GameStatus } from "@/src/types/game";
import { deleteGame, getGameById, updateGame } from "@/src/lib/db/games";
import type { CategorySelections } from "@/src/types/category";
import { setGameCategories } from "@/src/lib/db/categories";
import { validateCategorySelections } from "@/src/lib/db/categories";

type Ctx = { params: Promise<{ id: string }> };

interface PatchBody {
  status?: GameStatus;
  title?: string;
  levels?: string[];
  courses?: string[];
}

function parseStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value
    .filter((item) => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parsePatchBody(data: unknown): PatchBody | null {
  if (!data || typeof data !== "object") return null;
  const record = data as Record<string, unknown>;
  const body: PatchBody = {};

  if (typeof record.status === "string")
    body.status = record.status as GameStatus;
  if (typeof record.title === "string") body.title = record.title.trim();

  const levels = parseStringArray(record.levels);
  const courses = parseStringArray(record.courses);
  if (levels) body.levels = levels;
  if (courses) body.courses = courses;

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

  if ((body.levels && !body.courses) || (!body.levels && body.courses)) {
    return NextResponse.json(
      { ok: false, message: "Envia niveles y cursos juntos" },
      { status: 400 }
    );
  }

  if (
    (body.levels && body.levels.length === 0) ||
    (body.courses && body.courses.length === 0)
  ) {
    return NextResponse.json(
      { ok: false, message: "Selecciona al menos un nivel y un curso" },
      { status: 400 }
    );
  }

  let selections: CategorySelections | undefined;
  if (body.levels && body.courses) {
    try {
      selections = await validateCategorySelections(
        { levels: body.levels, courses: body.courses },
        { requireLevels: true, requireCourses: true, requireActive: true }
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Categorias invalidas";
      return NextResponse.json({ ok: false, message }, { status: 400 });
    }
  }

  try {
    const gamePatch = {
      status: body.status,
      title: body.title,
    };
    const updated = await updateGame(id, gamePatch);
    if (!updated) {
      return NextResponse.json(
        { ok: false, message: "No encontrado" },
        { status: 404 }
      );
    }

    if (selections) {
      await setGameCategories(id, selections);
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
