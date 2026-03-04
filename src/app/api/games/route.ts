import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ items: [] });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  return NextResponse.json({ created: true, body }, { status: 201 });
}
