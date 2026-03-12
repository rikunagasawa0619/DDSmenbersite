import { ExternalLink } from "lucide-react";

import { RichHtml } from "@/components/content/rich-html";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { getPortalToolsSnapshot } from "@/lib/portal";

export default async function ToolsPage() {
  const user = await requireUser();
  const snapshot = await getPortalToolsSnapshot(user);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
          Tools
        </div>
        <h1 className="mt-3 font-display text-4xl font-bold text-slate-950">ツール</h1>
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
        {snapshot.tools.map((tool) => (
          <Card key={tool.id}>
            <h2 className="font-display text-2xl font-bold text-slate-950">{tool.title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{tool.summary}</p>
            <RichHtml html={tool.body} className="mt-4 text-sm leading-7 text-slate-500" />
            <a
              href={tool.href}
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)]"
            >
              開く
              <ExternalLink className="h-4 w-4" />
            </a>
          </Card>
        ))}
      </div>
    </div>
  );
}
