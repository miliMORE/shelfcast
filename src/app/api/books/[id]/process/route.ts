import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getUsageSnapshot } from "@/lib/billing/usage";
import { getTtsProviderForPlan, ProTtsMisconfiguredError } from "@/lib/tts";

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;

  const book = await prisma.book.findFirst({ where: { id, userId: user.id } });
  if (!book) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const usage = await getUsageSnapshot(user.id);
  let ttsProviderName = "mock";
  try {
    ttsProviderName = getTtsProviderForPlan(usage?.plan, usage?.planStatus).name;
  } catch (err) {
    if (err instanceof ProTtsMisconfiguredError) ttsProviderName = "openai";
  }

  const job = await prisma.audioJob.create({
    data: { bookId: book.id, status: "QUEUED", ttsProvider: ttsProviderName },
  });

  return NextResponse.json({ job });
}
