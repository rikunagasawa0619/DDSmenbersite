import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpenText, Clock3, Layers3 } from "lucide-react";

import { markLessonCompleteAction } from "@/actions/member";
import { LessonBlocks } from "@/components/content/lesson-blocks";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireUser } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/prisma";
import { getPortalCourseDetailSnapshot } from "@/lib/portal";

export default async function LessonDetailPage({
  params,
}: {
  params: Promise<{ courseSlug: string; lessonSlug: string }>;
}) {
  const { courseSlug, lessonSlug } = await params;
  const user = await requireUser();
  const snapshot = await getPortalCourseDetailSnapshot(user, courseSlug);
  const course = snapshot.course;

  if (!course) {
    notFound();
  }

  const flattenedLessons = course.modules.flatMap((module, moduleIndex) =>
    module.lessons.map((item, lessonIndex) => ({
      ...item,
      moduleId: module.id,
      moduleTitle: module.title,
      moduleIndex,
      lessonIndex,
    })),
  );

  const currentLessonIndex = flattenedLessons.findIndex((item) => item.slug === lessonSlug);

  if (currentLessonIndex < 0) {
    notFound();
  }

  const lesson = flattenedLessons[currentLessonIndex];
  const previousLesson = flattenedLessons[currentLessonIndex - 1] ?? null;
  const nextLesson = flattenedLessons[currentLessonIndex + 1] ?? null;
  const courseProgress = snapshot.courseProgress[course.id] ?? 0;
  const activeModule = course.modules.find((module) => module.id === lesson.moduleId) ?? course.modules[0];

  return (
    <div className="dds-lesson-shell">
      <aside className="dds-lesson-rail">
        <Card className="dds-tile">
          <Link
            href={`/app/courses/${course.slug}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)]"
          >
            <ArrowLeft className="h-4 w-4" />
            コース一覧へ戻る
          </Link>

          <div className="mt-6">
            <div className="dds-kicker text-[var(--color-primary)]">course</div>
            <h1 className="mt-3 font-display text-[2rem] font-black leading-tight tracking-[-0.08em] text-slate-950">
              {course.title}
            </h1>
            <p className="mt-4 text-sm leading-7 text-slate-600">{course.summary}</p>
          </div>

          <div className="mt-6 rounded-[1.6rem] border border-black/8 bg-black/[0.03] p-4">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-semibold text-slate-600">学習進捗</span>
              <span className="font-display text-lg font-black tracking-[-0.05em] text-slate-950">
                {courseProgress}%
              </span>
            </div>
            <ProgressBar value={courseProgress} className="mt-3" />
            <div className="mt-3 text-xs text-slate-500">
              {flattenedLessons.length}本の講義のうち {currentLessonIndex + 1} 本目を表示中
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="dds-kicker text-[var(--color-primary)]">outline</div>
              <div className="mt-2 font-display text-xl font-black tracking-[-0.06em] text-slate-950">
                講義一覧
              </div>
            </div>
            <Badge tone="neutral">{course.modules.length}章</Badge>
          </div>

          <div className="mt-5 space-y-5">
            {course.modules.map((module, moduleIndex) => (
              <div key={module.id}>
                <div className="mb-3 flex items-center gap-3">
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-primary)]/12 font-display text-xs font-black tracking-[0.1em] text-[var(--color-primary)]">
                    {String(moduleIndex + 1).padStart(2, "0")}
                  </div>
                  <div className="text-sm font-semibold text-slate-800">{module.title}</div>
                </div>
                <div className="space-y-2">
                  {module.lessons.map((item, itemIndex) => (
                    <Link
                      key={item.id}
                      href={`/app/courses/${course.slug}/${item.slug}`}
                      data-active={item.slug === lesson.slug ? "true" : "false"}
                      className="dds-lesson-outline-link"
                    >
                      <span className="dds-lesson-outline-link-kicker">
                        lesson {String(itemIndex + 1).padStart(2, "0")}
                      </span>
                      <span className="dds-lesson-outline-link-title">{item.title}</span>
                      <span className="dds-lesson-outline-link-meta">
                        {item.type === "video" ? "動画" : item.type === "podcast" ? "音声" : "記事"} / {item.duration}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </aside>

      <div className="space-y-6">
        <section className="dds-lesson-stage dds-reveal">
          <div className="relative z-[1]">
            <div className="flex flex-wrap items-center gap-3">
              <Badge tone="brand">
                {lesson.type === "video" ? "video" : lesson.type === "podcast" ? "podcast" : "article"}
              </Badge>
              <Badge tone="accent">{activeModule.title}</Badge>
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                lesson {String(currentLessonIndex + 1).padStart(2, "0")} / {String(flattenedLessons.length).padStart(2, "0")}
              </span>
            </div>

            <h1 className="mt-6 max-w-4xl font-display text-[clamp(2.5rem,5vw,4.8rem)] font-black leading-[0.92] tracking-[-0.1em] text-slate-950">
              {lesson.title}
            </h1>

            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">{lesson.summary}</p>

            <div className="mt-8 dds-lesson-meta-grid">
              <div className="dds-lesson-meta-card">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  <Clock3 className="h-4 w-4 text-[var(--color-primary)]" />
                  duration
                </div>
                <div className="mt-3 font-display text-2xl font-black tracking-[-0.08em] text-slate-950">
                  {lesson.duration}
                </div>
              </div>
              <div className="dds-lesson-meta-card">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  <Layers3 className="h-4 w-4 text-[var(--color-primary)]" />
                  module
                </div>
                <div className="mt-3 font-display text-xl font-black tracking-[-0.07em] text-slate-950">
                  {activeModule.title}
                </div>
              </div>
              <div className="dds-lesson-meta-card">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  <BookOpenText className="h-4 w-4 text-[var(--color-primary)]" />
                  progress
                </div>
                <div className="mt-3 font-display text-2xl font-black tracking-[-0.08em] text-slate-950">
                  {courseProgress}%
                </div>
                <ProgressBar value={courseProgress} className="mt-3" />
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              {isDatabaseConfigured ? (
                <form action={markLessonCompleteAction}>
                  <input type="hidden" name="lessonId" value={lesson.id} />
                  <SubmitButton pendingLabel="記録中...">この講義を完了済みにする</SubmitButton>
                </form>
              ) : (
                <div className="rounded-full border border-black/8 bg-black/[0.03] px-4 py-3 text-sm text-slate-500">
                  DB接続後に進捗保存が有効になります。
                </div>
              )}
              {nextLesson ? (
                <Link
                  href={`/app/courses/${course.slug}/${nextLesson.slug}`}
                  className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/72 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                >
                  次の講義へ
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : null}
            </div>
          </div>
        </section>

        <LessonBlocks blocks={lesson.blocks} />

        <div className="grid gap-4 md:grid-cols-2">
          {previousLesson ? (
            <Link
              href={`/app/courses/${course.slug}/${previousLesson.slug}`}
              className="dds-lesson-flow-link"
            >
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Previous</span>
              <span className="font-display text-xl font-black tracking-[-0.06em] text-slate-950">
                {previousLesson.title}
              </span>
              <span className="text-sm text-slate-600">{previousLesson.moduleTitle}</span>
            </Link>
          ) : (
            <div className="dds-lesson-flow-link opacity-60">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Previous</span>
              <span className="font-display text-xl font-black tracking-[-0.06em] text-slate-950">
                最初の講義です
              </span>
              <span className="text-sm text-slate-600">このまま内容を進めてください。</span>
            </div>
          )}

          {nextLesson ? (
            <Link
              href={`/app/courses/${course.slug}/${nextLesson.slug}`}
              className="dds-lesson-flow-link"
            >
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Next</span>
              <span className="font-display text-xl font-black tracking-[-0.06em] text-slate-950">
                {nextLesson.title}
              </span>
              <span className="text-sm text-slate-600">{nextLesson.moduleTitle}</span>
            </Link>
          ) : (
            <div className="dds-lesson-flow-link opacity-60">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Next</span>
              <span className="font-display text-xl font-black tracking-[-0.06em] text-slate-950">
                このコースは完了です
              </span>
              <span className="text-sm text-slate-600">次は別のコースへ進めます。</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
