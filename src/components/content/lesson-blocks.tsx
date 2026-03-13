import { AudioLines, CheckCircle2, Download, ExternalLink, ListCollapse, PlayCircle } from "lucide-react";

import { RichHtml } from "@/components/content/rich-html";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { sanitizeRichHtml } from "@/lib/rich-content";
import type { LessonBlock } from "@/lib/types";

export function LessonBlocks({ blocks }: { blocks: LessonBlock[] }) {
  return (
    <div className="space-y-5">
      {blocks.map((block, index) => {
        const orderLabel = `${String(index + 1).padStart(2, "0")}`;

        switch (block.type) {
          case "hero":
            return (
              <section key={block.id} className="dds-lesson-block-shell dds-tile" data-tone="accent">
                <div className="relative z-[1]">
                  <Badge tone="accent">{block.eyebrow ?? `lesson ${orderLabel}`}</Badge>
                  <h2 className="mt-5 max-w-4xl font-display text-[clamp(2rem,4vw,3.4rem)] font-black leading-[0.95] tracking-[-0.08em] text-slate-950">
                    {block.title}
                  </h2>
                  <p className="mt-4 max-w-3xl text-base leading-8 text-slate-700">{block.body}</p>
                </div>
              </section>
            );
          case "rich_text":
            return (
              <section key={block.id} className="dds-lesson-block-shell">
                {block.title ? (
                  <>
                    <div className="dds-lesson-block-label">Section {orderLabel}</div>
                    <h3 className="mt-4 font-display text-[1.75rem] font-black tracking-[-0.07em] text-slate-950">
                      {block.title}
                    </h3>
                  </>
                ) : null}
                <RichHtml html={block.body} className={block.title ? "mt-4" : ""} />
              </section>
            );
          case "embed_video":
            return (
              <section key={block.id} className="dds-lesson-block-shell" data-tone="ink">
                <div className="dds-lesson-block-label">
                  <PlayCircle className="h-4 w-4 text-[var(--color-primary)]" />
                  Video / {block.duration}
                </div>
                <h3 className="mt-4 font-display text-[1.75rem] font-black tracking-[-0.07em] text-slate-950">
                  {block.title}
                </h3>
                <div className="mt-5 overflow-hidden rounded-[1.6rem] border border-black/8 bg-black/[0.03] shadow-[0_16px_36px_rgba(7,17,31,0.08)]">
                  <iframe
                    className="aspect-video w-full"
                    src={block.url}
                    title={block.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </section>
            );
          case "embed_audio":
            return (
              <section key={block.id} className="dds-lesson-block-shell">
                <div className="dds-lesson-block-label">
                  <AudioLines className="h-4 w-4 text-[var(--color-primary)]" />
                  Audio / {block.duration}
                </div>
                <h3 className="mt-4 font-display text-[1.75rem] font-black tracking-[-0.07em] text-slate-950">
                  {block.title}
                </h3>
                <div className="mt-5 overflow-hidden rounded-[1.6rem] border border-black/8 bg-black/[0.03] shadow-[0_16px_36px_rgba(7,17,31,0.08)]">
                  <iframe
                    className="h-[232px] w-full"
                    src={block.url}
                    title={block.title}
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  />
                </div>
              </section>
            );
          case "checklist":
            return (
              <section key={block.id} className="dds-lesson-block-shell" data-tone="accent">
                <div className="dds-lesson-block-label">
                  <CheckCircle2 className="h-4 w-4 text-[var(--color-primary)]" />
                  Checklist
                </div>
                <h3 className="mt-4 font-display text-[1.75rem] font-black tracking-[-0.07em] text-slate-950">
                  {block.title}
                </h3>
                <ul className="mt-5 space-y-3">
                  {block.items.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 rounded-[1.3rem] border border-black/8 bg-white/72 px-4 py-3 text-slate-700"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      <span className="leading-7">{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            );
          case "accordion":
            return (
              <section key={block.id} className="dds-lesson-block-shell">
                <div className="dds-lesson-block-label">
                  <ListCollapse className="h-4 w-4 text-[var(--color-primary)]" />
                  Notes
                </div>
                <h3 className="mt-4 font-display text-[1.75rem] font-black tracking-[-0.07em] text-slate-950">
                  {block.title}
                </h3>
                <div className="mt-5 space-y-3">
                  {block.items.map((item) => (
                    <details key={item.title} className="dds-lesson-accordion-item">
                      <summary className="cursor-pointer list-none font-semibold text-slate-950">
                        <span className="inline-flex items-center gap-3">
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-primary)]/12 text-[11px] font-black tracking-[0.12em] text-[var(--color-primary)]">
                            +
                          </span>
                          {item.title}
                        </span>
                      </summary>
                      <p className="mt-4 pl-10 text-sm leading-7 text-slate-600">{item.body}</p>
                    </details>
                  ))}
                </div>
              </section>
            );
          case "cta":
            return (
              <section key={block.id} className="dds-lesson-block-shell dds-tile" data-tone="ink">
                <div className="relative z-[1]">
                  <div className="dds-lesson-block-label">Action</div>
                  <h3 className="mt-4 font-display text-[1.9rem] font-black tracking-[-0.07em] text-slate-950">
                    {block.title}
                  </h3>
                  <p className="mt-4 max-w-3xl text-sm leading-8 text-slate-600">{block.body}</p>
                  <a href={block.href} className="mt-6 inline-flex">
                    <Button>{block.label}</Button>
                  </a>
                </div>
              </section>
            );
          case "download":
            return (
              <section key={block.id} className="dds-lesson-block-shell">
                <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                  <div>
                    <div className="dds-lesson-block-label">
                      <Download className="h-4 w-4 text-[var(--color-primary)]" />
                      Download
                    </div>
                    <h3 className="mt-4 font-display text-[1.75rem] font-black tracking-[-0.07em] text-slate-950">
                      {block.title}
                    </h3>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">{block.description}</p>
                  </div>
                  <a
                    href={block.href}
                    className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/76 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                  >
                    ダウンロード
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </section>
            );
          case "custom_html":
            return (
              <section
                key={block.id}
                className="dds-lesson-block-shell"
                dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(block.html) }}
              />
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
