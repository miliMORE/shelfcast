import type { Plan } from "@prisma/client";

export const FREE_BOOK_LIMIT = 2;
export const PRO_BOOK_SOFT_CAP = 100;
export const FREE_TTS_CHARS_PER_MONTH = 15_000;
export const PRO_TTS_CHARS_PER_MONTH = 500_000;

export function isProPlan(plan: Plan | string | null | undefined): boolean {
  return String(plan).toUpperCase() === "PRO";
}

export function bookLimitForPlan(plan: Plan | string | null | undefined): number {
  return isProPlan(plan) ? PRO_BOOK_SOFT_CAP : FREE_BOOK_LIMIT;
}

export function ttsCharLimitForPlan(plan: Plan | string | null | undefined): number {
  return isProPlan(plan) ? PRO_TTS_CHARS_PER_MONTH : FREE_TTS_CHARS_PER_MONTH;
}

export function planLabel(plan: Plan | string | null | undefined): string {
  return isProPlan(plan) ? "Pro" : "Free";
}

/** Active paid access — canceled/past_due fall back to Free entitlements. */
export function hasActiveProAccess(
  plan: Plan | string | null | undefined,
  planStatus: string | null | undefined
): boolean {
  if (!isProPlan(plan)) return false;
  if (!planStatus) return true;
  return planStatus === "active" || planStatus === "trialing";
}