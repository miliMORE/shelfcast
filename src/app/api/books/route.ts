import { NextResponse } from "next/server";
import path from "path";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { bookUploadPath, writeFileSafe } from "@/lib/storage";
import { processAudioJob } from "@/lib/pipeline/process";

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const books = await prisma.book.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      jobs: { orderBy: { createdAt: "desc" }, take: 1 },
      assets: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  return NextResponse.json({ books });
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "File required" }, { status: 400 });
    }

    const name = file.name || "upload";
    const lower = name.toLowerCase();
    let format: "EPUB" | "PDF" | null = null;
    if (lower.endsWith(".epub")) format = "EPUB";
    else if (lower.endsWith(".pdf")) format = "PDF";
    if (!format) {
      return NextResponse.json({ error: "Only EPUB and PDF are supported" }, { status: 400 });
    }

    // Create book row first for id
    const book = await prisma.book.create({
      data: {
        userId: user.id,
        title: path.basename(name, path.extname(name)),
        format,
        originalFilename: name,
        storagePath: "pending",
      },
    });

    const safeName = name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const dest = bookUploadPath(user.id, book.id, safeName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFileSafe(dest, buffer);

    await prisma.book.update({
      where: { id: book.id },
      data: { storagePath: dest },
    });

    const job = await prisma.audioJob.create({
      data: {
        bookId: book.id,
        status: "PENDING",
        ttsProvider: process.env.TTS_PROVIDER || "mock",
      },
    });

    // Fire and forget for UX; await briefly to start
    processAudioJob(job.id).catch((err) => console.error("Job failed", job.id, err));

    return NextResponse.json({ book, job }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
