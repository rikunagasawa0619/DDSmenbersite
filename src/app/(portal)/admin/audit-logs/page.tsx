import { Card } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { listAuditLogs } from "@/lib/repository";
import { formatDate } from "@/lib/utils";

export default async function AdminAuditLogsPage() {
  await requireAdmin();
  const logs = await listAuditLogs(150);

  return (
    <div className="space-y-8">
      <div>
        <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
          Audit Logs
        </div>
        <h1 className="mt-3 font-display text-4xl font-bold text-slate-950">監査ログ</h1>
      </div>

      <div className="grid gap-4">
        {logs.length === 0 ? (
          <Card>監査ログはまだありません。</Card>
        ) : (
          logs.map((log) => (
            <Card key={log.id}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-[var(--color-primary)]">{log.action}</div>
                  <div className="font-display text-xl font-bold text-slate-950">
                    {log.targetType} / {log.targetId}
                  </div>
                  <div className="text-sm text-slate-600">
                    実行者: {log.actorName} ({log.actorEmail})
                  </div>
                </div>
                <div className="rounded-[20px] bg-black/[0.03] px-4 py-3 text-sm text-slate-600">
                  {formatDate(log.createdAt)}
                </div>
              </div>
              {log.metadata ? (
                <pre className="mt-4 overflow-x-auto rounded-[20px] bg-[#0f172a] p-4 text-xs leading-6 text-white/85">
                  {JSON.stringify(log.metadata, null, 2)}
                </pre>
              ) : null}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
