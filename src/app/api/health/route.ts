import { NextResponse } from "next/server";

import { isClerkServerReady } from "@/lib/config";
import { isEmailConfigured } from "@/lib/email";
import { prisma } from "@/lib/prisma";

export async function GET() {
  let database = "disabled";

  if (prisma) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      database = "ok";
    } catch {
      database = "error";
    }
  }

  return NextResponse.json(
    {
      status: database === "error" ? "degraded" : "ok",
      services: {
        database,
        clerk: isClerkServerReady ? "configured" : "disabled",
        email: isEmailConfigured() ? "configured" : "disabled",
      },
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
