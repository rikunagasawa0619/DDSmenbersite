import { saveThemeSettingsAction } from "@/actions/admin";
import { Card } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireAdmin } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/prisma";
import { getThemeSettings } from "@/lib/repository";

export default async function AdminThemePage() {
  await requireAdmin();
  const theme = await getThemeSettings();

  return (
    <div className="space-y-8">
      <div>
        <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
          Theme
        </div>
        <h1 className="mt-3 font-display text-4xl font-bold text-slate-950">テーマ設定</h1>
      </div>

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="bg-[#111b2f] text-white">
          <div className="text-sm font-semibold text-white/65">Brand Preview</div>
          <h2 className="mt-4 font-display text-3xl font-bold">{theme.brandName}</h2>
          <p className="mt-3 text-sm leading-7 text-white/76">
            ロゴ、色、表記、サポートメール、利用規約文言はここでまとめて調整する想定です。
          </p>
          <div className="mt-6 grid gap-3">
            <div className="rounded-[22px] bg-white/8 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-white/45">Primary</div>
              <div className="mt-2 text-lg font-bold">{theme.primaryColor}</div>
            </div>
            <div className="rounded-[22px] bg-white/8 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-white/45">Accent</div>
              <div className="mt-2 text-lg font-bold">{theme.accentColor}</div>
            </div>
          </div>
        </Card>
        <Card>
          {isDatabaseConfigured ? (
            <form action={saveThemeSettingsAction} className="grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-500">ブランド名</span>
                <input name="brandName" defaultValue={theme.brandName} className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-500">ヒーロー見出し</span>
                <textarea name="heroHeadline" defaultValue={theme.heroHeadline} className="min-h-24 rounded-2xl border border-black/10 bg-white px-4 py-3" />
              </label>
              <div className="grid gap-4 md:grid-cols-3">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-500">Primary</span>
                  <input name="primaryColor" defaultValue={theme.primaryColor} className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-500">Accent</span>
                  <input name="accentColor" defaultValue={theme.accentColor} className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-500">Surface</span>
                  <input name="surfaceColor" defaultValue={theme.surfaceColor} className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-500">ロゴ表記</span>
                  <input name="logoWordmark" defaultValue={theme.logoWordmark} className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-500">サポートメール</span>
                  <input name="supportEmail" defaultValue={theme.supportEmail} className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
                </label>
              </div>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-500">利用規約表示</span>
                <textarea name="termsNotice" defaultValue={theme.termsNotice} className="min-h-20 rounded-2xl border border-black/10 bg-white px-4 py-3" />
              </label>
              <SubmitButton pendingLabel="保存中...">テーマ設定を保存</SubmitButton>
            </form>
          ) : (
            <div className="rounded-[24px] border border-dashed border-black/10 p-5 text-sm text-slate-500">
              `DATABASE_URL` を設定するとテーマ設定を永続保存できます。
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}
