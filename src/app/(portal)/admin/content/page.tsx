import { createAnnouncementAction, createBannerAction } from "@/actions/admin";
import { Card } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireAdmin } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/prisma";
import { listAnnouncements, listBanners, listCourses, listDeals, listFaqs, listTools } from "@/lib/repository";

export default async function AdminContentPage() {
  await requireAdmin();
  const [banners, announcements, deals, tools, faqs, courses] = await Promise.all([
    listBanners(),
    listAnnouncements(true),
    listDeals(),
    listTools(),
    listFaqs(),
    listCourses(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
          Content
        </div>
        <h1 className="mt-3 font-display text-4xl font-bold text-slate-950">コンテンツ管理</h1>
      </div>

      <section className="grid gap-5 xl:grid-cols-2">
        <Card>
          <h2 className="font-display text-2xl font-bold text-slate-950">テーマ設定 + 定型ブロック</h2>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            レッスンは `hero / rich_text / embed_video / embed_audio / checklist / accordion / cta / download / custom_html`
            のブロックで構成する前提です。更新担当者はフォーム入力中心、必要時だけ HTML を許可します。
          </p>
        </Card>
        <Card className="bg-[linear-gradient(135deg,#f5f1e8,#ffffff)]">
          <div className="font-display text-2xl font-bold text-slate-950">公開中の件数</div>
          <div className="mt-5 grid grid-cols-2 gap-4 text-sm text-slate-600">
            <div>バナー: {banners.length}</div>
            <div>お知らせ: {announcements.length}</div>
            <div>お得情報: {deals.length}</div>
            <div>ツール: {tools.length}</div>
            <div>FAQ: {faqs.length}</div>
            <div>コース: {courses.length}</div>
          </div>
        </Card>
      </section>

      {isDatabaseConfigured ? (
        <section className="grid gap-5 xl:grid-cols-2">
          <Card>
            <h2 className="font-display text-2xl font-bold text-slate-950">バナーを追加</h2>
            <form action={createBannerAction} className="mt-5 grid gap-3">
              <input name="eyebrow" placeholder="eyebrow" className="rounded-2xl border border-black/10 px-4 py-3" />
              <input name="title" placeholder="タイトル" className="rounded-2xl border border-black/10 px-4 py-3" />
              <input name="subtitle" placeholder="サブタイトル" className="rounded-2xl border border-black/10 px-4 py-3" />
              <div className="grid gap-3 md:grid-cols-2">
                <input name="ctaLabel" placeholder="CTAラベル" className="rounded-2xl border border-black/10 px-4 py-3" />
                <input name="ctaHref" placeholder="/app/bookings" className="rounded-2xl border border-black/10 px-4 py-3" />
              </div>
              <input name="accent" placeholder="from-sky-200 via-blue-100 to-indigo-200" className="rounded-2xl border border-black/10 px-4 py-3" />
              <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                <label><input type="checkbox" name="planCodes" value="HOBBY" /> Hobby</label>
                <label><input type="checkbox" name="planCodes" value="BIZ" /> Biz</label>
                <label><input type="checkbox" name="planCodes" value="PRO" /> Pro</label>
              </div>
              <SubmitButton pendingLabel="追加中...">バナーを追加</SubmitButton>
            </form>
          </Card>
          <Card>
            <h2 className="font-display text-2xl font-bold text-slate-950">お知らせを追加</h2>
            <form action={createAnnouncementAction} className="mt-5 grid gap-3">
              <input name="title" placeholder="タイトル" className="rounded-2xl border border-black/10 px-4 py-3" />
              <input name="summary" placeholder="概要" className="rounded-2xl border border-black/10 px-4 py-3" />
              <textarea name="body" placeholder="本文" className="min-h-32 rounded-2xl border border-black/10 px-4 py-3" />
              <input name="publishAt" type="datetime-local" className="rounded-2xl border border-black/10 px-4 py-3" />
              <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                <label><input type="checkbox" name="planCodes" value="HOBBY" /> Hobby</label>
                <label><input type="checkbox" name="planCodes" value="BIZ" /> Biz</label>
                <label><input type="checkbox" name="planCodes" value="PRO" /> Pro</label>
              </div>
              <SubmitButton pendingLabel="追加中...">お知らせを追加</SubmitButton>
            </form>
          </Card>
        </section>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <h2 className="font-display text-2xl font-bold text-slate-950">バナー / お知らせ</h2>
          <div className="mt-5 space-y-3">
            {banners.map((banner) => (
              <div key={banner.id} className="rounded-[24px] border border-black/6 p-4">
                <div className="font-semibold text-slate-950">{banner.title}</div>
                <div className="mt-2 text-sm text-slate-600">{banner.subtitle}</div>
              </div>
            ))}
            {announcements.map((announcement) => (
              <div key={announcement.id} className="rounded-[24px] border border-black/6 p-4">
                <div className="font-semibold text-slate-950">{announcement.title}</div>
                <div className="mt-2 text-sm text-slate-600">{announcement.summary}</div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="font-display text-2xl font-bold text-slate-950">教材 / FAQ</h2>
          <div className="mt-5 space-y-3">
            {courses.map((course) => (
              <div key={course.id} className="rounded-[24px] border border-black/6 p-4">
                <div className="font-semibold text-slate-950">{course.title}</div>
                <div className="mt-2 text-sm text-slate-600">{course.summary}</div>
              </div>
            ))}
            {faqs.slice(0, 2).map((faq) => (
              <div key={faq.id} className="rounded-[24px] border border-black/6 p-4">
                <div className="font-semibold text-slate-950">{faq.question}</div>
                <div className="mt-2 text-sm text-slate-600">{faq.answer}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
