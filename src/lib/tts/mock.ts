import type { TtsProvider, TtsSynthesizeInput, TtsSynthesizeResult } from "./types";

/** Generate a short PCM WAV tone so the pipeline works without API keys. */
function buildWav(text: string, chunkIndex = 0): Buffer {
  const sampleRate = 22050;
  // Duration scales slightly with text length, capped for demo
  const durationSec = Math.min(2.5, 0.4 + Math.min(text.length, 400) / 400);
  const numSamples = Math.floor(sampleRate * durationSec);
  const freq = 220 + (chunkIndex % 8) * 40;
  const dataSize = numSamples * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const envelope = Math.min(1, t * 10) * Math.min(1, (durationSec - t) * 10);
    const sample = Math.sin(2 * Math.PI * freq * t) * 0.25 * envelope;
    buffer.writeInt16LE(Math.floor(sample * 32767), 44 + i * 2);
  }
  return buffer;
}

export class MockTtsProvider implements TtsProvider {
  readonly name = "mock";

  async synthesize(input: TtsSynthesizeInput): Promise<TtsSynthesizeResult> {
    const audio = buildWav(input.text, input.chunkIndex ?? 0);
    return { audio, mimeType: "audio/wav", extension: "wav" };
  }
}
