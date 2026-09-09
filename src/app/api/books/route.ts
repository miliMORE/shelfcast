import { NextResponse } from "next/server";
import path from "path";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getStorage, bookObjectKey } from "@/lib/storage";
import { bookLimitForPlan } from "@/lib/billing/plans";
import { effectivePlan, getUsageSnapshot } from "@/lib/billing/usage";
import { getTtsProviderForPlan, ProTtsMisconfiguredError } from "@/lib/tts";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

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

  const ip = clientIp(req);
  const rl = rateLimit(`upload:${sessionUser.id}:${ip}`, 10, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many uploads. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  try {
    const contentLength = req.headers.get("content-length");
    if (contentLength && Number(contentLength) > MAX_UPLOAD_BYTES + 64_000) {
      return NextResponse.json(
        { error: "File too large. Maximum upload size is 20MB." },
        { status: 413 }
      );
    }

    const usage = await getUsageSnapshot(sessionUser.id);
    if (!usage) return NextResponse.json({ error: "User not found" }, { status: 404 });

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

    if (typeof file.size === "number" && file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: "File too large. Maximum upload size is 20MB." },
        { status: 413 }
      );
    }

    const name = file.name || "upload";
    const lower = name.toLowerCase();
    let format: "EPUB" | "PDF" | null = null;
    if (lower.endsWith(".epub")) format = "EPUB";
    else if (lower.endsWith(".pdf")) format = "PDF";
    if (!format) {
      return NextResponse.json({ error: "Only EPUB and PDF are supported" }, { status: 400 });
    }

    let ttsProviderName = "mock";
    try {
      ttsProviderName = getTtsProviderForPlan(usage.plan, usage.planStatus).name;
    } catch (err) {
      if (err instanceof ProTtsMisconfiguredError) ttsProviderName = "openai";
    }

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
    const key = bookObjectKey(sessionUser.id, book.id, safeName);
    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.length > MAX_UPLOAD_BYTES) {
      await prisma.book.delete({ where: { id: book.id } });
      return NextResponse.json(
        { error: "File too large. Maximum upload size is 20MB." },
        { status: 413 }
      );
    }

    const contentType = format === "PDF" ? "application/pdf" : "application/epub+zip";
    await getStorage().put(key, buffer, contentType);
    await prisma.book.update({ where: { id: book.id }, data: { storagePath: key } });

    const job = await prisma.audioJob.create({
      data: { bookId: book.id, status: "QUEUED", ttsProvider: ttsProviderName },
    });

    return NextResponse.json({ book, job }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
