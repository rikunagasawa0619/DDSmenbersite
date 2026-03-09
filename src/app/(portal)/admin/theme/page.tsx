import { saveThemeSettingsAction } from "@/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireAdmin } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/prisma";
import { getThemeSettings } from "@/lib/repository";

const presetColors = ["#1238c6", "#f6c453", "#f7f5ef", "#0f172a", "#15803d", "#b91c1c"];

export default async function AdminThemePage() {
  await requireAdmin();
  const theme = await getThemeSettings();

  return (
    <div className="space-y-8">
      <div>
        <div className="text-sm font-semibold tracking-[0.18em] text-[var(--color-primary)]">
          テーマ設定
        </div>
        <h1 className="mt-3 font-display text-4xl font-bold text-slate-950">
          色とブランド表現を崩れない形で管理
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          カラーコードだけでなく色見本を確認しながら編集できます。会員サイトと管理画面の印象を崩しにくい構成にしています。
        </p>
      </div>

      <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="overflow-hidden bg-[#10182b] text-white">
          <div className="text-sm font-semibold text-slate-300">ブランドプレビュー</div>
          <div className="mt-5 rounded-[28px] border border-white/10 bg-white/6 p-6">
            <Badge tone="brand">DDS Member Portal</Badge>
            <h2 className="mt-4 font-display text-3xl font-bold">{theme.brandName}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-100">{theme.heroHeadline}</p>
            <div className="mt-6 grid gap-3">
              {[
                { label: "メインカラー", value: theme.primaryColor },
                { label: "アクセント", value: theme.accentColor },
                { label: "背景", value: theme.surfaceColor },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-[22px] bg-white/8 p-4">
                  <div>
                    <div className="text-xs tracking-[0.18em] text-slate-300">{item.label}</div>
                    <div className="mt-2 text-lg font-bold">{item.value}</div>
                  </div>
                  <div
                    className="h-12 w-12 rounded-2xl border border-white/15"
                    style={{ backgroundColor: item.value }}
                  />
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          {isDatabaseConfigured ? (
            <form action={saveThemeSettingsAction} className="grid gap-5">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-500">ブランド名</span>
                  <input name="brandName" defaultValue={theme.brandName} className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-500">ロゴ表記</span>
                  <input name="logoWordmark" defaultValue={theme.logoWordmark} className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
                </label>
              </div>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-500">ヒーロー見出し</span>
                <textarea name="heroHeadline" defaultValue={theme.heroHeadline} className="min-h-24 rounded-2xl border border-black/10 bg-white px-4 py-3" />
              </label>

              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { name: "primaryColor", label: "メインカラー", value: theme.primaryColor },
                  { name: "accentColor", label: "アクセントカラー", value: theme.accentColor },
                  { name: "surfaceColor", label: "背景色", value: theme.surfaceColor },
                ].map((field) => (
                  <div key={field.name} className="rounded-[24px] border border-black/6 p-4">
                    <div className="text-sm font-semibold text-slate-500">{field.label}</div>
                    <div className="mt-4 flex items-center gap-3">
                      <input
                        type="color"
                        value={field.value}
                        readOnly
                        className="h-14 w-14 rounded-2xl border border-black/10 bg-transparent"
                      />
                      <input
                        name={field.name}
                        defaultValue={field.value}
                        className="min-w-0 flex-1 rounded-2xl border border-black/10 bg-white px-4 py-3"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-[24px] border border-black/6 p-4">
                <div className="text-sm font-semibold text-slate-500">よく使う色見本</div>
                <div className="mt-4 flex flex-wrap gap-3">
                  {presetColors.map((color) => (
                    <div key={color} className="grid gap-2 text-center text-xs font-semibold text-slate-500">
                      <div className="h-12 w-12 rounded-2xl border border-black/10" style={{ backgroundColor: color }} />
                      <div>{color}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-500">サポートメール</span>
                  <input name="supportEmail" defaultValue={theme.supportEmail} className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-500">利用規約メモ</span>
                  <textarea name="termsNotice" defaultValue={theme.termsNotice} className="min-h-24 rounded-2xl border border-black/10 bg-white px-4 py-3" />
                </label>
              </div>

              <SubmitButton pendingLabel="保存中...">テーマ設定を保存</SubmitButton>
            </form>
          ) : (
            <div className="rounded-[24px] border border-dashed border-black/10 p-5 text-sm text-slate-500">
              データベース接続後にテーマ設定を保存できます。
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}
