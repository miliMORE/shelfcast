import type { StorageProvider } from "./types";
import { LocalStorageProvider } from "./local";
import { S3StorageProvider } from "./s3";

let cached: StorageProvider | null = null;

export function getStorage(): StorageProvider {
  if (cached) return cached;
  const driver = (process.env.STORAGE_DRIVER || "local").toLowerCase();
  cached = driver === "s3" ? new S3StorageProvider() : new LocalStorageProvider();
  return cached;
}

export * from "./types";
export { LocalStorageProvider } from "./local";
export { S3StorageProvider } from "./s3";
