import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { getPortalSnapshot } from "@/lib/portal";
import { formatDate } from "@/lib/utils";

export default async function EventsPage() {
  const user = await requireUser();
  const snapshot = await getPortalSnapshot(user);
  const events = snapshot.offerings.filter((offering) => offering.offeringType === "event");

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
          Events
        </div>
        <h1 className="mt-3 font-display text-4xl font-bold text-slate-950">イベント</h1>
      </div>
      <div className="grid gap-5">
        {events.map((event) => (
          <Card key={event.id}>
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <Badge tone="brand">{event.priceLabel}</Badge>
                  <Badge tone={event.counts.isFull ? "warning" : "success"}>
                    残{event.counts.remaining}
                  </Badge>
                </div>
                <h2 className="mt-4 font-display text-2xl font-bold text-slate-950">{event.title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">{event.description}</p>
              </div>
              <div className="rounded-[24px] bg-black/[0.03] p-5 lg:min-w-[280px]">
                <div className="text-sm font-semibold text-slate-500">開催情報</div>
                <div className="mt-2 text-sm text-slate-700">{formatDate(event.startsAt)}</div>
                <div className="mt-1 text-sm text-slate-700">{event.locationLabel}</div>
                <div className="mt-1 text-sm text-slate-700">講師: {event.host}</div>
                <div className="mt-4 text-sm font-semibold text-[var(--color-primary)]">
                  {event.eligibility.allowed
                    ? event.eligibility.waitlist
                      ? "満席のため待機申込"
                      : "申込可能"
                    : event.eligibility.reason}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
