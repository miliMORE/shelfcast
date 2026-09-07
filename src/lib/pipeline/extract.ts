import fs from "fs/promises";
import path from "path";

export interface Chapter {
  title: string;
  text: string;
}

export interface ExtractResult {
  title: string;
  author?: string;
  chapters: Chapter[];
  unsupportedReason?: string;
}

const MAX_CHARS = 120_000;

export async function extractFromFile(
  filePath: string,
  format: "EPUB" | "PDF",
  originalFilename: string
): Promise<ExtractResult> {
  if (format === "EPUB") return extractEpub(filePath, originalFilename);
  return extractPdf(filePath, originalFilename);
}

async function extractEpub(filePath: string, originalFilename: string): Promise<ExtractResult> {
  const mod: any = await import("epub2");
  const EpubCtor: any = mod.EPub || mod.default?.EPub || mod.default || mod;

  return new Promise((resolve, reject) => {
    const epub = new EpubCtor(filePath);
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
            text: "No chapter text could be extracted from this EPUB. Placeholder for " + metaTitle + ".",
          });
        }

        resolve({
          title: metaTitle,
          author,
          chapters: trimChapters(chapters),
        });
      } catch (e) {
        reject(e);
      }
    });
    epub.parse();
  });
}

async function extractPdf(filePath: string, originalFilename: string): Promise<ExtractResult> {
  const pdfParse = (await import("pdf-parse")).default;
  const dataBuffer = await fs.readFile(filePath);
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
  return {
    title: parsed.info?.Title || stripExt(originalFilename),
    author: parsed.info?.Author || undefined,
    chapters: trimChapters(chapters),
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
  if (chapters.length === 0) {
    chapters.push({ title: fallbackTitle, text });
  }
  return chapters;
}

function trimChapters(chapters: Chapter[]): Chapter[] {
  let total = 0;
  const out: Chapter[] = [];
  for (const ch of chapters) {
    if (total >= MAX_CHARS) break;
    const remaining = MAX_CHARS - total;
    const text = ch.text.slice(0, remaining);
    out.push({ ...ch, text });
    total += text.length;
  }
  return out;
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
