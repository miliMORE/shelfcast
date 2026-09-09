/**
 * DB-backed background worker (no Redis).
 * Polls QUEUED jobs, claims with conditional update, runs TTS pipeline.
 *
 * npm run worker
 * Compose: worker service. Set PROCESS_JOBS=0 to idle without claiming.
 */
import { prisma } from "./lib/prisma";
import { processAudioJob } from "./lib/pipeline/process";

const POLL_MS = Number(process.env.WORKER_POLL_MS || 2000);
const enabled = process.env.PROCESS_JOBS !== "0";

async function claimNextJob(): Promise<string | null> {
  const next = await prisma.audioJob.findFirst({
    where: { status: "QUEUED" },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (!next) return null;

  const claimed = await prisma.audioJob.updateMany({
    where: { id: next.id, status: "QUEUED" },
    data: { status: "PROCESSING", progress: 1 },
  });
  if (claimed.count !== 1) return null;
  return next.id;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function loop() {
  if (!enabled) {
    console.log("[worker] PROCESS_JOBS=0 — idle (not claiming jobs)");
    // keep process alive
    // eslint-disable-next-line no-constant-condition
    while (true) await sleep(60_000);
  }

  console.log(`[worker] started — polling every ${POLL_MS}ms`);
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const jobId = await claimNextJob();
      if (jobId) {
        console.log("[worker] processing", jobId);
        try {
          await processAudioJob(jobId);
          console.log("[worker] done", jobId);
        } catch (err) {
          console.error("[worker] job failed", jobId, err);
        }
      } else {
        await sleep(POLL_MS);
      }
    } catch (err) {
      console.error("[worker] loop error", err);
      await sleep(POLL_MS);
    }
  }
}

loop().catch((err) => {
  console.error("[worker] fatal", err);
  process.exit(1);
});
