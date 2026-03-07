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
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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

export default async function AdminContentPage() {
  await requireAdmin();
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
      <div>
        <div className="text-sm font-semibold tracking-[0.18em] text-[var(--color-primary)]">
          コンテンツ管理
        </div>
        <h1 className="mt-3 font-display text-4xl font-bold text-slate-950">
          バナーから講義まで一画面で編集
        </h1>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600">
          バナー、お知らせ、お得情報、ツール、FAQ、教材コース、章、講義を日本語 UI で管理できます。講義は
          「コース → 章 → 講義」の順に作成し、本文はフォーム入力から自動でブロック化します。
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <Card><div className="text-sm text-slate-500">バナー</div><div className="mt-3 font-display text-3xl font-bold text-slate-950">{banners.length}</div></Card>
        <Card><div className="text-sm text-slate-500">お知らせ</div><div className="mt-3 font-display text-3xl font-bold text-slate-950">{announcements.length}</div></Card>
        <Card><div className="text-sm text-slate-500">お得情報</div><div className="mt-3 font-display text-3xl font-bold text-slate-950">{deals.length}</div></Card>
        <Card><div className="text-sm text-slate-500">ツール</div><div className="mt-3 font-display text-3xl font-bold text-slate-950">{tools.length}</div></Card>
        <Card><div className="text-sm text-slate-500">FAQ</div><div className="mt-3 font-display text-3xl font-bold text-slate-950">{faqs.length}</div></Card>
        <Card><div className="text-sm text-slate-500">教材コース</div><div className="mt-3 font-display text-3xl font-bold text-slate-950">{courses.length}</div></Card>
      </section>

      {isDatabaseConfigured ? (
        <>
          <section className="grid gap-5 xl:grid-cols-2">
            <Card>
              <h2 className="font-display text-2xl font-bold text-slate-950">バナーを追加</h2>
              <form action={createBannerAction} className="mt-5 grid gap-3">
                <input name="eyebrow" placeholder="例: 今月の注目" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
                <input name="title" placeholder="バナー見出し" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
                <input name="subtitle" placeholder="サブコピー" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
                <input name="imageUrl" placeholder="サムネイル画像URL（任意）" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
                <div className="grid gap-3 md:grid-cols-2">
                  <input name="ctaLabel" placeholder="ボタン文言" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
                  <input name="ctaHref" placeholder="/app/bookings" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
                </div>
                <input name="accent" defaultValue="from-sky-200 via-blue-100 to-indigo-200" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
                <div className="grid gap-3 md:grid-cols-2">
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
                <SubmitButton pendingLabel="追加中...">バナーを保存</SubmitButton>
              </form>
            </Card>

            <Card>
              <h2 className="font-display text-2xl font-bold text-slate-950">お知らせを追加</h2>
              <form action={createAnnouncementAction} className="mt-5 grid gap-3">
                <input name="title" placeholder="お知らせタイトル" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
                <input name="summary" placeholder="一覧用の短い説明" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
                <textarea name="body" placeholder="本文" className="min-h-32 rounded-2xl border border-black/10 bg-white px-4 py-3" />
                <div className="grid gap-3 md:grid-cols-2">
                  <input name="publishAt" type="datetime-local" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
                  <select name="publishStatus" defaultValue="PUBLISHED" className="rounded-2xl border border-black/10 bg-white px-4 py-3">
                    {publishStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <select name="minimumPlanCode" className="rounded-2xl border border-black/10 bg-white px-4 py-3">
                  {minimumPlanOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <SubmitButton pendingLabel="保存中...">お知らせを保存</SubmitButton>
              </form>
            </Card>
          </section>

          <section className="grid gap-5 xl:grid-cols-3">
            <Card>
              <h2 className="font-display text-2xl font-bold text-slate-950">お得情報を追加</h2>
              <form action={createDealAction} className="mt-5 grid gap-3">
                <input name="title" placeholder="タイトル" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
                <input name="summary" placeholder="概要" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
                <textarea name="body" placeholder="詳細説明" className="min-h-28 rounded-2xl border border-black/10 bg-white px-4 py-3" />
                <input name="badge" placeholder="例: 会員限定" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
                <input name="offer" placeholder="例: 初月50%OFF" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
                <div className="grid gap-3 md:grid-cols-2">
                  <input name="ctaLabel" placeholder="ボタン文言" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
                  <input name="ctaHref" placeholder="遷移先URL" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
                </div>
                <select name="minimumPlanCode" className="rounded-2xl border border-black/10 bg-white px-4 py-3">
                  {minimumPlanOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                <SubmitButton pendingLabel="保存中...">お得情報を保存</SubmitButton>
              </form>
            </Card>

            <Card>
              <h2 className="font-display text-2xl font-bold text-slate-950">ツールを追加</h2>
              <form action={createToolItemAction} className="mt-5 grid gap-3">
                <input name="title" placeholder="ツール名" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
                <input name="summary" placeholder="概要" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
                <textarea name="body" placeholder="使い方や紹介文" className="min-h-28 rounded-2xl border border-black/10 bg-white px-4 py-3" />
                <input name="href" placeholder="ツールURL（任意）" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
                <select name="minimumPlanCode" className="rounded-2xl border border-black/10 bg-white px-4 py-3">
                  {minimumPlanOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                <SubmitButton pendingLabel="保存中...">ツールを保存</SubmitButton>
              </form>
            </Card>

            <Card>
              <h2 className="font-display text-2xl font-bold text-slate-950">FAQ を追加</h2>
              <form action={createFaqAction} className="mt-5 grid gap-3">
                <input name="category" placeholder="カテゴリ" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
                <input name="question" placeholder="質問" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
                <textarea name="answer" placeholder="回答" className="min-h-28 rounded-2xl border border-black/10 bg-white px-4 py-3" />
                <select name="minimumPlanCode" className="rounded-2xl border border-black/10 bg-white px-4 py-3">
                  {minimumPlanOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                <SubmitButton pendingLabel="保存中...">FAQ を保存</SubmitButton>
              </form>
            </Card>
          </section>

          <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
            <Card>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-2xl font-bold text-slate-950">教材の階層構造</h2>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    1. コースを作成 → 2. 章を追加 → 3. 講義を追加、の順に進めてください。
                  </p>
                </div>
                <Badge tone="brand">{courses.length} コース</Badge>
              </div>
              <div className="mt-6 space-y-4">
                {courses.length === 0 ? (
                  <div className="rounded-[24px] border border-dashed border-black/10 p-5 text-sm text-slate-500">
                    まだ教材コースがありません。右側のフォームから最初のコースを作成してください。
                  </div>
                ) : (
                  courses.map((course) => (
                    <div key={course.id} className="rounded-[24px] border border-black/6 p-5">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="font-display text-xl font-bold text-slate-950">{course.title}</div>
                        <Badge tone="accent">{labelPlan(getMinimumPlanCodeFromAudience(course.audience?.planCodes))}</Badge>
                      </div>
                      <div className="mt-2 text-sm leading-7 text-slate-600">{course.summary}</div>
                      <div className="mt-4 space-y-3">
                        {course.modules.length === 0 ? (
                          <div className="rounded-2xl bg-black/[0.03] px-4 py-3 text-sm text-slate-500">
                            まだ章がありません。
                          </div>
                        ) : (
                          course.modules.map((module) => (
                            <div key={module.id} className="rounded-2xl bg-black/[0.03] p-4">
                              <div className="font-semibold text-slate-950">{module.title}</div>
                              <div className="mt-2 text-sm text-slate-600">
                                講義数: {module.lessons.length}
                              </div>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {module.lessons.map((lesson) => (
                                  <span key={lesson.id} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                                    {lesson.title}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <div className="grid gap-5">
              <Card>
                <h2 className="font-display text-2xl font-bold text-slate-950">1. コースを作成</h2>
                <form action={createCourseAction} className="mt-5 grid gap-3">
                  <input name="title" placeholder="コース名" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
                  <input name="slug" placeholder="URLスラッグ（空欄なら自動生成）" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
                  <textarea name="summary" placeholder="コース説明" className="min-h-24 rounded-2xl border border-black/10 bg-white px-4 py-3" />
                  <input name="heroNote" placeholder="例: まず最初に受けてほしい講座" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
                  <div className="grid gap-3 md:grid-cols-2">
                    <input name="estimatedHours" placeholder="想定学習時間 例: 3時間" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
                    <input name="thumbnailUrl" placeholder="サムネイル画像URL" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <select name="minimumPlanCode" className="rounded-2xl border border-black/10 bg-white px-4 py-3">
                      {minimumPlanOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                    <select name="publishStatus" defaultValue="PUBLISHED" className="rounded-2xl border border-black/10 bg-white px-4 py-3">
                      {publishStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </div>
                  <SubmitButton pendingLabel="作成中...">コースを作成</SubmitButton>
                </form>
              </Card>

              <Card>
                <h2 className="font-display text-2xl font-bold text-slate-950">2. 章を追加</h2>
                <form action={createCourseModuleAction} className="mt-5 grid gap-3">
                  <select name="courseId" className="rounded-2xl border border-black/10 bg-white px-4 py-3">
                    <option value="">コースを選択</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>{course.title}</option>
                    ))}
                  </select>
                  <input name="title" placeholder="章タイトル" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
                  <input name="sortOrder" type="number" placeholder="表示順（0,1,2...）" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
                  <SubmitButton pendingLabel="追加中...">章を追加</SubmitButton>
                </form>
              </Card>

              <Card>
                <h2 className="font-display text-2xl font-bold text-slate-950">3. 講義を追加</h2>
                <form action={createCourseLessonAction} className="mt-5 grid gap-3">
                  <select name="moduleId" className="rounded-2xl border border-black/10 bg-white px-4 py-3">
                    <option value="">章を選択</option>
                    {modules.map((module) => (
                      <option key={module.id} value={module.id}>{module.courseTitle} / {module.title}</option>
                    ))}
                  </select>
                  <input name="title" placeholder="講義タイトル" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
                  <input name="slug" placeholder="URLスラッグ（空欄なら自動生成）" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
                  <input name="summary" placeholder="講義の要約" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
                  <div className="grid gap-3 md:grid-cols-2">
                    <select name="lessonType" className="rounded-2xl border border-black/10 bg-white px-4 py-3">
                      <option value="VIDEO">動画講義</option>
                      <option value="ARTICLE">記事講義</option>
                      <option value="PODCAST">ポッドキャスト</option>
                    </select>
                    <input name="duration" placeholder="再生時間 例: 12分" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
                  </div>
                  <input name="mediaUrl" placeholder="動画 / 音声 URL（任意）" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
                  <textarea name="body" placeholder="本文（記事や補足説明）" className="min-h-32 rounded-2xl border border-black/10 bg-white px-4 py-3" />
                  <textarea name="checklist" placeholder="確認ポイント（1行に1つ）" className="min-h-24 rounded-2xl border border-black/10 bg-white px-4 py-3" />
                  <div className="grid gap-3 md:grid-cols-2">
                    <input name="ctaLabel" placeholder="最後の導線ボタン文言" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
                    <input name="ctaHref" placeholder="最後の導線URL" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
                  </div>
                  <textarea name="ctaBody" placeholder="最後に表示する案内文（任意）" className="min-h-20 rounded-2xl border border-black/10 bg-white px-4 py-3" />
                  <input name="sortOrder" type="number" placeholder="表示順（0,1,2...）" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
                  <SubmitButton pendingLabel="追加中...">講義を追加</SubmitButton>
                </form>
              </Card>
            </div>
          </section>
        </>
      ) : (
        <Card>
          <div className="rounded-[24px] border border-dashed border-black/10 p-5 text-sm leading-7 text-slate-500">
            データベース接続後にコンテンツ編集が有効になります。
          </div>
        </Card>
      )}
    </div>
  );
}
