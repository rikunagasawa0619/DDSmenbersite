import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AppLoading() {
  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <Card>
          <Skeleton className="h-6 w-24" />
          <Skeleton className="mt-4 h-10 w-3/4" />
          <Skeleton className="mt-3 h-5 w-full max-w-md" />
        </Card>
        <Card className="bg-[#111b2f]">
          <Skeleton className="h-4 w-20 bg-white/10" />
          <Skeleton className="mt-4 h-8 w-48 bg-white/10" />
          <Skeleton className="mt-3 h-4 w-32 bg-white/10" />
        </Card>
      </section>
      <section className="grid gap-5 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <Skeleton className="h-6 w-20" />
            <Skeleton className="mt-4 h-7 w-3/4" />
            <Skeleton className="mt-3 h-16 w-full" />
          </Card>
        ))}
      </section>
    </div>
  );
}
