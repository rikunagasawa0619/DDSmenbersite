import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BookOpenText, Clock3, Layers3 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PortalImage } from "@/components/ui/portal-image";
import { ProgressBar } from "@/components/ui/progress-bar";
import { requireUser } from "@/lib/auth";
import { getPortalCourseDetailSnapshot } from "@/lib/portal";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseSlug: string }>;
}) {
  const { courseSlug } = await params;
  const user = await requireUser();
  const snapshot = await getPortalCourseDetailSnapshot(user, courseSlug);
  const course = snapshot.course;

  if (!course) {
    notFound();
  }

  const courseProgress = snapshot.courseProgress[course.id] ?? 0;
  const totalLessons = course.modules.reduce((sum, module) => sum + module.lessons.length, 0);

  return (
    <div className="space-y-6">
      <section className="dds-lesson-stage dds-reveal">
        <div className="relative z-[1] grid gap-8 xl:grid-cols-[minmax(0,1.25fr)_320px] xl:items-end">
          <div>
            {course.thumbnailUrl ? (
              <PortalImage src={course.thumbnailUrl} alt={course.title} className="mb-6 h-64 rounded-[1.8rem]" priority />
            ) : null}
            <div className="flex flex-wrap items-center gap-3">
              <Badge tone="brand">{course.heroNote}</Badge>
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                {course.modules.length} chapters / {totalLessons} lessons
              </span>
            </div>
            <h1 className="mt-5 max-w-4xl font-display text-[clamp(2.7rem,5vw,5.2rem)] font-black leading-[0.92] tracking-[-0.1em] text-slate-950">
              {course.title}
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">{course.summary}</p>
          </div>

          <div className="space-y-4">
            <div className="dds-lesson-meta-card">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                <Clock3 className="h-4 w-4 text-[var(--color-primary)]" />
                estimated
              </div>
              <div className="mt-3 font-display text-2xl font-black tracking-[-0.08em] text-slate-950">
                {course.estimatedHours}
              </div>
            </div>
            <div className="dds-lesson-meta-card">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                <Layers3 className="h-4 w-4 text-[var(--color-primary)]" />
                progress
              </div>
              <div className="mt-3 font-display text-2xl font-black tracking-[-0.08em] text-slate-950">
                {courseProgress}%
              </div>
              <ProgressBar value={courseProgress} className="mt-3" />
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6">
        {course.modules.length === 0 ? (
          <EmptyState
            icon={BookOpenText}
            title="このコースにはまだ章がありません"
            description="運営が講義を追加すると、このページに章と講義の一覧が表示されます。"
          />
        ) : course.modules.map((module, moduleIndex) => (
          <Card key={module.id} className="overflow-hidden">
            <div className="grid gap-6 xl:grid-cols-[220px_minmax(0,1fr)]">
              <div className="rounded-[1.6rem] border border-black/8 bg-black/[0.03] p-5">
                <div className="dds-kicker text-[var(--color-primary)]">chapter {String(moduleIndex + 1).padStart(2, "0")}</div>
                <h2 className="mt-3 font-display text-[1.9rem] font-black leading-[0.98] tracking-[-0.08em] text-slate-950">
                  {module.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {module.lessons.length}本の講義でまとまっています。
                </p>
              </div>

              <div className="space-y-3">
                {module.lessons.length === 0 ? (
                  <div className="rounded-[24px] border border-dashed border-black/10 p-4 text-sm text-slate-500">
                    まだ講義がありません。
                  </div>
                ) : module.lessons.map((lesson, lessonIndex) => (
                  <div
                    key={lesson.id}
                    className="rounded-[1.6rem] border border-black/8 bg-white/70 p-4 transition hover:-translate-y-0.5 hover:border-[var(--color-primary)]/20"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          lesson {String(lessonIndex + 1).padStart(2, "0")} / {lesson.type === "video" ? "動画" : lesson.type === "podcast" ? "音声" : "記事"}
                        </div>
                        <div className="mt-2 font-display text-[1.25rem] font-black tracking-[-0.06em] text-slate-950">
                          {lesson.title}
                        </div>
                        <div className="mt-2 text-sm leading-7 text-slate-600">{lesson.summary}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-semibold text-slate-500">{lesson.duration}</div>
                        <Link href={`/app/courses/${course.slug}/${lesson.slug}`}>
                          <Button className="gap-2">
                            受講する
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
