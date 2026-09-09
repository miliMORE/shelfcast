import type { Plan } from "@prisma/client";
import type { TtsProvider } from "./types";
import { MockTtsProvider } from "./mock";
import { OpenAiTtsProvider } from "./openai";
import { hasActiveProAccess } from "@/lib/billing/plans";

export type { TtsProvider, TtsSynthesizeInput, TtsSynthesizeResult } from "./types";
export { MockTtsProvider } from "./mock";
export { OpenAiTtsProvider } from "./openai";

export class ProTtsMisconfiguredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProTtsMisconfiguredError";
  }
}

/**
 * Free always gets Mock.
 * Pro requires OpenAI — never silently falls back to mock.
 */
export function getTtsProviderForPlan(
  plan: Plan | string | null | undefined,
  planStatus?: string | null
): TtsProvider {
  if (!hasActiveProAccess(plan, planStatus)) {
    return new MockTtsProvider();
  }

  const name = (process.env.TTS_PROVIDER || "openai").toLowerCase();
  if (name === "openai" && process.env.OPENAI_API_KEY) {
    return new OpenAiTtsProvider();
  }

  throw new ProTtsMisconfiguredError(
    "Pro plan requires a valid OpenAI TTS configuration. Set TTS_PROVIDER=openai and OPENAI_API_KEY. " +
      "Mock TTS is only available on the Free plan."
  );
}

/** @deprecated Prefer getTtsProviderForPlan */
export function getTtsProvider(): TtsProvider {
  const name = (process.env.TTS_PROVIDER || "mock").toLowerCase();
  if (name === "openai") return new OpenAiTtsProvider();
  return new MockTtsProvider();
}
