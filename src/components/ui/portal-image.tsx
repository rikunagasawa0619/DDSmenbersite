import Image from "next/image";

import { cn } from "@/lib/utils";

function canOptimizeImage(src: string) {
  if (src.startsWith("/")) {
    return true;
  }

  if (!process.env.NEXT_PUBLIC_APP_URL && !process.env.R2_PUBLIC_BASE_URL) {
    return false;
  }

  try {
    const target = new URL(src);
    const appHost = process.env.NEXT_PUBLIC_APP_URL
      ? new URL(process.env.NEXT_PUBLIC_APP_URL).host
      : null;
    const r2Host = process.env.R2_PUBLIC_BASE_URL
      ? new URL(process.env.R2_PUBLIC_BASE_URL).host
      : null;
    return target.host === appHost || target.host === r2Host;
  } catch {
    return false;
  }
}

export function PortalImage({
  src,
  alt,
  className,
  priority = false,
  sizes = "(max-width: 768px) 100vw, 720px",
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        className="object-cover"
        unoptimized={!canOptimizeImage(src)}
      />
    </div>
  );
}
