import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function RootLoading() {
  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="p-8 md:p-12">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="mt-6 h-14 w-3/4" />
          <Skeleton className="mt-4 h-5 w-full max-w-xl" />
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {[1, 2].map((item) => (
              <div key={item} className="rounded-[26px] border border-black/5 p-5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-3 h-6 w-3/4" />
                <Skeleton className="mt-3 h-12 w-full" />
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-8 md:p-10">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="mt-4 h-10 w-56" />
          <Skeleton className="mt-3 h-5 w-full" />
          <Skeleton className="mt-8 h-80 w-full" />
        </Card>
      </div>
    </div>
  );
}
