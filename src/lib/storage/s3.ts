import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import type { StorageProvider } from "./types";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env ${name} for S3 storage`);
  return v;
}

export class S3StorageProvider implements StorageProvider {
  private client: S3Client;
  private bucket: string;

  constructor() {
    this.bucket = requireEnv("S3_BUCKET");
    const endpoint = process.env.S3_ENDPOINT || undefined;
    const region = process.env.S3_REGION || "auto";
    const forcePathStyle =
      String(process.env.S3_FORCE_PATH_STYLE || "false").toLowerCase() === "true";

    this.client = new S3Client({
      region,
      endpoint,
      forcePathStyle,
      credentials: {
        accessKeyId: requireEnv("S3_ACCESS_KEY_ID"),
        secretAccessKey: requireEnv("S3_SECRET_ACCESS_KEY"),
      },
    });
  }

  async put(key: string, data: Buffer | Uint8Array, contentType?: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: data,
        ContentType: contentType,
      })
    );
  }

  async get(key: string): Promise<Buffer> {
    const res = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key })
    );
    const body = res.Body;
    if (!body) throw new Error("Empty S3 object body for " + key);
    const bytes = await body.transformToByteArray();
    return Buffer.from(bytes);
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  async deletePrefix(prefix: string): Promise<void> {
    let continuationToken: string | undefined;
    do {
      const listed = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        })
      );
      const keys = (listed.Contents || []).map((o) => o.Key).filter((k): k is string => !!k);
      if (keys.length) {
        await this.client.send(
          new DeleteObjectsCommand({
            Bucket: this.bucket,
            Delete: { Objects: keys.map((Key) => ({ Key })) },
          })
        );
      }
      continuationToken = listed.IsTruncated ? listed.NextContinuationToken : undefined;
    } while (continuationToken);
  }

  async signedOrPublicUrl(key: string): Promise<string> {
    const publicBase = process.env.S3_PUBLIC_URL_BASE;
    if (publicBase) return publicBase.replace(/\/$/, "") + "/" + key;
    const endpoint = process.env.S3_ENDPOINT;
    if (endpoint) return endpoint.replace(/\/$/, "") + "/" + this.bucket + "/" + key;
    return `https://${this.bucket}.s3.amazonaws.com/${key}`;
  }
}
