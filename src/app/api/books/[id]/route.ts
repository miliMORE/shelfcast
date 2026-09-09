import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getStorage, bookPrefix } from "@/lib/storage";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;

  const book = await prisma.book.findFirst({
    where: { id, userId: user.id },
    include: {
      jobs: { orderBy: { createdAt: "desc" } },
      assets: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!book) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ book });
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;

  const book = await prisma.book.findFirst({ where: { id, userId: user.id } });
  if (!book) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    await getStorage().deletePrefix(bookPrefix(user.id, book.id));
  } catch (err) {
    console.error("storage cleanup failed", book.id, err);
  }

  await prisma.book.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
