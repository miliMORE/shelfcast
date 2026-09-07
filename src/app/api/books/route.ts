import { NextResponse } from "next/server";
import path from "path";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { bookUploadPath, writeFileSafe } from "@/lib/storage";
import { processAudioJob } from "@/lib/pipeline/process";
import { bookLimitForPlan } from "@/lib/billing/plans";
import { effectivePlan, getUsageSnapshot } from "@/lib/billing/usage";
import { getTtsProviderForPlan } from "@/lib/tts";

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
  const sessionUser = await requireUser();
  if (!sessionUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const usage = await getUsageSnapshot(sessionUser.id);
    if (!usage) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const plan = effectivePlan(usage);
    const limit = bookLimitForPlan(plan);
    const bookCount = await prisma.book.count({ where: { userId: sessionUser.id } });
    if (bookCount >= limit) {
      const msg =
        plan === "FREE"
          ? `Free plan allows ${limit} books in your library. Upgrade to Pro for up to 100.`
          : `Pro soft cap of ${limit} books reached. Delete a book or contact support.`;
      return NextResponse.json({ error: msg }, { status: 403 });
    }

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

    const provider = getTtsProviderForPlan(usage.plan, usage.planStatus);

    const book = await prisma.book.create({
      data: {
        userId: sessionUser.id,
        title: path.basename(name, path.extname(name)),
        format,
        originalFilename: name,
        storagePath: "pending",
      },
    });

    const safeName = name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const dest = bookUploadPath(sessionUser.id, book.id, safeName);
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
        ttsProvider: provider.name,
      },
    });

    processAudioJob(job.id).catch((err) => console.error("Job failed", job.id, err));

    return NextResponse.json({ book, job }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}