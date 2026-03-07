"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

export type FlashType = "success" | "error";

function withFlash(url: URL, message: string, type: FlashType) {
  url.searchParams.set("toast", message);
  url.searchParams.set("toastType", type);
  return `${url.pathname}${url.search}${url.hash}`;
}

export async function redirectWithFlash(
  message: string,
  type: FlashType,
  fallbackPath = "/",
): Promise<never> {
  const headerStore = await headers();
  const referer = headerStore.get("referer");

  if (!referer) {
    redirect(withFlash(new URL(fallbackPath, "http://localhost:3000"), message, type));
  }

  const url = new URL(referer);
  url.searchParams.delete("__flight__");
  redirect(withFlash(url, message, type));
}
