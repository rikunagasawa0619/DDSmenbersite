import { z } from "zod";

const optionalUrl = z
  .string()
  .trim()
  .url()
  .optional()
  .or(z.literal("").transform(() => undefined));

const optionalString = z
  .string()
  .trim()
  .min(1)
  .optional()
  .or(z.literal("").transform(() => undefined));

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    NEXT_PUBLIC_APP_URL: optionalUrl,
    CRON_SECRET: optionalString,
    MEMBER_SESSION_SECRET: optionalString,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: optionalString,
    CLERK_SECRET_KEY: optionalString,
    NEXT_PUBLIC_SENTRY_DSN: optionalString,
    SENTRY_DSN: optionalString,
    SENTRY_AUTH_TOKEN: optionalString,
    SENTRY_ORG: optionalString,
    SENTRY_PROJECT: optionalString,
    UPSTASH_REDIS_REST_URL: optionalUrl,
    UPSTASH_REDIS_REST_TOKEN: optionalString,
    RESEND_API_KEY: optionalString,
    RESEND_FROM_EMAIL: optionalString,
    R2_ACCOUNT_ID: optionalString,
    R2_ACCESS_KEY_ID: optionalString,
    R2_SECRET_ACCESS_KEY: optionalString,
    R2_BUCKET: optionalString,
    R2_PUBLIC_BASE_URL: optionalUrl,
  })
  .superRefine((env, ctx) => {
    const hasClerkPublic = Boolean(env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
    const hasClerkSecret = Boolean(env.CLERK_SECRET_KEY);
    if (hasClerkPublic !== hasClerkSecret) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: hasClerkPublic ? ["CLERK_SECRET_KEY"] : ["NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"],
        message: "Clerk を使う場合は publishable key と secret key の両方が必要です。",
      });
    }

    if (env.RESEND_API_KEY && !env.RESEND_FROM_EMAIL) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["RESEND_FROM_EMAIL"],
        message: "Resend を使う場合は RESEND_FROM_EMAIL が必要です。",
      });
    }

    const r2Fields = [
      env.R2_ACCOUNT_ID,
      env.R2_ACCESS_KEY_ID,
      env.R2_SECRET_ACCESS_KEY,
      env.R2_BUCKET,
    ];
    const hasAnyR2 = r2Fields.some(Boolean);
    const hasAllR2 = r2Fields.every(Boolean);
    if (hasAnyR2 && !hasAllR2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["R2_ACCOUNT_ID"],
        message: "R2 を使う場合は R2_* の4項目をすべて設定してください。",
      });
    }

    const hasAnySentry = Boolean(
      env.NEXT_PUBLIC_SENTRY_DSN ||
        env.SENTRY_DSN ||
        env.SENTRY_AUTH_TOKEN ||
        env.SENTRY_ORG ||
        env.SENTRY_PROJECT,
    );
    const hasSentryDsn = Boolean(env.NEXT_PUBLIC_SENTRY_DSN || env.SENTRY_DSN);
    if (hasAnySentry && !hasSentryDsn) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["NEXT_PUBLIC_SENTRY_DSN"],
        message: "Sentry を使う場合は NEXT_PUBLIC_SENTRY_DSN または SENTRY_DSN が必要です。",
      });
    }

    const hasAnyUpstash = Boolean(env.UPSTASH_REDIS_REST_URL || env.UPSTASH_REDIS_REST_TOKEN);
    const hasAllUpstash = Boolean(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN);
    if (hasAnyUpstash && !hasAllUpstash) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["UPSTASH_REDIS_REST_URL"],
        message: "Upstash レート制限を使う場合は URL と TOKEN の両方が必要です。",
      });
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const formatted = parsed.error.issues
    .map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`)
    .join("\n");

  throw new Error(`Environment validation failed.\n${formatted}`);
}

export const env = parsed.data;

export function getAppUrl() {
  if (env.NEXT_PUBLIC_APP_URL) {
    return env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

export function buildAbsoluteUrl(path: string) {
  return `${getAppUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}
