import fs from "fs/promises";
import path from "path";

/**
 * Concatenate WAV buffers (same format) into one WAV.
 * For MP3 chunks (OpenAI), simply concatenates raw frames.
 */
export async function assembleAudio(
  parts: Buffer[],
  extension: string
): Promise<Buffer> {
  if (parts.length === 0) throw new Error("No audio parts to assemble");
  if (parts.length === 1) return parts[0];

  if (extension === "wav") {
    return concatWav(parts);
  }
  return Buffer.concat(parts);
}

function concatWav(parts: Buffer[]): Buffer {
  const pcmParts: Buffer[] = [];
  let sampleRate = 22050;
  let channels = 1;
  let bitsPerSample = 16;

  for (const part of parts) {
    if (part.toString("ascii", 0, 4) !== "RIFF") {
      pcmParts.push(part);
      continue;
    }
    sampleRate = part.readUInt32LE(24);
    channels = part.readUInt16LE(22);
    bitsPerSample = part.readUInt16LE(34);
    const dataSize = part.readUInt32LE(40);
    pcmParts.push(part.subarray(44, 44 + dataSize));
  }

  const data = Buffer.concat(pcmParts);
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * channels * (bitsPerSample / 8), 28);
  header.writeUInt16LE(channels * (bitsPerSample / 8), 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

export async function writeAssembled(filePath: string, buffer: Buffer) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, buffer);
}
