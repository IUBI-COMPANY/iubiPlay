import { NextResponse } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Ctx) {
  const { id } = await params;
  return NextResponse.json({ id });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  return NextResponse.json({ updated: true, id, body });
}

export async function DELETE(_: Request, { params }: Ctx) {
  const { id } = await params;
  return NextResponse.json({ deleted: true, id });
}
