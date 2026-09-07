import type { TtsProvider, TtsSynthesizeInput, TtsSynthesizeResult } from "./types";

/**
 * Mid-tier OpenAI TTS provider (tts-1).
 * Requires OPENAI_API_KEY. Not used when TTS_PROVIDER=mock.
 */
export class OpenAiTtsProvider implements TtsProvider {
  readonly name = "openai";

  async synthesize(input: TtsSynthesizeInput): Promise<TtsSynthesizeResult> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is required when TTS_PROVIDER=openai");
    }
    const model = process.env.OPENAI_TTS_MODEL || "tts-1";
    const voice = input.voice || process.env.OPENAI_TTS_VOICE || "alloy";
    const text = input.text.slice(0, 4096);

    const res = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        voice,
        input: text,
        response_format: "mp3",
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error("OpenAI TTS failed: " + res.status + " " + errText);
    }

    const arrayBuffer = await res.arrayBuffer();
    return {
      audio: Buffer.from(arrayBuffer),
      mimeType: "audio/mpeg",
      extension: "mp3",
    };
  }
}
