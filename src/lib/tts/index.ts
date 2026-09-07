import type { Plan } from "@prisma/client";
import type { TtsProvider } from "./types";
import { MockTtsProvider } from "./mock";
import { OpenAiTtsProvider } from "./openai";
import { hasActiveProAccess } from "@/lib/billing/plans";

export type { TtsProvider, TtsSynthesizeInput, TtsSynthesizeResult } from "./types";
export { MockTtsProvider } from "./mock";
export { OpenAiTtsProvider } from "./openai";

/**
 * Resolve TTS provider for a user plan.
 * Free (or inactive Pro) always gets Mock — even if OPENAI_API_KEY / TTS_PROVIDER=openai are set.
 * Pro uses OpenAI when configured; otherwise falls back to mock.
 */
export function getTtsProviderForPlan(
  plan: Plan | string | null | undefined,
  planStatus?: string | null
): TtsProvider {
  if (!hasActiveProAccess(plan, planStatus)) {
    return new MockTtsProvider();
  }

  const name = (process.env.TTS_PROVIDER || "mock").toLowerCase();
  if (name === "openai" && process.env.OPENAI_API_KEY) {
    return new OpenAiTtsProvider();
  }
  // Pro without OpenAI key still converts via mock so the product works locally.
  return new MockTtsProvider();
}

/** @deprecated Prefer getTtsProviderForPlan — env-only resolution ignores billing. */
export function getTtsProvider(): TtsProvider {
  const name = (process.env.TTS_PROVIDER || "mock").toLowerCase();
  if (name === "openai") return new OpenAiTtsProvider();
  return new MockTtsProvider();
}