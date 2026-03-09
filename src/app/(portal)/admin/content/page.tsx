import Link from "next/link";
import type { ComponentType } from "react";
import { BookOpenText, HelpCircle, Megaphone, PanelsTopLeft, Sparkles, Wrench } from "lucide-react";

import {
  createAnnouncementAction,
  createBannerAction,
  createCourseAction,
  createCourseLessonAction,
  createCourseModuleAction,
  createDealAction,
  createFaqAction,
  createToolItemAction,
} from "@/actions/admin";
import { getMinimumPlanCodeFromAudience, labelPlan } from "@/lib/admin-display";
import { bannerAccentOptions } from "@/lib/banner-accent";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ImageUploadField } from "@/components/ui/image-upload-field";
import { Modal } from "@/components/ui/modal";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireAdmin } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/prisma";
import {
  listAnnouncements,
  listBanners,
  listCourses,
  listDeals,
  listFaqs,
  listTools,
} from "@/lib/repository";

type ContentPageProps = {
  searchParams: Promise<{
    create?: string;
    courseId?: string;
    moduleId?: string;
  }>;
};

const publishStatusOptions = [
  { value: "PUBLISHED", label: "公開" },
  { value: "DRAFT", label: "下書き" },
  { value: "ARCHIVED", label: "アーカイブ" },
];

const minimumPlanOptions = [
  { value: "HOBBY", label: "DDS Hobby 以上" },
  { value: "BIZ", label: "DDS Biz 以上" },
  { value: "PRO", label: "DDS Pro のみ" },
];

function CreateLink({
  href,
  label,
  tone = "primary",
}: {
  href: string;
  label: string;
  tone?: "primary" | "secondary";
}) {
  return (
    <Link
      href={href}
      className={
        tone === "primary"
          ? "inline-flex items-center justify-center rounded-full bg-[var(--color-primary)] px-5 py-3 font-display text-xs font-extrabold uppercase tracking-[0.16em] text-white shadow-[0_18px_40px_rgba(18,56,198,0.22)] transition hover:opacity-90"
          : "inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-5 py-3 font-display text-xs font-extrabold uppercase tracking-[0.16em] text-slate-700 transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
      }
    >
      {label}
    </Link>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="dds-kicker text-slate-500">{label}</div>
          <div className="mt-4 font-display text-5xl font-extrabold tracking-[-0.08em] text-slate-950">{value}</div>
        </div>
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-[22px] bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
}

function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-black/6 pb-5 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h2 className="font-display text-2xl font-extrabold tracking-[-0.08em] text-slate-950">{title}</h2>
        {description ? <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

function ItemCard({
  title,
  body,
  badge,
  imageUrl,
}: {
  title: string;
  body: string;
  badge?: string;
  imageUrl?: string;
}) {
  return (
    <div className="rounded-[28px] border border-black/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(248,244,236,0.88))] p-4 shadow-[0_16px_36px_rgba(15,23,42,0.04)]">
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt={title} className="mb-4 h-40 w-full rounded-[20px] object-cover" />
      ) : null}
      {badge ? <Badge tone="accent">{badge}</Badge> : null}
      <div className="mt-3 font-display text-xl font-extrabold tracking-[-0.06em] text-slate-950">{title}</div>
      <p className="mt-2 text-sm leading-7 text-slate-600">{body}</p>
    </div>
  );
}

function ContentModal({
  create,
  closeHref,
  courses,
  modules,
  selectedCourseId,
  selectedModuleId,
}: {
  create?: string;
  closeHref: string;
  courses: Array<{ id: string; title: string }>;
  modules: Array<{ id: string; title: string; courseTitle: string }>;
  selectedCourseId?: string;
  selectedModuleId?: string;
}) {
  if (!create) {
    return null;
  }

  if (create === "banner") {
    return (
      <Modal
        title="バナーを追加"
        closeHref={closeHref}
        size="lg"
      >
        <form action={createBannerAction} className="dds-admin-form grid gap-5" encType="multipart/form-data">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-500">帯見出し</span>
              <input name="eyebrow" placeholder="今月の注目" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-500">背景カラー</span>
              <select name="accent" defaultValue="sky" className="rounded-2xl border border-black/10 bg-white px-4 py-3">
                {bannerAccentOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-500">見出し</span>
            <input name="title" placeholder="例: 今週のライブ講義" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-500">説明文</span>
            <textarea name="subtitle" placeholder="会員に伝えたい要点を短く記載" className="min-h-28 rounded-2xl border border-black/10 bg-white px-4 py-3" />
          </label>
          <ImageUploadField name="imageFile" label="バナー画像" hint="Cloudflare R2 に保存します。推奨 1600x900 / 5MB以内" />
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-500">ボタン文言</span>
              <input name="ctaLabel" placeholder="詳細を見る" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-500">遷移先</span>
              <input name="ctaHref" placeholder="/app/bookings" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <select name="minimumPlanCode" className="rounded-2xl border border-black/10 bg-white px-4 py-3">
              {minimumPlanOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <select name="publishStatus" defaultValue="PUBLISHED" className="rounded-2xl border border-black/10 bg-white px-4 py-3">
              {publishStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end">
            <SubmitButton pendingLabel="保存中...">バナーを保存</SubmitButton>
          </div>
        </form>
      </Modal>
    );
  }

  if (create === "announcement") {
    return (
      <Modal
        title="お知らせを追加"
        closeHref={closeHref}
        size="xl"
      >
        <form action={createAnnouncementAction} className="dds-admin-form grid gap-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-500">タイトル</span>
              <input name="title" placeholder="例: 3月のアップデート" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-500">公開日時</span>
              <input name="publishAt" type="datetime-local" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
            </label>
          </div>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-500">一覧用の要約</span>
            <textarea name="summary" placeholder="一覧で表示する短い説明" className="min-h-24 rounded-2xl border border-black/10 bg-white px-4 py-3" />
          </label>
          <div className="grid gap-2">
            <span className="text-sm font-semibold text-slate-500">本文</span>
            <RichTextEditor name="body" placeholder="見出しや箇条書きを使って、読みやすくお知らせを作成できます。" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <select name="minimumPlanCode" className="rounded-2xl border border-black/10 bg-white px-4 py-3">
              {minimumPlanOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <select name="publishStatus" defaultValue="PUBLISHED" className="rounded-2xl border border-black/10 bg-white px-4 py-3">
              {publishStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end">
            <SubmitButton pendingLabel="保存中...">お知らせを保存</SubmitButton>
          </div>
        </form>
      </Modal>
    );
  }

  if (create === "deal") {
    return (
      <Modal title="お得情報を追加" closeHref={closeHref} size="xl">
        <form action={createDealAction} className="dds-admin-form grid gap-5">
          <div className="grid gap-4 md:grid-cols-2">
            <input name="title" placeholder="タイトル" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
            <input name="badge" placeholder="例: 会員限定" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
          </div>
          <textarea name="summary" placeholder="カード用の要約" className="min-h-24 rounded-2xl border border-black/10 bg-white px-4 py-3" />
          <div className="grid gap-2">
            <span className="text-sm font-semibold text-slate-500">詳細本文</span>
            <RichTextEditor name="body" placeholder="特典の内容、対象条件、申込方法を整理して記載" />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <input name="offer" placeholder="例: 初月50%OFF" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
            <input name="ctaLabel" placeholder="ボタン文言" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
            <input name="ctaHref" placeholder="遷移先 URL" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <select name="minimumPlanCode" className="rounded-2xl border border-black/10 bg-white px-4 py-3">
              {minimumPlanOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <select name="publishStatus" defaultValue="PUBLISHED" className="rounded-2xl border border-black/10 bg-white px-4 py-3">
              {publishStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end">
            <SubmitButton pendingLabel="保存中...">お得情報を保存</SubmitButton>
          </div>
        </form>
      </Modal>
    );
  }

  if (create === "tool") {
    return (
      <Modal title="ツールを追加" closeHref={closeHref} size="xl">
        <form action={createToolItemAction} className="dds-admin-form grid gap-5">
          <input name="title" placeholder="ツール名" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
          <textarea name="summary" placeholder="一覧用の短い概要" className="min-h-24 rounded-2xl border border-black/10 bg-white px-4 py-3" />
          <div className="grid gap-2">
            <span className="text-sm font-semibold text-slate-500">詳細本文</span>
            <RichTextEditor name="body" placeholder="おすすめ理由、使い方、向いている人を整理して記載" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <input name="href" placeholder="ツールURL（任意）" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
            <select name="minimumPlanCode" className="rounded-2xl border border-black/10 bg-white px-4 py-3">
              {minimumPlanOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end">
            <SubmitButton pendingLabel="保存中...">ツールを保存</SubmitButton>
          </div>
        </form>
      </Modal>
    );
  }

  if (create === "faq") {
    return (
      <Modal title="FAQ を追加" closeHref={closeHref} size="xl">
        <form action={createFaqAction} className="dds-admin-form grid gap-5">
          <div className="grid gap-4 md:grid-cols-2">
            <input name="category" placeholder="カテゴリ" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
            <input name="question" placeholder="質問" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
          </div>
          <div className="grid gap-2">
            <span className="text-sm font-semibold text-slate-500">回答</span>
            <RichTextEditor name="answer" placeholder="手順や注意点を読みやすく記載" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <select name="minimumPlanCode" className="rounded-2xl border border-black/10 bg-white px-4 py-3">
              {minimumPlanOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <select name="publishStatus" defaultValue="PUBLISHED" className="rounded-2xl border border-black/10 bg-white px-4 py-3">
              {publishStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end">
            <SubmitButton pendingLabel="保存中...">FAQ を保存</SubmitButton>
          </div>
        </form>
      </Modal>
    );
  }

  if (create === "course") {
    return (
      <Modal title="コースを追加" closeHref={closeHref} size="lg">
        <form action={createCourseAction} className="dds-admin-form grid gap-5" encType="multipart/form-data">
          <div className="grid gap-4 md:grid-cols-2">
            <input name="title" placeholder="コース名" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
            <input name="slug" placeholder="URL スラッグ（空欄で自動生成）" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
          </div>
          <textarea name="summary" placeholder="コースの概要" className="min-h-28 rounded-2xl border border-black/10 bg-white px-4 py-3" />
          <div className="grid gap-4 md:grid-cols-2">
            <input name="heroNote" placeholder="例: 最初に受けてほしい講座" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
            <input name="estimatedHours" placeholder="想定学習時間 例: 3時間" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
          </div>
          <ImageUploadField name="thumbnailFile" label="コースサムネイル" hint="カード表示用。推奨 1200x675 / 5MB以内" />
          <div className="grid gap-4 md:grid-cols-2">
            <select name="minimumPlanCode" className="rounded-2xl border border-black/10 bg-white px-4 py-3">
              {minimumPlanOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <select name="publishStatus" defaultValue="PUBLISHED" className="rounded-2xl border border-black/10 bg-white px-4 py-3">
              {publishStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end">
            <SubmitButton pendingLabel="保存中...">コースを保存</SubmitButton>
          </div>
        </form>
      </Modal>
    );
  }

  if (create === "module") {
    return (
      <Modal title="章を追加" closeHref={closeHref} size="md">
        <form action={createCourseModuleAction} className="dds-admin-form grid gap-5">
          <select
            name="courseId"
            defaultValue={selectedCourseId ?? ""}
            className="rounded-2xl border border-black/10 bg-white px-4 py-3"
          >
            <option value="">コースを選択</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>{course.title}</option>
            ))}
          </select>
          <input name="title" placeholder="章タイトル" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
          <input name="sortOrder" type="number" placeholder="表示順 例: 0 / 10 / 20" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
          <div className="flex justify-end">
            <SubmitButton pendingLabel="保存中...">章を保存</SubmitButton>
          </div>
        </form>
      </Modal>
    );
  }

  if (create === "lesson") {
    return (
      <Modal title="講義を追加" closeHref={closeHref} size="xl">
        <form action={createCourseLessonAction} className="dds-admin-form grid gap-5">
          <select
            name="moduleId"
            defaultValue={selectedModuleId ?? ""}
            className="rounded-2xl border border-black/10 bg-white px-4 py-3"
          >
            <option value="">章を選択</option>
            {modules.map((module) => (
              <option key={module.id} value={module.id}>{module.courseTitle} / {module.title}</option>
            ))}
          </select>
          <div className="grid gap-4 md:grid-cols-2">
            <input name="title" placeholder="講義タイトル" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
            <input name="slug" placeholder="URL スラッグ（空欄で自動生成）" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
          </div>
          <textarea name="summary" placeholder="一覧に表示する講義概要" className="min-h-24 rounded-2xl border border-black/10 bg-white px-4 py-3" />
          <div className="grid gap-4 md:grid-cols-3">
            <select name="lessonType" className="rounded-2xl border border-black/10 bg-white px-4 py-3">
              <option value="VIDEO">動画講義</option>
              <option value="ARTICLE">記事講義</option>
              <option value="PODCAST">ポッドキャスト</option>
            </select>
            <input name="duration" placeholder="再生時間 例: 12分" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
            <input name="mediaUrl" placeholder="動画 / 音声 URL（任意）" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
          </div>
          <div className="grid gap-2">
            <span className="text-sm font-semibold text-slate-500">本文</span>
            <RichTextEditor name="body" placeholder="記事本文や補足説明を作成します。" />
          </div>
          <textarea name="checklist" placeholder="確認ポイントを1行に1つずつ入力" className="min-h-24 rounded-2xl border border-black/10 bg-white px-4 py-3" />
          <div className="grid gap-4 md:grid-cols-2">
            <input name="ctaLabel" placeholder="最後に表示するボタン文言" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
            <input name="ctaHref" placeholder="最後に遷移する URL" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
          </div>
          <textarea name="ctaBody" placeholder="最後に表示する案内文" className="min-h-20 rounded-2xl border border-black/10 bg-white px-4 py-3" />
          <input name="sortOrder" type="number" placeholder="表示順 例: 0 / 10 / 20" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
          <div className="flex justify-end">
            <SubmitButton pendingLabel="保存中...">講義を保存</SubmitButton>
          </div>
        </form>
      </Modal>
    );
  }

  return null;
}

export default async function AdminContentPage({ searchParams }: ContentPageProps) {
  await requireAdmin();
  const params = await searchParams;
  const [banners, announcements, deals, tools, faqs, courses] = await Promise.all([
    listBanners(true),
    listAnnouncements(true),
    listDeals(true),
    listTools(true),
    listFaqs(true),
    listCourses(true),
  ]);
  const modules = courses.flatMap((course) =>
    course.modules.map((module) => ({
      id: module.id,
      title: module.title,
      courseTitle: course.title,
    })),
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="dds-kicker text-[var(--color-primary)]">コンテンツ管理</div>
          <h1 className="mt-3 font-display text-4xl font-extrabold tracking-[-0.08em] text-slate-950">コンテンツ</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <CreateLink href="/admin/content?create=course" label="新しいコース" />
          <CreateLink href="/admin/content?create=banner" label="新しいバナー" tone="secondary" />
          <CreateLink href="/admin/content?create=announcement" label="お知らせを作成" tone="secondary" />
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <SummaryCard label="バナー" value={banners.length} icon={PanelsTopLeft} />
        <SummaryCard label="お知らせ" value={announcements.length} icon={Megaphone} />
        <SummaryCard label="お得情報" value={deals.length} icon={Sparkles} />
        <SummaryCard label="ツール" value={tools.length} icon={Wrench} />
        <SummaryCard label="FAQ" value={faqs.length} icon={HelpCircle} />
        <SummaryCard label="教材コース" value={courses.length} icon={BookOpenText} />
      </section>

      {!isDatabaseConfigured ? (
        <Card>
          <div className="rounded-[24px] border border-dashed border-black/10 p-5 text-sm leading-7 text-slate-500">
            データベース接続後にコンテンツ編集が有効になります。
          </div>
        </Card>
      ) : (
        <>
          <Card className="space-y-6">
            <SectionHeader
              title="クイック作成"
            />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Link href="/admin/content?create=banner" className="rounded-[26px] border border-black/8 bg-white p-5 transition hover:-translate-y-0.5 hover:border-[var(--color-primary)]/20 hover:shadow-[0_18px_40px_rgba(18,56,198,0.08)]">
                <PanelsTopLeft className="h-6 w-6 text-[var(--color-primary)]" />
                <div className="mt-4 font-display text-xl font-bold text-slate-950">バナーを追加</div>
                <p className="mt-2 text-sm leading-7 text-slate-600">ホーム上部の訴求カード</p>
              </Link>
              <Link href="/admin/content?create=announcement" className="rounded-[26px] border border-black/8 bg-white p-5 transition hover:-translate-y-0.5 hover:border-[var(--color-primary)]/20 hover:shadow-[0_18px_40px_rgba(18,56,198,0.08)]">
                <Megaphone className="h-6 w-6 text-[var(--color-primary)]" />
                <div className="mt-4 font-display text-xl font-bold text-slate-950">お知らせを作成</div>
                <p className="mt-2 text-sm leading-7 text-slate-600">記事形式のお知らせ</p>
              </Link>
              <Link href="/admin/content?create=deal" className="rounded-[26px] border border-black/8 bg-white p-5 transition hover:-translate-y-0.5 hover:border-[var(--color-primary)]/20 hover:shadow-[0_18px_40px_rgba(18,56,198,0.08)]">
                <Sparkles className="h-6 w-6 text-[var(--color-primary)]" />
                <div className="mt-4 font-display text-xl font-bold text-slate-950">お得情報を追加</div>
                <p className="mt-2 text-sm leading-7 text-slate-600">特典やキャンペーン</p>
              </Link>
              <Link href="/admin/content?create=tool" className="rounded-[26px] border border-black/8 bg-white p-5 transition hover:-translate-y-0.5 hover:border-[var(--color-primary)]/20 hover:shadow-[0_18px_40px_rgba(18,56,198,0.08)]">
                <Wrench className="h-6 w-6 text-[var(--color-primary)]" />
                <div className="mt-4 font-display text-xl font-bold text-slate-950">ツールを追加</div>
                <p className="mt-2 text-sm leading-7 text-slate-600">外部リンクと配布物</p>
              </Link>
            </div>
          </Card>

          <section className="grid gap-5 xl:grid-cols-2">
            <Card className="space-y-6">
              <SectionHeader
                title="ホームに出るコンテンツ"
                action={<CreateLink href="/admin/content?create=banner" label="バナー追加" tone="secondary" />}
              />
              <div className="grid gap-4 md:grid-cols-2">
                {banners.length === 0 ? (
                  <div className="rounded-[24px] border border-dashed border-black/10 p-5 text-sm text-slate-500 md:col-span-2">
                    まだバナーがありません。
                  </div>
                ) : (
                  banners.slice(0, 4).map((banner) => (
                    <ItemCard
                      key={banner.id}
                      title={banner.title}
                      body={banner.subtitle}
                      badge={labelPlan(getMinimumPlanCodeFromAudience(banner.audience?.planCodes))}
                      imageUrl={banner.imageUrl}
                    />
                  ))
                )}
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="font-semibold text-slate-900">お知らせ一覧</div>
                  <CreateLink href="/admin/content?create=announcement" label="お知らせ追加" tone="secondary" />
                </div>
                {announcements.length === 0 ? (
                  <div className="rounded-[24px] border border-dashed border-black/10 p-5 text-sm text-slate-500">
                    まだお知らせがありません。
                  </div>
                ) : (
                  announcements.slice(0, 5).map((item) => (
                    <div key={item.id} className="rounded-[22px] border border-black/8 bg-white px-4 py-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="font-semibold text-slate-950">{item.title}</div>
                        <Badge tone="brand">{labelPlan(getMinimumPlanCodeFromAudience(item.audience?.planCodes))}</Badge>
                      </div>
                      <p className="mt-2 text-sm leading-7 text-slate-600">{item.summary}</p>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card className="space-y-6">
              <SectionHeader
                title="特典・ツール・FAQ"
                action={<CreateLink href="/admin/content?create=faq" label="FAQ追加" tone="secondary" />}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold text-slate-900">お得情報</div>
                    <CreateLink href="/admin/content?create=deal" label="追加" tone="secondary" />
                  </div>
                  {deals.slice(0, 3).map((deal) => (
                    <ItemCard key={deal.id} title={deal.title} body={deal.summary} badge={deal.badge} />
                  ))}
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold text-slate-900">ツール</div>
                    <CreateLink href="/admin/content?create=tool" label="追加" tone="secondary" />
                  </div>
                  {tools.slice(0, 3).map((tool) => (
                    <ItemCard key={tool.id} title={tool.title} body={tool.summary} />
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <div className="font-semibold text-slate-900">FAQ</div>
                {faqs.length === 0 ? (
                  <div className="rounded-[24px] border border-dashed border-black/10 p-5 text-sm text-slate-500">
                    まだ FAQ がありません。
                  </div>
                ) : (
                  faqs.slice(0, 4).map((faq) => (
                    <div key={faq.id} className="rounded-[22px] border border-black/8 bg-white px-4 py-4">
                      <div className="text-xs font-semibold tracking-[0.18em] text-slate-400">{faq.category}</div>
                      <div className="mt-2 font-semibold text-slate-950">{faq.question}</div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </section>

          <Card className="space-y-6">
            <SectionHeader
              title="教材の階層構造"
              action={
                <div className="flex flex-wrap gap-3">
                  <CreateLink href="/admin/content?create=course" label="コース追加" tone="secondary" />
                  <CreateLink href="/admin/content?create=module" label="章追加" tone="secondary" />
                  <CreateLink href="/admin/content?create=lesson" label="講義追加" tone="secondary" />
                </div>
              }
            />
            {courses.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-black/10 p-6 text-sm leading-7 text-slate-500">
                まだコースがありません。最初にコースを作成してください。
              </div>
            ) : (
              <div className="space-y-5">
                {courses.map((course) => (
                  <div key={course.id} className="rounded-[30px] border border-black/8 bg-white p-5 shadow-[0_16px_36px_rgba(15,23,42,0.04)]">
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                      <div className="flex flex-1 gap-5">
                        {course.thumbnailUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={course.thumbnailUrl} alt={course.title} className="hidden h-36 w-56 rounded-[22px] object-cover md:block" />
                        ) : (
                          <div className="hidden h-36 w-56 rounded-[22px] bg-[linear-gradient(135deg,#d9e3ff,#f9f6ec)] md:block" />
                        )}
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="font-display text-2xl font-bold text-slate-950">{course.title}</h3>
                            <Badge tone="accent">{labelPlan(getMinimumPlanCodeFromAudience(course.audience?.planCodes))}</Badge>
                          </div>
                          <p className="mt-3 text-sm leading-7 text-slate-600">{course.summary}</p>
                          <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-500">
                            <span>想定学習時間: {course.estimatedHours}</span>
                            <span>章数: {course.modules.length}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <CreateLink href={`/admin/content?create=module&courseId=${course.id}`} label="このコースに章を追加" tone="secondary" />
                      </div>
                    </div>
                    <div className="mt-5 grid gap-4 xl:grid-cols-2">
                      {course.modules.length === 0 ? (
                        <div className="rounded-[24px] border border-dashed border-black/10 p-5 text-sm text-slate-500 xl:col-span-2">
                          まだ章がありません。
                        </div>
                      ) : (
                        course.modules.map((module) => (
                          <div key={module.id} className="rounded-[24px] bg-black/[0.03] p-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div className="font-semibold text-slate-950">{module.title}</div>
                              <CreateLink href={`/admin/content?create=lesson&moduleId=${module.id}`} label="講義追加" tone="secondary" />
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {module.lessons.length === 0 ? (
                                <span className="text-sm text-slate-500">まだ講義がありません。</span>
                              ) : (
                                module.lessons.map((lesson) => (
                                  <span key={lesson.id} className="rounded-full border border-black/8 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                                    {lesson.title}
                                  </span>
                                ))
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}

      <ContentModal
        create={params.create}
        closeHref="/admin/content"
        courses={courses.map((course) => ({ id: course.id, title: course.title }))}
        modules={modules}
        selectedCourseId={params.courseId}
        selectedModuleId={params.moduleId}
      />
    </div>
  );
}
