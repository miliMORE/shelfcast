import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;

  const book = await prisma.book.findFirst({
    where: { id, userId: user.id },
    include: { assets: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!book) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const asset = book.assets[0];
  if (!asset) return NextResponse.json({ error: "No audio yet" }, { status: 404 });

  const data = await fs.readFile(asset.storagePath);
  const ext = asset.format || "wav";
  const mime = ext === "mp3" ? "audio/mpeg" : "audio/wav";
  const filename = (book.title || "audiobook").replace(/[^a-zA-Z0-9._-]/g, "_") + "." + ext;

  return new NextResponse(data, {
    headers: {
      "Content-Type": mime,
      "Content-Disposition": 'attachment; filename="' + filename + '"',
      "Content-Length": String(data.length),
    },
  });
}
