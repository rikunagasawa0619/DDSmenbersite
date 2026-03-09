import { z } from "zod";

import { redirectWithFlash } from "@/lib/flash";

const fieldLabelMap: Record<string, string> = {
  title: "タイトル",
  subject: "件名",
  summary: "要約",
  body: "本文",
  bodyHtml: "本文",
  name: "氏名",
  email: "メールアドレス",
  role: "ロール",
  status: "ステータス",
  planCode: "プラン",
  company: "会社名",
  creditGrantBaseDate: "自動付与の基準日",
  minimumPlanCode: "対象プラン",
  amount: "増減数",
  note: "理由",
  startsAt: "開始日時",
  endsAt: "終了日時",
  capacity: "定員",
  creditRequired: "必要クレジット",
  category: "カテゴリ",
  question: "質問",
  answer: "回答",
  moduleId: "章",
  courseId: "コース",
  lessonType: "講義形式",
  scheduledAt: "予約配信日時",
  href: "URL",
  ctaHref: "遷移先URL",
  ctaLabel: "ボタン文言",
};

function labelForIssue(issue: z.ZodIssue) {
  const key = [...issue.path].reverse().find((segment) => typeof segment === "string");
  if (!key || typeof key !== "string") {
    return "入力内容";
  }

  return fieldLabelMap[key] ?? key;
}

function formatIssueMessage(issue: z.ZodIssue) {
  const label = labelForIssue(issue);

  if (issue.code === "invalid_type") {
    return `${label}を入力してください。`;
  }

  if (issue.code === "too_small") {
    const minimum = "minimum" in issue ? issue.minimum : undefined;
    if (typeof minimum === "number" && minimum > 1) {
      return `${label}は${minimum}${issue.origin === "string" ? "文字" : ""}以上で入力してください。`;
    }
    return `${label}を入力してください。`;
  }

  if (issue.code === "invalid_format") {
    return `${label}の形式が正しくありません。`;
  }

  return "入力内容を確認してください。";
}

export async function parseOrRedirect<TSchema extends z.ZodType>(
  schema: TSchema,
  input: unknown,
  fallbackPath: string,
): Promise<z.output<TSchema>> {
  const parsed = schema.safeParse(input);
  if (parsed.success) {
    return parsed.data;
  }

  await redirectWithFlash(formatIssueMessage(parsed.error.issues[0]), "error", fallbackPath);
  throw new Error("Unreachable");
}
