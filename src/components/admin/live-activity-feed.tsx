"use client";

import { useEffect, useState } from "react";
import { Activity, WifiOff } from "lucide-react";

import { Card } from "@/components/ui/card";
import type { AuditLogEntry } from "@/lib/types";
import { formatDate } from "@/lib/utils";

type LiveActivityFeedProps = {
  initialLogs: AuditLogEntry[];
};

export function LiveActivityFeed({ initialLogs }: LiveActivityFeedProps) {
  const [logs, setLogs] = useState(initialLogs);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const source = new EventSource("/api/admin/notifications/stream");

    source.onopen = () => {
      setConnected(true);
    };

    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as { logs?: AuditLogEntry[] };
        if (payload.logs) {
          setLogs(payload.logs);
        }
      } catch (error) {
        console.error("Failed to parse live activity payload.", error);
      }
    };

    source.onerror = () => {
      setConnected(false);
      source.close();
    };

    return () => {
      source.close();
    };
  }, []);

  return (
    <Card>
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="dds-kicker text-slate-500">リアルタイム通知</div>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-[-0.08em] text-slate-950">
            最新アクティビティ
          </h2>
        </div>
        <div
          className={
            connected
              ? "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold"
              : "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold"
          }
          style={
            connected
              ? {
                  borderColor: "color-mix(in srgb, var(--color-success) 34%, var(--color-outline))",
                  background: "color-mix(in srgb, var(--color-success) 18%, var(--color-surface-raised))",
                  color: "color-mix(in srgb, var(--color-success) 76%, var(--color-foreground))",
                }
              : {
                  borderColor: "var(--color-outline)",
                  background: "var(--color-surface-inset)",
                  color: "var(--color-muted-strong)",
                }
          }
        >
          {connected ? <Activity className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
          {connected ? "接続中" : "再接続待ち"}
        </div>
      </div>
      <div aria-live="polite" className="mt-6 grid gap-3">
        {logs.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-black/10 p-5 text-sm text-slate-500">
            新しいアクティビティはまだありません。
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="rounded-[24px] border border-black/8 bg-black/[0.02] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="font-semibold text-slate-950">{log.action}</div>
                <div className="text-xs text-slate-500">{formatDate(log.createdAt)}</div>
              </div>
              <div className="mt-2 text-sm text-slate-600">
                {log.actorName} / {log.targetType}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
