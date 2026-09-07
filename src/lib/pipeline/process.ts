import { prisma } from "@/lib/prisma";
import { extractFromFile, chunkText } from "./extract";
import { getTtsProviderForPlan } from "@/lib/tts";
import { assembleAudio } from "./assemble";
import { audioPath, writeFileSafe } from "@/lib/storage";
import {
  assertCanConsumeChars,
  consumeTtsChars,
  effectivePlan,
  ensureUsageMonth,
} from "@/lib/billing/usage";
import { isProPlan } from "@/lib/billing/plans";

/**
 * Run conversion for a book/job. Designed to be awaited from an API route
 * for the local MVP (synchronous-ish). Production would use a queue worker.
 */
export async function processAudioJob(jobId: string) {
  const job = await prisma.audioJob.findUnique({
    where: { id: jobId },
    include: {
      book: {
        include: {
          user: {
            select: {
              id: true,
              plan: true,
              planStatus: true,
              ttsCharsUsedMonth: true,
              ttsCharsResetAt: true,
            },
          },
        },
      },
    },
  });
  if (!job) throw new Error("Job not found");

  const { book } = job;
  const billingUser = await ensureUsageMonth(book.user);
  const plan = effectivePlan(billingUser);
  const provider = getTtsProviderForPlan(billingUser.plan, billingUser.planStatus);

  try {
    await prisma.audioJob.update({
      where: { id: jobId },
      data: { status: "EXTRACTING", progress: 5, ttsProvider: provider.name },
    });

    const extracted = await extractFromFile(
      book.storagePath,
      book.format,
      book.originalFilename
    );

    if (extracted.unsupportedReason) {
      await prisma.audioJob.update({
        where: { id: jobId },
        data: {
          status: "FAILED",
          errorMessage: extracted.unsupportedReason,
          progress: 0,
        },
      });
      return;
    }

    if (extracted.title && extracted.title !== book.title) {
      await prisma.book.update({
        where: { id: book.id },
        data: {
          title: extracted.title,
          author: extracted.author ?? book.author,
        },
      });
    }

    const allChunks: { chapterTitle: string; text: string }[] = [];
    for (const ch of extracted.chapters) {
      for (const c of chunkText(ch.text, 800)) {
        allChunks.push({ chapterTitle: ch.title, text: c });
      }
    }

    // Free: keep demos snappy; Pro: allow longer books (still soft-capped).
    const maxChunks = isProPlan(plan) ? 400 : 40;
    const chunks = allChunks.slice(0, maxChunks);
    const totalChars = chunks.reduce((sum, c) => sum + c.text.length, 0);

    try {
      await assertCanConsumeChars(book.userId, totalChars);
    } catch (quotaErr) {
      const message =
        quotaErr instanceof Error ? quotaErr.message : "TTS quota exceeded";
      await prisma.audioJob.update({
        where: { id: jobId },
        data: { status: "FAILED", errorMessage: message, progress: 0 },
      });
      return;
    }

    await prisma.audioJob.update({
      where: { id: jobId },
      data: {
        status: "SYNTHESIZING",
        progress: 15,
        chapterCount: extracted.chapters.length,
        chunkCount: chunks.length,
      },
    });

    const audioParts: Buffer[] = [];
    let extension = "wav";

    for (let i = 0; i < chunks.length; i++) {
      const chunkTextLen = chunks[i].text.length;
      // Re-check remaining quota mid-job in case of concurrent jobs
      await assertCanConsumeChars(book.userId, chunkTextLen);

      const result = await provider.synthesize({
        text: chunks[i].text,
        chunkIndex: i,
      });
      audioParts.push(result.audio);
      extension = result.extension;

      await consumeTtsChars(book.userId, chunkTextLen);

      const progress = 15 + Math.floor(((i + 1) / chunks.length) * 70);
      await prisma.audioJob.update({
        where: { id: jobId },
        data: { progress },
      });
    }

    await prisma.audioJob.update({
      where: { id: jobId },
      data: { status: "ASSEMBLING", progress: 90 },
    });

    const assembled = await assembleAudio(audioParts, extension);
    const filename = "audiobook." + extension;
    const outPath = audioPath(book.userId, book.id, filename);
    await writeFileSafe(outPath, assembled);

    const asset = await prisma.audioAsset.create({
      data: {
        bookId: book.id,
        jobId: job.id,
        format: extension,
        storagePath: outPath,
        sizeBytes: assembled.length,
        durationSec: null,
      },
    });

    await prisma.audioJob.update({
      where: { id: jobId },
      data: {
        status: "COMPLETED",
        progress: 100,
        completedAt: new Date(),
      },
    });

    return asset;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown processing error";
    await prisma.audioJob.update({
      where: { id: jobId },
      data: { status: "FAILED", errorMessage: message },
    });
    throw err;
  }
}