import { prisma } from "@/lib/prisma";
import { extractFromFile, chunkText } from "./extract";
import { getTtsProviderForPlan, ProTtsMisconfiguredError } from "@/lib/tts";
import { assembleAudio } from "./assemble";
import { getStorage, audioObjectKey } from "@/lib/storage";
import {
  assertCanConsumeChars,
  consumeTtsChars,
  effectivePlan,
  ensureUsageMonth,
} from "@/lib/billing/usage";
import { isProPlan } from "@/lib/billing/plans";

/** Process a claimed AudioJob. Called by the worker — not from request handlers. */
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

  let provider;
  try {
    provider = getTtsProviderForPlan(billingUser.plan, billingUser.planStatus);
  } catch (err) {
    const message =
      err instanceof ProTtsMisconfiguredError
        ? err.message
        : err instanceof Error
          ? err.message
          : "TTS provider misconfigured";
    await prisma.audioJob.update({
      where: { id: jobId },
      data: { status: "FAILED", errorMessage: message, progress: 0 },
    });
    return;
  }

  try {
    await prisma.audioJob.update({
      where: { id: jobId },
      data: { status: "PROCESSING", progress: 5, ttsProvider: provider.name, message: null },
    });

    const extracted = await extractFromFile(
      book.storagePath,
      book.format,
      book.originalFilename
    );

    if (extracted.unsupportedReason) {
      await prisma.audioJob.update({
        where: { id: jobId },
        data: { status: "FAILED", errorMessage: extracted.unsupportedReason, progress: 0 },
      });
      return;
    }

    if (extracted.title && extracted.title !== book.title) {
      await prisma.book.update({
        where: { id: book.id },
        data: { title: extracted.title, author: extracted.author ?? book.author },
      });
    }

    const allChunks: { chapterTitle: string; text: string }[] = [];
    for (const ch of extracted.chapters) {
      for (const c of chunkText(ch.text, 800)) {
        allChunks.push({ chapterTitle: ch.title, text: c });
      }
    }

    const maxChunks = isProPlan(plan) ? 400 : 40;
    const chunks = allChunks.slice(0, maxChunks);
    const chunkTruncated = allChunks.length > chunks.length;
    const totalChars = chunks.reduce((sum, c) => sum + c.text.length, 0);

    const notices: string[] = [];
    if (extracted.truncated && extracted.truncatedReason) notices.push(extracted.truncatedReason);
    if (chunkTruncated) {
      notices.push(
        `Conversion limited to ${maxChunks} text chunks (${allChunks.length} available). Upgrade or split the book for fuller audio.`
      );
    }

    try {
      await assertCanConsumeChars(book.userId, totalChars);
    } catch (quotaErr) {
      const message = quotaErr instanceof Error ? quotaErr.message : "TTS quota exceeded";
      await prisma.audioJob.update({
        where: { id: jobId },
        data: { status: "FAILED", errorMessage: message, progress: 0 },
      });
      return;
    }

    await prisma.audioJob.update({
      where: { id: jobId },
      data: {
        status: "PROCESSING",
        progress: 15,
        chapterCount: extracted.chapters.length,
        chunkCount: chunks.length,
        message: notices.length ? notices.join(" ") : null,
      },
    });

    const audioParts: Buffer[] = [];
    let extension = "wav";

    for (let i = 0; i < chunks.length; i++) {
      const chunkTextLen = chunks[i].text.length;
      await consumeTtsChars(book.userId, chunkTextLen);

      const result = await provider.synthesize({ text: chunks[i].text, chunkIndex: i });
      audioParts.push(result.audio);
      extension = result.extension;

      const progress = 15 + Math.floor(((i + 1) / chunks.length) * 70);
      await prisma.audioJob.update({ where: { id: jobId }, data: { progress } });
    }

    await prisma.audioJob.update({
      where: { id: jobId },
      data: { status: "PROCESSING", progress: 90 },
    });

    const assembled = await assembleAudio(audioParts, extension);
    const filename = "audiobook." + extension;
    const key = audioObjectKey(book.userId, book.id, filename);
    const contentType = extension === "mp3" ? "audio/mpeg" : "audio/wav";
    await getStorage().put(key, assembled, contentType);

    const asset = await prisma.audioAsset.create({
      data: {
        bookId: book.id,
        jobId: job.id,
        format: extension,
        storagePath: key,
        sizeBytes: assembled.length,
        durationSec: null,
      },
    });

    await prisma.audioJob.update({
      where: { id: jobId },
      data: {
        status: "DONE",
        progress: 100,
        completedAt: new Date(),
        message: notices.length ? notices.join(" ") : null,
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
