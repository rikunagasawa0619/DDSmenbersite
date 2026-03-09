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
        "dds-panel rounded-[30px] p-6 backdrop-blur",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
