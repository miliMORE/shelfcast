import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { processAudioJob } from "@/lib/pipeline/process";

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;

  const book = await prisma.book.findFirst({ where: { id, userId: user.id } });
  if (!book) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const job = await prisma.audioJob.create({
    data: {
      bookId: book.id,
      status: "PENDING",
      ttsProvider: process.env.TTS_PROVIDER || "mock",
    },
  });

  // Run inline for local MVP reliability
  try {
    await processAudioJob(job.id);
  } catch (e) {
    console.error(e);
  }

  const updated = await prisma.audioJob.findUnique({ where: { id: job.id } });
  return NextResponse.json({ job: updated });
}
