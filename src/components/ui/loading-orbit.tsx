import { BrandMark } from "@/components/brand-mark";

export function LoadingOrbit({
  label = "読み込み中",
  fullScreen = false,
}: {
  label?: string;
  fullScreen?: boolean;
}) {
  return (
    <div
      className={
        fullScreen
          ? "flex min-h-screen items-center justify-center px-6 py-10"
          : "flex min-h-[40vh] items-center justify-center px-6 py-10"
      }
    >
      <div className="flex flex-col items-center gap-6 text-center">
        <BrandMark compact />
        <div className="relative h-20 w-20">
          <span className="absolute inset-0 rounded-full border border-[var(--color-outline)]" />
          <span className="absolute inset-[6px] rounded-full border-2 border-transparent border-t-[var(--color-primary)] border-r-[var(--color-primary)] animate-[spin_1s_linear_infinite]" />
          <span className="absolute inset-[18px] rounded-full border border-[var(--color-accent)]/50 animate-[spin_1.8s_linear_infinite_reverse]" />
        </div>
        <div>
          <div className="font-display text-xl font-extrabold tracking-[-0.06em] text-[var(--color-foreground)]">
            {label}
          </div>
          <div className="mt-2 text-sm text-[var(--color-muted)]">
            画面を準備しています。
          </div>
        </div>
      </div>
    </div>
  );
}
