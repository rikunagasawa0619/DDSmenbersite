"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { createDemoSession, destroyDemoSession, requireUser } from "@/lib/auth";
import { buildAbsoluteUrl } from "@/lib/env";
import {
  isEmailConfigured,
  sendPasswordResetEmail,
  sendPasswordSetupEmail,
} from "@/lib/email";
import { redirectWithFlash } from "@/lib/flash";
import { createMemberSession, destroyMemberSession } from "@/lib/member-session";
import { createPasswordResetToken, hashPassword, hashPasswordResetToken, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { RateLimitError, assertRateLimit } from "@/lib/rate-limit";

export interface LoginActionState {
  error?: string;
}

export interface PasswordRequestActionState {
  error?: string;
  success?: string;
}

export interface PasswordUpdateActionState {
  error?: string;
  success?: string;
}

const loginSchema = z.object({
  email: z.email("メールアドレスの形式が正しくありません。"),
  password: z.string().min(1, "パスワードを入力してください。"),
});

const passwordSchema = z
  .object({
    password: z
      .string()
      .min(8, "パスワードは8文字以上で入力してください。")
      .max(128, "パスワードが長すぎます。"),
    passwordConfirm: z.string().min(1, "確認用パスワードを入力してください。"),
  })
  .refine((values) => values.password === values.passwordConfirm, {
    path: ["passwordConfirm"],
    message: "確認用パスワードが一致しません。",
  });

async function issuePasswordSetup(userId: string, email: string, name: string) {
  const db = prisma;
  if (!db || !isEmailConfigured()) {
    return false;
  }

  const token = createPasswordResetToken();
  const tokenHash = hashPasswordResetToken(token);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

  await db.user.update({
    where: { id: userId },
    data: {
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: expiresAt,
    },
  });

  await sendPasswordSetupEmail({
    to: email,
    name,
    link: buildAbsoluteUrl(`/reset-password?token=${encodeURIComponent(token)}`),
  });

  return true;
}

export async function loginAction(
  _prevState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const db = prisma;
  if (!db) {
    return { error: "ログイン設定の初期化が完了していません。" };
  }

  const parsed = loginSchema.safeParse({
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "入力内容を確認してください。" };
  }

  try {
    await assertRateLimit(
      { key: "auth:member-login", limit: 5, windowMs: 60_000 },
      parsed.data.email,
    );
  } catch (error) {
    if (error instanceof RateLimitError) {
      return { error: error.message };
    }
    throw error;
  }

  const user = await db.user.findUnique({
    where: { email: parsed.data.email },
    select: {
      id: true,
      passwordHash: true,
      status: true,
    },
  });

  if (!user?.passwordHash) {
    return {
      error:
        "このアカウントはまだパスワード設定が完了していません。パスワード再設定から初期設定を行ってください。",
    };
  }

  const isValid = await verifyPassword(parsed.data.password, user.passwordHash);

  if (!isValid) {
    return { error: "メールアドレスまたはパスワードが正しくありません。" };
  }

  if (user.status === "PAUSED" || user.status === "WITHDRAWN" || user.status === "SUSPENDED") {
    redirect(`/access-denied?reason=${user.status.toLowerCase()}`);
  }

  await createMemberSession(user.id);
  redirect("/app");
}

export async function requestPasswordResetAction(
  _prevState: PasswordRequestActionState,
  formData: FormData,
): Promise<PasswordRequestActionState> {
  const db = prisma;
  if (!db) {
    return { error: "データベースの接続後に利用できます。" };
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const parsed = z.email("メールアドレスの形式が正しくありません。").safeParse(email);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "メールアドレスを確認してください。" };
  }

  try {
    await assertRateLimit(
      { key: "auth:password-reset", limit: 3, windowMs: 60_000 },
      email,
    );
  } catch (error) {
    if (error instanceof RateLimitError) {
      return { error: error.message };
    }
    throw error;
  }

  const genericSuccess =
    "入力したメールアドレスに再設定案内を送信しました。届かない場合は迷惑メールも確認してください。";

  if (!isEmailConfigured()) {
    return {
      success:
        "再設定メールは現在準備中です。運営に連絡するか、管理画面からパスワード設定を依頼してください。",
    };
  }

  const user = await db.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      status: true,
    },
  });

  if (!user || user.status === "WITHDRAWN" || user.status === "SUSPENDED") {
    return { success: genericSuccess };
  }

  const token = createPasswordResetToken();
  const tokenHash = hashPasswordResetToken(token);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

  await db.user.update({
    where: { id: user.id },
    data: {
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: expiresAt,
    },
  });

  await sendPasswordResetEmail({
    to: user.email,
    name: user.name,
    link: buildAbsoluteUrl(`/reset-password?token=${encodeURIComponent(token)}`),
  });

  return { success: genericSuccess };
}

export async function resetPasswordAction(
  _prevState: PasswordUpdateActionState,
  formData: FormData,
): Promise<PasswordUpdateActionState> {
  const db = prisma;
  if (!db) {
    return { error: "データベースの接続後に利用できます。" };
  }

  const token = String(formData.get("token") ?? "").trim();
  if (!token) {
    return { error: "再設定トークンが見つかりません。" };
  }

  const parsed = passwordSchema.safeParse({
    password: String(formData.get("password") ?? ""),
    passwordConfirm: String(formData.get("passwordConfirm") ?? ""),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "パスワードを確認してください。" };
  }

  const tokenHash = hashPasswordResetToken(token);
  const user = await db.user.findFirst({
    where: {
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: { gt: new Date() },
    },
    select: {
      id: true,
    },
  });

  if (!user) {
    return { error: "再設定リンクの有効期限が切れているか、無効です。" };
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashPassword(parsed.data.password),
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
    },
  });

  await createMemberSession(user.id);
  redirect("/app");
}

export async function updatePasswordAction(
  _prevState: PasswordUpdateActionState,
  formData: FormData,
): Promise<PasswordUpdateActionState> {
  const db = prisma;
  if (!db) {
    return { error: "データベースの接続後に利用できます。" };
  }

  const member = await requireUser();
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const parsed = passwordSchema.safeParse({
    password: String(formData.get("password") ?? ""),
    passwordConfirm: String(formData.get("passwordConfirm") ?? ""),
  });

  if (!currentPassword) {
    return { error: "現在のパスワードを入力してください。" };
  }

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "パスワードを確認してください。" };
  }

  const user = await db.user.findUnique({
    where: { id: member.id },
    select: {
      passwordHash: true,
    },
  });

  if (!user?.passwordHash) {
    return { error: "パスワード設定がまだ完了していません。" };
  }

  const isCurrentValid = await verifyPassword(currentPassword, user.passwordHash);

  if (!isCurrentValid) {
    return { error: "現在のパスワードが正しくありません。" };
  }

  await db.user.update({
    where: { id: member.id },
    data: {
      passwordHash: await hashPassword(parsed.data.password),
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
    },
  });

  return { success: "パスワードを更新しました。" };
}

export async function sendPasswordSetupAction(userId: string) {
  const db = prisma;
  if (!db) {
    return redirectWithFlash("データベースの接続後に利用できます。", "error", "/admin/members");
  }

  const actor = await requireUser();
  if (actor.role !== "super_admin" && actor.role !== "staff") {
    await redirectWithFlash("この操作を実行する権限がありません。", "error", "/admin/members");
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });

  if (!user) {
    return redirectWithFlash("会員が見つかりません。", "error", "/admin/members");
  }

  if (!isEmailConfigured()) {
    return redirectWithFlash("メール送信設定が未完了です。", "error", `/admin/members/${userId}`);
  }

  await issuePasswordSetup(user.id, user.email, user.name);
  return redirectWithFlash("初期設定メールを送信しました。", "success", `/admin/members/${userId}`);
}

export async function logoutAction() {
  await destroyMemberSession();
  await destroyDemoSession();
  redirect("/login");
}

export async function demoLoginAction(
  _prevState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
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
