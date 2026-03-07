import { updateProfileAction } from "@/actions/member";
import { Card } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireUser } from "@/lib/auth";

export default async function ProfilePage() {
  const user = await requireUser();

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
          Profile
        </div>
        <h1 className="mt-3 font-display text-4xl font-bold text-slate-950">プロフィール設定</h1>
      </div>

      <Card>
        <form action={updateProfileAction} className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-500">氏名</span>
            <input
              name="name"
              defaultValue={user.name}
              className="rounded-2xl border border-black/10 px-4 py-3"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-500">肩書き</span>
            <input
              name="title"
              defaultValue={user.title}
              className="rounded-2xl border border-black/10 px-4 py-3"
            />
          </label>
          <label className="grid gap-2 md:col-span-2">
            <span className="text-sm font-semibold text-slate-500">会社名・屋号</span>
            <input
              name="company"
              defaultValue={user.company ?? ""}
              className="rounded-2xl border border-black/10 px-4 py-3"
              placeholder="任意"
            />
          </label>
          <div className="rounded-[24px] bg-black/[0.03] p-5 text-sm leading-7 text-slate-600 md:col-span-2">
            メールアドレスの変更とパスワード再設定は認証基盤側で管理しています。必要な場合は運営へご連絡ください。
          </div>
          <div className="md:col-span-2">
            <SubmitButton pendingLabel="更新中...">保存する</SubmitButton>
          </div>
        </form>
      </Card>
    </div>
  );
}
