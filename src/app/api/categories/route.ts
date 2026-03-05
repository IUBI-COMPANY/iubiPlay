import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { CategoryType } from "@/src/types/category";
import { createCategory, listCategories } from "@/src/lib/db/categories";

interface CreateCategoryBody {
  name: string;
  slug: string;
  type: CategoryType;
  description?: string;
  is_active?: boolean;
  sort_order?: number;
}

function parseCreateBody(data: unknown): CreateCategoryBody | null {
  if (!data || typeof data !== "object") return null;
  const record = data as Record<string, unknown>;

  if (
    typeof record.name !== "string" ||
    typeof record.slug !== "string" ||
    typeof record.type !== "string"
  ) {
    return null;
  }

  const type = record.type as CategoryType;
  if (!["level", "course"].includes(type)) return null;

  return {
    name: record.name.trim(),
    slug: record.slug.trim(),
    type,
    description:
      typeof record.description === "string"
        ? record.description.trim()
        : undefined,
    is_active:
      typeof record.is_active === "boolean"
        ? record.is_active
        : undefined,
    sort_order:
      typeof record.sort_order === "number"
        ? record.sort_order
        : undefined,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") as CategoryType | null;
  const search = searchParams.get("search") ?? undefined;
  const limit = Math.min(
    Number(searchParams.get("limit") ?? 50),
    100
  );
  const offset = Math.max(
    Number(searchParams.get("offset") ?? 0),
    0
  );
  const is_active = searchParams.get("is_active");

  const result = await listCategories({
    type: type ?? undefined,
    search,
    limit: Number.isFinite(limit) ? limit : 50,
    offset: Number.isFinite(offset) ? offset : 0,
    is_active: is_active === null ? undefined : is_active === "true",
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const body = parseCreateBody(await req.json().catch(() => null));
  if (!body) {
    return NextResponse.json(
      { ok: false, message: "Body invalido" },
      { status: 400 }
    );
  }

  if (!body.name || !body.slug) {
    return NextResponse.json(
      { ok: false, message: "Nombre y slug son requeridos" },
      { status: 400 }
    );
  }

  const created = await createCategory({
    name: body.name,
    slug: body.slug,
    type: body.type,
    description: body.description,
    is_active: body.is_active ?? true,
    sort_order: body.sort_order,
  });

  return NextResponse.json({ ok: true, item: created }, { status: 201 });
}
