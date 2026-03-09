"use client";

import { useEffect, useMemo, useState } from "react";
import { ImagePlus, Upload } from "lucide-react";

type ImageUploadFieldProps = {
  name: string;
  label?: string;
  hint?: string;
  defaultUrl?: string;
};

export function ImageUploadField({
  name,
  label = "サムネイル画像",
  hint = "PNG / JPG / WebP 推奨、5MB以内",
  defaultUrl,
}: ImageUploadFieldProps) {
  const [file, setFile] = useState<File | null>(null);
  const previewUrl = useMemo(() => {
    if (!file) {
      return defaultUrl;
    }

    return URL.createObjectURL(file);
  }, [defaultUrl, file]);

  useEffect(() => {
    return () => {
      if (file) {
        URL.revokeObjectURL(previewUrl ?? "");
      }
    };
  }, [file, previewUrl]);

  return (
    <label className="grid gap-3">
      <span className="text-sm font-semibold text-slate-500">{label}</span>
      <div className="rounded-[30px] border border-dashed border-black/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.86),rgba(247,243,234,0.9))] p-4">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt="preview"
            className="h-56 w-full rounded-[24px] object-cover"
          />
        ) : (
          <div className="flex h-56 flex-col items-center justify-center rounded-[24px] border border-black/8 bg-white/55 text-slate-400">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(45,91,255,0.1)] text-[var(--color-primary)]">
              <ImagePlus className="h-7 w-7" />
            </div>
            <div className="mt-4 font-display text-sm font-extrabold uppercase tracking-[0.12em] text-slate-700">
              Image upload
            </div>
            <div className="mt-2 text-xs text-slate-500">JPG / PNG / WebP / GIF</div>
          </div>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            name={name}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(event) => setFile(event.currentTarget.files?.[0] ?? null)}
            className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-[var(--color-primary)] file:px-4 file:py-2 file:font-display file:text-xs file:font-extrabold file:uppercase file:tracking-[0.14em] file:text-white"
          />
          <div className="inline-flex items-center gap-2 rounded-full border border-black/8 bg-white/75 px-3 py-2 text-xs text-slate-500">
            <Upload className="h-3.5 w-3.5" />
            {hint}
          </div>
          {file ? (
            <div className="text-xs font-semibold text-slate-600">{file.name}</div>
          ) : null}
        </div>
      </div>
    </label>
  );
}
