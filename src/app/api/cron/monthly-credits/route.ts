import { NextResponse } from "next/server";

import { processMonthlyCreditGrants } from "@/lib/credit-batch";
import { env } from "@/lib/env";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const secretFromHeader = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const secretFromQuery = url.searchParams.get("secret");

  if (env.CRON_SECRET) {
    const authorized =
      secretFromHeader === env.CRON_SECRET || secretFromQuery === env.CRON_SECRET;

    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const result = await processMonthlyCreditGrants({
    source: "cron",
  });

  return NextResponse.json(result);
}
