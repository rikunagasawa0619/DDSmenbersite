import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Card({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-black/5 bg-white/90 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
