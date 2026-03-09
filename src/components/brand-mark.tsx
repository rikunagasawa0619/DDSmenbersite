import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

export function BrandMark({
  compact = false,
  href = "/",
  className,
}: {
  compact?: boolean;
  href?: string;
  className?: string;
}) {
  return (
    <Link href={href} className={cn("inline-flex items-center", className)} aria-label="DDS Digital Service">
      <Image
        src="/dds-logo-lockup.svg"
        alt="DDS Digital Service"
        width={compact ? 132 : 198}
        height={compact ? 132 : 198}
        priority
        className={cn(
          "h-auto w-auto drop-shadow-[0_18px_32px_rgba(7,17,31,0.12)]",
          compact ? "max-w-[132px]" : "max-w-[198px]",
        )}
      />
    </Link>
  );
}
