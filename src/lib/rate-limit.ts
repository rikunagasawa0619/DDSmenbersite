import { headers } from "next/headers";

import { env } from "@/lib/env";

type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

declare global {
  var __ddsRateLimitStore: Map<string, Bucket> | undefined;
}

const store = global.__ddsRateLimitStore ?? new Map<string, Bucket>();

if (process.env.NODE_ENV !== "production") {
  global.__ddsRateLimitStore = store;
}

export class RateLimitError extends Error {
  constructor(message = "短時間に操作が集中しています。少し待ってから再度お試しください。") {
    super(message);
    this.name = "RateLimitError";
  }
}

async function getClientIdentifier() {
  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for");
  const realIp = headerStore.get("x-real-ip");
  const ip = forwardedFor?.split(",")[0]?.trim() || realIp || "anonymous";
  return ip;
}

async function checkUpstashRateLimit(options: RateLimitOptions, identifier: string) {
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    return false;
  }

  const bucketKey = `${options.key}:${identifier}`;
  const ttlSeconds = Math.ceil(options.windowMs / 1000);

  const response = await fetch(`${env.UPSTASH_REDIS_REST_URL}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      ["INCR", bucketKey],
      ["EXPIRE", bucketKey, ttlSeconds],
    ]),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Upstash rate limit request failed: ${response.status}`);
  }

  const payload = (await response.json()) as Array<{ result?: number }>;
  const currentCount = payload[0]?.result ?? 0;

  if (currentCount > options.limit) {
    throw new RateLimitError();
  }

  return true;
}

export async function assertRateLimit(options: RateLimitOptions, subject?: string) {
  const identifier = subject ?? (await getClientIdentifier());
  const usedUpstash = await checkUpstashRateLimit(options, identifier).catch((error) => {
    console.error("Upstash rate limit failed, falling back to local memory store.", error);
    return false;
  });

  if (usedUpstash) {
    return;
  }

  const now = Date.now();
  const bucketKey = `${options.key}:${identifier}`;
  const current = store.get(bucketKey);

  if (!current || current.resetAt <= now) {
    store.set(bucketKey, {
      count: 1,
      resetAt: now + options.windowMs,
    });
    return;
  }

  if (current.count >= options.limit) {
    throw new RateLimitError();
  }

  current.count += 1;
  store.set(bucketKey, current);
}
