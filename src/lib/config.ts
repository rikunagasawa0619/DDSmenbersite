/**
 * Client-safe check: only uses NEXT_PUBLIC_ env vars so it works in both
 * server and client bundles.  Server-only code that also needs the secret
 * key should use `isClerkServerReady` instead.
 */
export const isClerkConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
);

export const isDemoAuthEnabled =
  !isClerkConfigured && process.env.NODE_ENV !== "production";

/** Server-only: true when both publishable key and secret key are set. */
export const isClerkServerReady =
  typeof process !== "undefined" &&
  Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
      process.env.CLERK_SECRET_KEY,
  );

export const demoAuthCookieName = "dds_demo_session";
export const memberAuthCookieName = "dds_member_session";
export const memberSessionMaxAgeSeconds = 60 * 60 * 24 * 30;
