import { NextResponse } from "next/server";

import { getCurrentUserContext } from "@/lib/auth";
import { listAuditLogs } from "@/lib/repository";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { member } = await getCurrentUserContext();

  if (!member || !["super_admin", "staff"].includes(member.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const encoder = new TextEncoder();
  let timer: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream({
    start(controller) {
      const writeSnapshot = async () => {
        const logs = await listAuditLogs(6);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ logs })}\n\n`),
        );
      };

      void writeSnapshot();
      timer = setInterval(() => {
        void writeSnapshot();
      }, 20_000);

      const abortListener = () => {
        if (timer) {
          clearInterval(timer);
        }
        controller.close();
      };

      request.signal.addEventListener("abort", abortListener);
    },
    cancel() {
      if (timer) {
        clearInterval(timer);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
