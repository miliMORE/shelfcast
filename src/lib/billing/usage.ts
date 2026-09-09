import type { Plan, User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hasActiveProAccess, ttsCharLimitForPlan } from "./plans";

export type BillingUser = Pick<
  User,
  "id" | "plan" | "planStatus" | "ttsCharsUsedMonth" | "ttsCharsResetAt"
>;

function startOfUtcMonth(d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0, 0));
}

export async function ensureUsageMonth(user: BillingUser): Promise<BillingUser> {
  const monthStart = startOfUtcMonth();
  const resetAt = user.ttsCharsResetAt ? new Date(user.ttsCharsResetAt) : null;
  if (resetAt && resetAt.getTime() >= monthStart.getTime()) return user;

  return prisma.user.update({
    where: { id: user.id },
    data: { ttsCharsUsedMonth: 0, ttsCharsResetAt: monthStart },
    select: {
      id: true,
      plan: true,
      planStatus: true,
      ttsCharsUsedMonth: true,
      ttsCharsResetAt: true,
    },
  });
}

export function effectivePlan(user: Pick<BillingUser, "plan" | "planStatus">): Plan {
  return hasActiveProAccess(user.plan, user.planStatus) ? "PRO" : "FREE";
}

export async function getUsageSnapshot(userId: string) {
  const raw = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      plan: true,
      planStatus: true,
      ttsCharsUsedMonth: true,
      ttsCharsResetAt: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      stripePriceId: true,
    },
  });
  if (!raw) return null;

  const user = await ensureUsageMonth(raw);
  const plan = effectivePlan(user);
  const limit = ttsCharLimitForPlan(plan);
  return {
    ...user,
    effectivePlan: plan,
    ttsCharsLimit: limit,
    ttsCharsRemaining: Math.max(0, limit - user.ttsCharsUsedMonth),
    stripeCustomerId: raw.stripeCustomerId,
    stripeSubscriptionId: raw.stripeSubscriptionId,
    stripePriceId: raw.stripePriceId,
  };
}

export async function assertCanConsumeChars(
  userId: string,
  charsNeeded: number
): Promise<{ plan: Plan; used: number; limit: number }> {
  const snap = await getUsageSnapshot(userId);
  if (!snap) throw new Error("User not found");

  const remaining = snap.ttsCharsLimit - snap.ttsCharsUsedMonth;
  if (charsNeeded > remaining) {
    const planName = snap.effectivePlan === "PRO" ? "Pro" : "Free";
    throw new Error(
      `Monthly TTS quota exceeded (${snap.ttsCharsUsedMonth.toLocaleString()} / ${snap.ttsCharsLimit.toLocaleString()} characters on ${planName}). ` +
        (snap.effectivePlan === "FREE"
          ? "Upgrade to Pro for 500,000 characters / month."
          : "Wait until next month or contact support.")
    );
  }

  return { plan: snap.effectivePlan, used: snap.ttsCharsUsedMonth, limit: snap.ttsCharsLimit };
}

/** Atomically consume chars so concurrent jobs cannot overshoot monthly quota. */
export async function consumeTtsChars(userId: string, chars: number): Promise<void> {
  if (chars <= 0) return;

  await prisma.$transaction(async (tx) => {
    const raw = await tx.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        plan: true,
        planStatus: true,
        ttsCharsUsedMonth: true,
        ttsCharsResetAt: true,
      },
    });
    if (!raw) throw new Error("User not found");

    const monthStart = startOfUtcMonth();
    const resetAt = raw.ttsCharsResetAt ? new Date(raw.ttsCharsResetAt) : null;
    let used = raw.ttsCharsUsedMonth;
    if (!resetAt || resetAt.getTime() < monthStart.getTime()) {
      used = 0;
      await tx.user.update({
        where: { id: userId },
        data: { ttsCharsUsedMonth: 0, ttsCharsResetAt: monthStart },
      });
    }

    const plan = effectivePlan(raw);
    const limit = ttsCharLimitForPlan(plan);
    if (used + chars > limit) {
      throw new Error(
        `Monthly TTS quota exceeded (${used.toLocaleString()} / ${limit.toLocaleString()} characters).`
      );
    }

    const result = await tx.user.updateMany({
      where: { id: userId, ttsCharsUsedMonth: used },
      data: { ttsCharsUsedMonth: { increment: chars } },
    });

    if (result.count !== 1) {
      const retry = await tx.user.updateMany({
        where: {
          id: userId,
          ttsCharsUsedMonth: { lte: limit - chars },
        },
        data: { ttsCharsUsedMonth: { increment: chars } },
      });
      if (retry.count !== 1) {
        throw new Error("Monthly TTS quota exceeded (concurrent jobs).");
      }
    }
  });
}
