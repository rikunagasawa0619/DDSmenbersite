import { NextResponse, type NextRequest } from "next/server";

import { experimentCookieName, homeHeroVariants } from "@/lib/experiments";

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

export default function proxy(request: NextRequest) {
  return withExperimentCookie(request, NextResponse.next());
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
