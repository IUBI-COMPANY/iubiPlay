import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { CategoryType } from '@/src/types/category';
import { deleteCategory, getCategoryById, updateCategory } from '@/src/lib/db/categories';

type Ctx = { params: Promise<{ id: string }> };

interface PatchBody {
  name?: string;
  slug?: string;
  type?: CategoryType;
  description?: string;
  is_active?: boolean;
  sort_order?: number;
}

function parsePatchBody(data: unknown): PatchBody | null {
  if (!data || typeof data !== 'object') return null;
  const record = data as Record<string, unknown>;
  const body: PatchBody = {};

  if (typeof record.name === 'string') body.name = record.name.trim();
  if (typeof record.slug === 'string') body.slug = record.slug.trim();

  if (typeof record.type === 'string') {
    const type = record.type as CategoryType;
    if (['level', 'course'].includes(type)) body.type = type;
  }

  if (typeof record.description === 'string') body.description = record.description.trim();
  if (record.description === null) body.description = undefined;

  if (typeof record.is_active === 'boolean') body.is_active = record.is_active;

  if (typeof record.sort_order === 'number') body.sort_order = record.sort_order;
  if (record.sort_order === null) body.sort_order = undefined;

  return body;
}

export async function GET(_: NextRequest, { params }: Ctx) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ ok: false, message: 'ID invalido' }, { status: 400 });
  }

  const category = await getCategoryById(id);
  if (!category) {
    return NextResponse.json({ ok: false, message: 'No encontrado' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, item: category });
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ ok: false, message: 'ID invalido' }, { status: 400 });
  }

  const body = parsePatchBody(await req.json().catch(() => null));
  if (!body) {
    return NextResponse.json({ ok: false, message: 'Body invalido' }, { status: 400 });
  }

  try {
    const updated = await updateCategory(id, body);
    if (!updated) {
      return NextResponse.json({ ok: false, message: 'No encontrado' }, { status: 404 });
    }
    return NextResponse.json({ ok: true, item: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error interno';
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: Ctx) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ ok: false, message: 'ID invalido' }, { status: 400 });
  }

  try {
    const deleted = await deleteCategory(id);
    if (!deleted) {
      return NextResponse.json({ ok: false, message: 'No encontrado' }, { status: 404 });
    }
    return NextResponse.json({ ok: true, deleted: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error interno';
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
