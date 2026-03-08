import { cn } from "@/lib/utils";
import { sanitizeRichHtml } from "@/lib/rich-content";

export function RichHtml({
  html,
  className,
}: {
  html: string;
  className?: string;
}) {
  return (
    <div
      className={cn("dds-prose text-slate-700", className)}
      dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(html) }}
    />
  );
}
