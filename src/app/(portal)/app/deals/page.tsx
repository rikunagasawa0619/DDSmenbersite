import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { getPortalDealsSnapshot } from "@/lib/portal";

export default async function DealsPage() {
  const user = await requireUser();
  const snapshot = await getPortalDealsSnapshot(user);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
          Deals
        </div>
        <h1 className="mt-3 font-display text-4xl font-bold text-slate-950">お得情報</h1>
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
        {snapshot.deals.map((deal) => (
          <Card key={deal.id} className="flex h-full flex-col justify-between">
            <div>
              <Badge tone="accent">{deal.badge}</Badge>
              <h2 className="mt-4 font-display text-2xl font-bold text-slate-950">{deal.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{deal.summary}</p>
            </div>
            <div className="mt-6">
              <div className="text-3xl font-black text-[var(--color-primary)]">{deal.offer}</div>
              <Button className="mt-4">{deal.ctaLabel}</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
