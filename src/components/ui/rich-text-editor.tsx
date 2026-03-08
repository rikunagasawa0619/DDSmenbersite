"use client";

import { useEffect, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import {
  Bold,
  Heading2,
  Italic,
  Link2,
  List,
  ListOrdered,
  Pilcrow,
  Quote,
  Redo2,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";

import { cn } from "@/lib/utils";

type RichTextEditorProps = {
  name: string;
  defaultValue?: string;
  placeholder?: string;
  minHeightClassName?: string;
};

const toolbarButtons = [
  { key: "paragraph", label: "本文", icon: Pilcrow },
  { key: "heading", label: "見出し", icon: Heading2 },
  { key: "bold", label: "太字", icon: Bold },
  { key: "italic", label: "斜体", icon: Italic },
  { key: "underline", label: "下線", icon: UnderlineIcon },
  { key: "bullet", label: "箇条書き", icon: List },
  { key: "ordered", label: "番号", icon: ListOrdered },
  { key: "quote", label: "引用", icon: Quote },
  { key: "link", label: "リンク", icon: Link2 },
] as const;

export function RichTextEditor({
  name,
  defaultValue = "",
  placeholder = "本文を入力してください",
  minHeightClassName = "min-h-72",
}: RichTextEditorProps) {
  const [value, setValue] = useState(defaultValue);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: "noopener noreferrer nofollow",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    immediatelyRender: false,
    content: defaultValue,
    onUpdate: ({ editor: nextEditor }) => {
      setValue(nextEditor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          "dds-editor prose prose-slate max-w-none rounded-b-[24px] bg-white px-5 py-4 text-[15px] leading-8 text-slate-900 focus:outline-none",
          minHeightClassName,
        ),
      },
    },
  });

  useEffect(() => {
    if (editor && defaultValue !== editor.getHTML()) {
      editor.commands.setContent(defaultValue || "<p></p>");
    }
  }, [defaultValue, editor]);

  return (
    <div className="overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
      <div className="flex flex-wrap items-center gap-2 border-b border-black/8 bg-black/[0.02] px-4 py-3">
        <button
          type="button"
          onClick={() => editor?.chain().focus().undo().run()}
          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-black/8 bg-white text-slate-600 transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
        >
          <Undo2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().redo().run()}
          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-black/8 bg-white text-slate-600 transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
        >
          <Redo2 className="h-4 w-4" />
        </button>
        <div className="h-8 w-px bg-black/8" />
        {toolbarButtons.map((item) => {
          const Icon = item.icon;
          const active =
            item.key === "paragraph"
              ? editor?.isActive("paragraph")
              : item.key === "heading"
                ? editor?.isActive("heading", { level: 2 })
                : item.key === "bold"
                  ? editor?.isActive("bold")
                  : item.key === "italic"
                    ? editor?.isActive("italic")
                    : item.key === "underline"
                      ? editor?.isActive("underline")
                      : item.key === "bullet"
                        ? editor?.isActive("bulletList")
                        : item.key === "ordered"
                          ? editor?.isActive("orderedList")
                          : item.key === "quote"
                            ? editor?.isActive("blockquote")
                            : editor?.isActive("link");

          const onClick = () => {
            if (!editor) return;
            if (item.key === "paragraph") {
              editor.chain().focus().setParagraph().run();
            } else if (item.key === "heading") {
              editor.chain().focus().toggleHeading({ level: 2 }).run();
            } else if (item.key === "bold") {
              editor.chain().focus().toggleBold().run();
            } else if (item.key === "italic") {
              editor.chain().focus().toggleItalic().run();
            } else if (item.key === "underline") {
              editor.chain().focus().toggleUnderline().run();
            } else if (item.key === "bullet") {
              editor.chain().focus().toggleBulletList().run();
            } else if (item.key === "ordered") {
              editor.chain().focus().toggleOrderedList().run();
            } else if (item.key === "quote") {
              editor.chain().focus().toggleBlockquote().run();
            } else if (item.key === "link") {
              const previous = editor.getAttributes("link").href as string | undefined;
              const href = window.prompt("リンク先 URL を入力してください", previous ?? "https://");
              if (href === null) return;
              if (!href.trim()) {
                editor.chain().focus().unsetLink().run();
                return;
              }
              editor.chain().focus().setLink({ href }).run();
            }
          };

          return (
            <button
              key={item.key}
              type="button"
              onClick={onClick}
              className={cn(
                "inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-semibold transition",
                active
                  ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                  : "border-black/8 bg-white text-slate-700 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </div>
      <EditorContent editor={editor} />
      <input type="hidden" name={name} value={value} />
    </div>
  );
}
