import fs from "fs/promises";
import path from "path";
import { getStorage } from "@/lib/storage";

export interface Chapter {
  title: string;
  text: string;
}

export interface ExtractResult {
  title: string;
  author?: string;
  chapters: Chapter[];
  unsupportedReason?: string;
  truncated?: boolean;
  truncatedReason?: string;
}

const MAX_CHARS = 120_000;

export async function extractFromFile(
  storageKey: string,
  format: "EPUB" | "PDF",
  originalFilename: string
): Promise<ExtractResult> {
  if (format === "EPUB") return extractEpub(storageKey, originalFilename);
  return extractPdf(storageKey, originalFilename);
}

async function loadBytes(storageKey: string): Promise<Buffer> {
  try {
    return await getStorage().get(storageKey);
  } catch {
    return fs.readFile(storageKey);
  }
}

async function extractEpub(storageKey: string, originalFilename: string): Promise<ExtractResult> {
  const bytes = await loadBytes(storageKey);
  const tmpDir = path.join(process.cwd(), ".tmp-extract");
  await fs.mkdir(tmpDir, { recursive: true });
  const tmpPath = path.join(
    tmpDir,
    `epub-${Date.now()}-${Math.random().toString(36).slice(2)}.epub`
  );
  await fs.writeFile(tmpPath, bytes);

  try {
    const mod: any = await import("epub2");
    const EpubCtor: any = mod.EPub || mod.default?.EPub || mod.default || mod;

    return await new Promise((resolve, reject) => {
      const epub = new EpubCtor(tmpPath);
      epub.on("error", (err: Error) => reject(err));
      epub.on("end", async () => {
        try {
          const metaTitle = epub.metadata?.title || stripExt(originalFilename);
          const author = epub.metadata?.creator || undefined;
          const chapters: Chapter[] = [];
          const flow: any[] = epub.flow || [];

          for (let i = 0; i < flow.length; i++) {
            const chapter = flow[i];
            const id = chapter.id;
            const text: string = await new Promise((res, rej) => {
              epub.getChapter(id, (err: Error | null, data: string) => {
                if (err) rej(err);
                else res(stripHtml(data || ""));
              });
            });
            const cleaned = text.replace(/\s+/g, " ").trim();
            if (cleaned.length < 40) continue;
            chapters.push({
              title: chapter.title || "Chapter " + (chapters.length + 1),
              text: cleaned,
            });
          }

          if (chapters.length === 0) {
            chapters.push({
              title: "Full text",
              text:
                "No chapter text could be extracted from this EPUB. Placeholder for " +
                metaTitle +
                ".",
            });
          }

          const trimmed = trimChapters(chapters);
          resolve({
            title: metaTitle,
            author,
            chapters: trimmed.chapters,
            truncated: trimmed.truncated,
            truncatedReason: trimmed.truncated
              ? `Text was truncated to ${MAX_CHARS.toLocaleString()} characters during extraction.`
              : undefined,
          });
        } catch (e) {
          reject(e);
        }
      });
      epub.parse();
    });
  } finally {
    await fs.unlink(tmpPath).catch(() => undefined);
  }
}

async function extractPdf(storageKey: string, originalFilename: string): Promise<ExtractResult> {
  const pdfParse = (await import("pdf-parse")).default;
  const dataBuffer = await loadBytes(storageKey);
  const parsed = await pdfParse(dataBuffer);
  const text = (parsed.text || "").replace(/\r/g, "").trim();

  if (!text || text.length < 40) {
    return {
      title: stripExt(originalFilename),
      chapters: [],
      unsupportedReason:
        "This looks like a scanned or image-only PDF (no extractable text layer). Scanned PDFs are not supported yet.",
    };
  }

  const chapters = splitIntoChapters(text, stripExt(originalFilename));
  const trimmed = trimChapters(chapters);
  return {
    title: parsed.info?.Title || stripExt(originalFilename),
    author: parsed.info?.Author || undefined,
    chapters: trimmed.chapters,
    truncated: trimmed.truncated,
    truncatedReason: trimmed.truncated
      ? `Text was truncated to ${MAX_CHARS.toLocaleString()} characters during extraction.`
      : undefined,
  };
}

function splitIntoChapters(text: string, fallbackTitle: string): Chapter[] {
  const parts = text.split(/\n(?=Chapter\s+\d+|CHAPTER\s+\d+|Part\s+\d+)/i);
  if (parts.length > 1) {
    return parts
      .map((p, i) => ({
        title: "Chapter " + (i + 1),
        text: p.replace(/\s+/g, " ").trim(),
      }))
      .filter((c) => c.text.length > 40);
  }
  const chunkSize = 3000;
  const chapters: Chapter[] = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chapters.push({
      title: "Section " + (chapters.length + 1),
      text: text.slice(i, i + chunkSize).replace(/\s+/g, " ").trim(),
    });
  }
  if (chapters.length === 0) chapters.push({ title: fallbackTitle, text });
  return chapters;
}

function trimChapters(chapters: Chapter[]): { chapters: Chapter[]; truncated: boolean } {
  let total = 0;
  const out: Chapter[] = [];
  let truncated = false;
  for (const ch of chapters) {
    if (total >= MAX_CHARS) {
      truncated = true;
      break;
    }
    const remaining = MAX_CHARS - total;
    const text = ch.text.slice(0, remaining);
    if (text.length < ch.text.length) truncated = true;
    out.push({ ...ch, text });
    total += text.length;
  }
  if (out.length < chapters.length) truncated = true;
  return { chapters: out, truncated };
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"');
}

function stripExt(name: string) {
  return path.basename(name, path.extname(name));
}

export function chunkText(text: string, maxLen = 800): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  let current = "";
  for (const w of words) {
    if ((current + " " + w).trim().length > maxLen) {
      if (current) chunks.push(current.trim());
      current = w;
    } else {
      current = (current + " " + w).trim();
    }
  }
  if (current) chunks.push(current.trim());
  return chunks.length ? chunks : [text.slice(0, maxLen)];
}
