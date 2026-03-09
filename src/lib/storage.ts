import { randomUUID } from "crypto";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

import { buildAbsoluteUrl, env } from "@/lib/env";

const maxImageFileSize = 5 * 1024 * 1024;
const imageSignatures = [
  { mime: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { mime: "image/gif", bytes: [0x47, 0x49, 0x46, 0x38] },
  { mime: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46] },
];

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
}

function getR2Client() {
  if (!isStorageConfigured()) {
    throw new Error("R2 storage is not configured.");
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID!,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

export function isStorageConfigured() {
  return Boolean(
    env.R2_ACCOUNT_ID &&
      env.R2_ACCESS_KEY_ID &&
      env.R2_SECRET_ACCESS_KEY &&
      env.R2_BUCKET,
  );
}

export function canUseDirectAssetUrl() {
  return Boolean(env.R2_PUBLIC_BASE_URL);
}

export function assertImageFile(file: File | null) {
  if (!file || file.size === 0) {
    return;
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("画像ファイルのみアップロードできます。");
  }

  if (file.size > maxImageFileSize) {
    throw new Error("画像サイズは 5MB 以下にしてください。");
  }
}

async function assertImageMagicBytes(file: File) {
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const matched = imageSignatures.find((signature) =>
    signature.bytes.every((byte, index) => bytes[index] === byte),
  );

  if (!matched) {
    throw new Error("画像ファイルの形式を判別できませんでした。PNG/JPG/GIF/WebP を利用してください。");
  }

  if (matched.mime === "image/webp") {
    const webpHeader = new TextDecoder().decode(bytes.slice(8, 12));
    if (webpHeader !== "WEBP") {
      throw new Error("WebP ファイルの形式が正しくありません。");
    }
  }
}

export async function uploadImageFile(params: {
  file: File;
  folder: string;
  alt?: string;
}) {
  assertImageFile(params.file);
  await assertImageMagicBytes(params.file);
  const client = getR2Client();
  const id = randomUUID();
  const fileName = sanitizeFileName(params.file.name || `${id}.bin`);
  const storageKey = `${params.folder}/${id}-${fileName}`;
  const buffer = Buffer.from(await params.file.arrayBuffer());

  await client.send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET!,
      Key: storageKey,
      Body: buffer,
      ContentType: params.file.type,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );

  const url = env.R2_PUBLIC_BASE_URL
    ? `${env.R2_PUBLIC_BASE_URL.replace(/\/$/, "")}/${storageKey}`
    : buildAbsoluteUrl(`/api/assets/${id}`);

  return {
    id,
    storageKey,
    fileName,
    mimeType: params.file.type,
    sizeBytes: params.file.size,
    url,
    alt: params.alt,
  };
}

export async function downloadImageAsset(storageKey: string) {
  const client = getR2Client();
  const result = await client.send(
    new GetObjectCommand({
      Bucket: env.R2_BUCKET!,
      Key: storageKey,
    }),
  );

  if (!result.Body) {
    throw new Error("Asset body is empty.");
  }

  return {
    contentType: result.ContentType ?? "application/octet-stream",
    body: result.Body.transformToWebStream(),
  };
}
