import { AudioLines, CheckCircle2, Download, ExternalLink, ListCollapse, PlayCircle } from "lucide-react";

import { RichHtml } from "@/components/content/rich-html";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { sanitizeRichHtml } from "@/lib/rich-content";
import type { LessonBlock } from "@/lib/types";

export function LessonBlocks({ blocks }: { blocks: LessonBlock[] }) {
  return (
    <div className="space-y-5">
      {blocks.map((block) => {
        switch (block.type) {
          case "hero":
            return (
              <Card key={block.id} className="bg-[linear-gradient(135deg,#1238c6,#4163e7)] text-white">
                <Badge tone="accent">{block.eyebrow ?? "Lesson"}</Badge>
                <h2 className="mt-4 text-3xl font-bold">{block.title}</h2>
                <p className="mt-3 max-w-3xl text-white/85">{block.body}</p>
              </Card>
            );
          case "rich_text":
            return (
              <Card key={block.id}>
                {block.title ? (
                  <h3 className="font-display text-xl font-bold text-slate-950">{block.title}</h3>
                ) : null}
                <RichHtml html={block.body} className="mt-3" />
              </Card>
            );
          case "embed_video":
            return (
              <Card key={block.id}>
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                  <PlayCircle className="h-4 w-4" />
                  動画 {block.duration}
                </div>
                <h3 className="mt-3 font-display text-xl font-bold text-slate-950">{block.title}</h3>
                <div className="mt-4 overflow-hidden rounded-[24px] border border-black/5">
                  <iframe
                    className="aspect-video w-full"
                    src={block.url}
                    title={block.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </Card>
            );
          case "embed_audio":
            return (
              <Card key={block.id}>
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                  <AudioLines className="h-4 w-4" />
                  音声 {block.duration}
                </div>
                <h3 className="mt-3 font-display text-xl font-bold text-slate-950">{block.title}</h3>
                <div className="mt-4 overflow-hidden rounded-[24px] border border-black/5">
                  <iframe
                    className="h-[232px] w-full"
                    src={block.url}
                    title={block.title}
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  />
                </div>
              </Card>
            );
          case "checklist":
            return (
              <Card key={block.id}>
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                  <CheckCircle2 className="h-4 w-4" />
                  チェックリスト
                </div>
                <h3 className="mt-3 font-display text-xl font-bold text-slate-950">{block.title}</h3>
                <ul className="mt-4 space-y-3">
                  {block.items.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-slate-600">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            );
          case "accordion":
            return (
              <Card key={block.id}>
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                  <ListCollapse className="h-4 w-4" />
                  補足メモ
                </div>
                <h3 className="mt-3 font-display text-xl font-bold text-slate-950">{block.title}</h3>
                <div className="mt-4 space-y-3">
                  {block.items.map((item) => (
                    <details key={item.title} className="rounded-2xl border border-black/8 bg-black/[0.02] p-4">
                      <summary className="cursor-pointer font-semibold text-slate-950">{item.title}</summary>
                      <p className="mt-3 text-slate-600">{item.body}</p>
                    </details>
                  ))}
                </div>
              </Card>
            );
          case "cta":
            return (
              <Card key={block.id} className="border-[var(--color-primary)]/20 bg-[color:rgba(18,56,198,0.05)]">
                <h3 className="font-display text-xl font-bold text-slate-950">{block.title}</h3>
                <p className="mt-3 text-slate-600">{block.body}</p>
                <a href={block.href} className="mt-5 inline-flex">
                  <Button>{block.label}</Button>
                </a>
              </Card>
            );
          case "download":
            return (
              <Card key={block.id}>
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                  <Download className="h-4 w-4" />
                  ダウンロード
                </div>
                <h3 className="mt-3 font-display text-xl font-bold text-slate-950">{block.title}</h3>
                <p className="mt-3 text-slate-600">{block.description}</p>
                <a
                  href={block.href}
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)]"
                >
                  ダウンロードする
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Card>
            );
          case "custom_html":
            return (
              <Card
                key={block.id}
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
