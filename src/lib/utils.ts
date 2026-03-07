import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import { appTimeZone } from "@/lib/datetime";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string, locale = "ja-JP") {
  return new Intl.DateTimeFormat(locale, {
    timeZone: appTimeZone,
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function formatDateOnly(date: string, locale = "ja-JP") {
  return new Intl.DateTimeFormat(locale, {
    timeZone: appTimeZone,
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function percent(value: number) {
  return `${Math.round(value)}%`;
}

export function absoluteUrl(pathname: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return new URL(pathname, base).toString();
}
