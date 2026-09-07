import fs from "fs/promises";
import path from "path";

export function storageRoot() {
  return path.resolve(process.cwd(), process.env.STORAGE_ROOT || "storage");
}

export async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

export function userDir(userId: string) {
  return path.join(storageRoot(), "users", userId);
}

export function bookUploadPath(userId: string, bookId: string, filename: string) {
  return path.join(userDir(userId), "books", bookId, filename);
}

export function audioPath(userId: string, bookId: string, filename: string) {
  return path.join(userDir(userId), "books", bookId, "audio", filename);
}

export async function writeFileSafe(filePath: string, data: Buffer | Uint8Array) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, data);
  return filePath;
}

export async function readFileSafe(filePath: string) {
  return fs.readFile(filePath);
}
