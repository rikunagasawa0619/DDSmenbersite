import { RichHtml } from "@/components/content/rich-html";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { getPortalFaqSnapshot } from "@/lib/portal";

export default async function FaqPage() {
  const user = await requireUser();
  const snapshot = await getPortalFaqSnapshot(user);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
          FAQ
        </div>
        <h1 className="mt-3 font-display text-4xl font-bold text-slate-950">よくある質問</h1>
      </div>
      <div className="grid gap-4">
        {snapshot.faqs.map((faq) => (
          <Card key={faq.id}>
            <div className="text-sm font-semibold text-[var(--color-primary)]">{faq.category}</div>
            <h2 className="mt-3 font-display text-2xl font-bold text-slate-950">{faq.question}</h2>
            <RichHtml html={faq.answer} className="mt-4 text-sm leading-7" />
          </Card>
        ))}
      </div>
    </div>
  );
}
