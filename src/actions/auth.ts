"use server";

import { redirect } from "next/navigation";

import { createDemoSession, destroyDemoSession } from "@/lib/auth";
import { isDemoAuthEnabled } from "@/lib/config";
import { RateLimitError, assertRateLimit } from "@/lib/rate-limit";

export interface LoginActionState {
  error?: string;
}

export async function demoLoginAction(
  _prevState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  if (!isDemoAuthEnabled) {
    return { error: "本番環境ではデモログインを無効化しています。" };
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  try {
    await assertRateLimit(
      { key: "auth:demo-login", limit: 5, windowMs: 60_000 },
      email || "anonymous",
    );
  } catch (error) {
    if (error instanceof RateLimitError) {
      return { error: error.message };
    }
    throw error;
  }

  if (!email || !password) {
    return { error: "メールアドレスとパスワードを入力してください。" };
  }

  const user = await createDemoSession(email, password);

  if (!user) {
    return { error: "認証に失敗しました。デモアカウントを確認してください。" };
  }

  redirect("/post-login");
}

export async function demoLogoutAction() {
  if (!isDemoAuthEnabled) {
    redirect("/login");
  }

  await destroyDemoSession();
  redirect("/login");
}
