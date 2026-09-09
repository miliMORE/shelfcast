export interface StorageProvider {
  put(key: string, data: Buffer | Uint8Array, contentType?: string): Promise<void>;
  get(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  deletePrefix(prefix: string): Promise<void>;
  signedOrPublicUrl(key: string): Promise<string>;
}

export function bookObjectKey(userId: string, bookId: string, filename: string): string {
  return `users/${userId}/books/${bookId}/${filename}`;
}

export function audioObjectKey(userId: string, bookId: string, filename: string): string {
  return `users/${userId}/books/${bookId}/audio/${filename}`;
}

export function bookPrefix(userId: string, bookId: string): string {
  return `users/${userId}/books/${bookId}/`;
}
