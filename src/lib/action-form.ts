import { z } from "zod";

import { redirectWithFlash } from "@/lib/flash";

function formatIssueMessage(issue: z.ZodIssue) {
  if (issue.message) {
    return issue.message;
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
