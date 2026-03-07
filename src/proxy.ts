import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isClerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

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
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isClerkEnabled) {
    return NextResponse.next();
  }

  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
