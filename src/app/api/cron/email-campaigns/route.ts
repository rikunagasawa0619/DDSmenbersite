import { NextResponse } from "next/server";

import { deliverScheduledCampaigns } from "@/lib/campaigns";
import { env } from "@/lib/env";

const cronActorId = "system-cron";

export async function GET(request: Request) {
  if (env.CRON_SECRET) {
    const secretFromHeader = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    const secretFromQuery = new URL(request.url).searchParams.get("secret");
    const authorized =
      secretFromHeader === env.CRON_SECRET || secretFromQuery === env.CRON_SECRET;

    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await deliverScheduledCampaigns(cronActorId);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("Scheduled email campaigns failed.", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Scheduled email campaigns failed.",
      },
      { status: 500 },
    );
  }
}
