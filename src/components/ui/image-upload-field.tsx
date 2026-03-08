"use client";

import { useEffect, useMemo, useState } from "react";
import { ImagePlus } from "lucide-react";

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
      <div className="rounded-[28px] border border-dashed border-black/12 bg-white p-4">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt="preview"
            className="h-52 w-full rounded-[22px] object-cover"
          />
        ) : (
          <div className="flex h-52 flex-col items-center justify-center rounded-[22px] bg-black/[0.03] text-slate-400">
            <ImagePlus className="h-10 w-10" />
            <div className="mt-3 text-sm font-semibold">画像を選択してください</div>
          </div>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            name={name}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(event) => setFile(event.currentTarget.files?.[0] ?? null)}
            className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-[var(--color-primary)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
          />
          <div className="text-xs leading-6 text-slate-500">{hint}</div>
        </div>
      </div>
    </label>
  );
}
