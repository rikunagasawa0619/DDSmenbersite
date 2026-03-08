import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

const isClerkEnabled = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
);

const isPublicRoute = createRouteMatcher([
  "/",
  "/login(.*)",
  "/privacy(.*)",
  "/terms(.*)",
  "/tokushoho(.*)",
  "/access-denied(.*)",
  "/post-login",
  "/robots.txt",
  "/api/webhooks(.*)",
  "/api/health",
  "/api/cron/monthly-credits",
  "/api/cron/email-campaigns",
  "/api/assets/(.*)",
]);

const protectedMiddleware = clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export default function proxy(request: NextRequest, event: Parameters<typeof protectedMiddleware>[1]) {
  if (!isClerkEnabled) {
    return NextResponse.next();
  }

  return protectedMiddleware(request, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
