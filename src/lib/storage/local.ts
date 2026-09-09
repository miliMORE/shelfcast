import fs from "fs/promises";
import path from "path";
import type { StorageProvider } from "./types";

export class LocalStorageProvider implements StorageProvider {
  constructor(private root = process.env.STORAGE_ROOT || "storage") {}

  private resolve(key: string): string {
    const cleaned = key.replace(/^\/+/, "").replace(/\.\./g, "");
    return path.resolve(process.cwd(), this.root, cleaned);
  }

  async put(key: string, data: Buffer | Uint8Array): Promise<void> {
    const full = this.resolve(key);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, data);
  }

  async get(key: string): Promise<Buffer> {
    return fs.readFile(this.resolve(key));
  }

  async delete(key: string): Promise<void> {
    try {
      await fs.unlink(this.resolve(key));
    } catch (err: unknown) {
      const code = (err as NodeJS.ErrnoException)?.code;
      if (code !== "ENOENT") throw err;
    }
  }

  async deletePrefix(prefix: string): Promise<void> {
    const full = this.resolve(prefix);
    try {
      await fs.rm(full, { recursive: true, force: true });
    } catch (err: unknown) {
      const code = (err as NodeJS.ErrnoException)?.code;
      if (code !== "ENOENT") throw err;
    }
  }

  async signedOrPublicUrl(key: string): Promise<string> {
    return key;
  }
}
