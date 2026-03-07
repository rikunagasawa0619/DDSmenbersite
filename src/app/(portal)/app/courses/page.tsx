import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { requireUser } from "@/lib/auth";
import { getPortalSnapshot } from "@/lib/portal";

export default async function CoursesPage() {
  const user = await requireUser();
  const snapshot = await getPortalSnapshot(user);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
          Courses
        </div>
        <h1 className="mt-3 font-display text-4xl font-bold text-slate-950">オンライン教材</h1>
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
        {snapshot.courses.map((course) => (
          <Card key={course.id} className="flex h-full flex-col">
            <div className="rounded-[24px] bg-[linear-gradient(135deg,#dbe5ff,#ffffff)] p-5">
              <Badge tone="brand">{course.heroNote}</Badge>
              <h2 className="mt-4 font-display text-2xl font-bold text-slate-950">{course.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{course.summary}</p>
            </div>
            <div className="mt-5 flex flex-1 flex-col justify-between">
              <div>
                <div className="text-sm text-slate-500">想定学習時間 {course.estimatedHours}</div>
                <ProgressBar value={snapshot.courseProgress[course.id] ?? 0} className="mt-4" />
                <div className="mt-2 text-sm text-slate-600">
                  {snapshot.courseProgress[course.id] ?? 0}% 完了
                </div>
              </div>
              <Link href={`/app/courses/${course.slug}`} className="mt-6">
                <Button className="w-full">受講する</Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
