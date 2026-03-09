import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpenText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PortalImage } from "@/components/ui/portal-image";
import { ProgressBar } from "@/components/ui/progress-bar";
import { requireUser } from "@/lib/auth";
import { getPortalSnapshot } from "@/lib/portal";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseSlug: string }>;
}) {
  const { courseSlug } = await params;
  const user = await requireUser();
  const snapshot = await getPortalSnapshot(user);
  const course = snapshot.courses.find((item) => item.slug === courseSlug);

  if (!course) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden bg-[linear-gradient(135deg,#ffffff,#e4ebff)]">
        {course.thumbnailUrl ? (
          <PortalImage src={course.thumbnailUrl} alt={course.title} className="mb-6 h-56 rounded-[24px]" priority />
        ) : null}
        <Badge tone="brand">{course.heroNote}</Badge>
        <h1 className="mt-4 font-display text-4xl font-bold text-slate-950">{course.title}</h1>
        <p className="mt-4 max-w-3xl text-slate-600">{course.summary}</p>
        <div className="mt-6 max-w-md">
          <ProgressBar value={snapshot.courseProgress[course.id] ?? 0} />
          <div className="mt-2 text-sm text-slate-600">
            {snapshot.courseProgress[course.id] ?? 0}% 完了
          </div>
        </div>
      </Card>

      <div className="grid gap-6">
        {course.modules.length === 0 ? (
          <EmptyState
            icon={BookOpenText}
            title="このコースにはまだ章がありません"
            description="運営が講義を追加すると、このページに章と講義の一覧が表示されます。"
          />
        ) : course.modules.map((module) => (
          <Card key={module.id}>
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
              章
            </div>
            <h2 className="mt-2 font-display text-2xl font-bold text-slate-950">{module.title}</h2>
            <div className="mt-5 space-y-3">
              {module.lessons.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-black/10 p-4 text-sm text-slate-500">
                  まだ講義がありません。
                </div>
              ) : module.lessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="flex flex-col gap-4 rounded-[24px] border border-black/8 p-4 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div>
                    <div className="font-semibold text-slate-950">{lesson.title}</div>
                    <div className="mt-2 text-sm text-slate-600">{lesson.summary}</div>
                  </div>
                  <Link href={`/app/courses/${course.slug}/${lesson.slug}`}>
                    <Button>受講する</Button>
                  </Link>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
