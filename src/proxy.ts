import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

import { experimentCookieName, homeHeroVariants } from "@/lib/experiments";

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

function withExperimentCookie(
  request: NextRequest,
  response?: Response | NextResponse | null | void,
) {
  if (response && !(response instanceof NextResponse)) {
    return response;
  }

  const nextResponse = response ?? NextResponse.next();

  if (request.cookies.has(experimentCookieName)) {
    return nextResponse;
  }

  const index = crypto.getRandomValues(new Uint32Array(1))[0] % homeHeroVariants.length;
  nextResponse.cookies.set(experimentCookieName, homeHeroVariants[index], {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return nextResponse;
}

export default function proxy(request: NextRequest, event: Parameters<typeof protectedMiddleware>[1]) {
  if (!isClerkEnabled) {
    return withExperimentCookie(request, NextResponse.next());
  }

  return Promise.resolve(protectedMiddleware(request, event)).then((response) =>
    withExperimentCookie(request, response),
  );
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
