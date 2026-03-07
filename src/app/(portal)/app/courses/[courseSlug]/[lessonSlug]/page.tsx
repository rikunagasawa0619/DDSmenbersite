import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { markLessonCompleteAction } from "@/actions/member";
import { LessonBlocks } from "@/components/content/lesson-blocks";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireUser } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/prisma";
import { getPortalSnapshot } from "@/lib/portal";

export default async function LessonDetailPage({
  params,
}: {
  params: Promise<{ courseSlug: string; lessonSlug: string }>;
}) {
  const { courseSlug, lessonSlug } = await params;
  const user = await requireUser();
  const snapshot = await getPortalSnapshot(user);
  const course = snapshot.courses.find((item) => item.slug === courseSlug);

  if (!course) {
    notFound();
  }

  const lesson = course.modules.flatMap((module) => module.lessons).find((item) => item.slug === lessonSlug);

  if (!lesson) {
    notFound();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
      <Card className="h-fit">
        <Link
          href={`/app/courses/${course.slug}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)]"
        >
          <ArrowLeft className="h-4 w-4" />
          コース一覧へ戻る
        </Link>
        <h1 className="mt-6 font-display text-2xl font-bold text-slate-950">{course.title}</h1>
        <div className="mt-5 space-y-5">
          {course.modules.map((module) => (
            <div key={module.id}>
              <div className="font-semibold text-slate-700">{module.title}</div>
              <div className="mt-3 space-y-2">
                {module.lessons.map((item) => (
                  <Link
                    key={item.id}
                    href={`/app/courses/${course.slug}/${item.slug}`}
                    className={`block rounded-2xl px-4 py-3 text-sm ${
                      item.slug === lesson.slug
                        ? "bg-[var(--color-primary)] text-white"
                        : "bg-black/[0.03] text-slate-600"
                    }`}
                  >
                    {item.title}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
      <div className="space-y-6">
        <Card>
          <Badge tone="brand">{lesson.type.toUpperCase()}</Badge>
          <h1 className="mt-4 font-display text-4xl font-bold text-slate-950">{lesson.title}</h1>
          <p className="mt-4 text-slate-600">{lesson.summary}</p>
          {isDatabaseConfigured ? (
            <form action={markLessonCompleteAction} className="mt-5">
              <input type="hidden" name="lessonId" value={lesson.id} />
              <SubmitButton pendingLabel="記録中...">この講義を完了済みにする</SubmitButton>
            </form>
          ) : (
            <div className="mt-5 text-sm text-slate-500">
              DB 接続後に学習進捗の保存が有効になります。
            </div>
          )}
        </Card>
        <LessonBlocks blocks={lesson.blocks} />
      </div>
    </div>
  );
}
