import type { TtsProvider } from "./types";
import { MockTtsProvider } from "./mock";
import { OpenAiTtsProvider } from "./openai";

export type { TtsProvider, TtsSynthesizeInput, TtsSynthesizeResult } from "./types";
export { MockTtsProvider } from "./mock";
export { OpenAiTtsProvider } from "./openai";

export function getTtsProvider(): TtsProvider {
  const name = (process.env.TTS_PROVIDER || "mock").toLowerCase();
  if (name === "openai") return new OpenAiTtsProvider();
  return new MockTtsProvider();
}
