import { env, getAppUrl } from "@/lib/env";
import { escapeHtml, sanitizeUrl } from "@/lib/rich-content";

type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
};

export function isEmailConfigured() {
  return Boolean(env.RESEND_API_KEY && env.RESEND_FROM_EMAIL);
}

export async function sendEmail(params: SendEmailParams) {
  if (!isEmailConfigured()) {
    console.warn("Email delivery skipped because Resend is not configured.", {
      to: params.to,
      subject: params.subject,
    });
    return { delivered: false as const };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.RESEND_FROM_EMAIL,
      to: [params.to],
      subject: params.subject.replace(/[\r\n]+/g, " ").trim(),
      html: params.html,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend request failed: ${response.status} ${body}`);
  }

  return { delivered: true as const };
}

function wrapEmail(title: string, body: string) {
  return `
    <div style="font-family:Arial,sans-serif;background:#f7f5ef;padding:32px;color:#0f172a;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:24px;padding:32px;">
        <div style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#1238c6;font-weight:700;">DDS Members</div>
        <h1 style="margin:16px 0 0;font-size:28px;line-height:1.25;">${escapeHtml(title)}</h1>
        <div style="margin-top:24px;font-size:15px;line-height:1.8;color:#334155;">${body}</div>
        <div style="margin-top:32px;font-size:13px;color:#64748b;">${escapeHtml(getAppUrl())}</div>
      </div>
    </div>
  `;
}

export async function sendReservationConfirmedEmail(params: {
  to: string;
  name: string;
  title: string;
  startsAt: string;
  locationLabel: string;
  joinUrl?: string | null;
  waitlist?: boolean;
}) {
  const actionLabel = params.waitlist ? "待機申込を受け付けました" : "予約が確定しました";
  const safeJoinUrl = sanitizeUrl(params.joinUrl);
  const joinBlock = safeJoinUrl
    ? `<p><a href="${safeJoinUrl}" style="color:#1238c6;font-weight:700;">参加リンクはこちら</a></p>`
    : "";
  const title = escapeHtml(params.title);
  const name = escapeHtml(params.name);
  const startsAt = escapeHtml(params.startsAt);
  const locationLabel = escapeHtml(params.locationLabel);

  return sendEmail({
    to: params.to,
    subject: `DDS ${actionLabel}: ${params.title}`,
    html: wrapEmail(
      actionLabel,
      `
        <p>${name} 様</p>
        <p>${title} の${params.waitlist ? "待機申込" : "予約"}を受け付けました。</p>
        <p>日時: ${startsAt}<br />場所: ${locationLabel}</p>
        ${joinBlock}
      `,
    ),
  });
}

export async function sendReservationCancelledEmail(params: {
  to: string;
  name: string;
  title: string;
  refunded: boolean;
}) {
  const name = escapeHtml(params.name);
  const title = escapeHtml(params.title);
  return sendEmail({
    to: params.to,
    subject: `DDS 予約キャンセル: ${params.title}`,
    html: wrapEmail(
      "予約をキャンセルしました",
      `
        <p>${name} 様</p>
        <p>${title} の予約キャンセルを受け付けました。</p>
        <p>${params.refunded ? "返却期限内のためクレジットを返却しました。" : "返却期限外のためクレジット返却はありません。"}</p>
      `,
    ),
  });
}

export async function sendPasswordSetupEmail(params: {
  to: string;
  name: string;
  link: string;
}) {
  const name = escapeHtml(params.name);
  const safeLink = sanitizeUrl(params.link);
  return sendEmail({
    to: params.to,
    subject: "DDS 初期パスワード設定のご案内",
    html: wrapEmail(
      "パスワードを設定してください",
      `
        <p>${name} 様</p>
        <p>DDS 会員サイトの利用を開始するため、下のボタンからパスワードを設定してください。</p>
        <p><a href="${safeLink}" style="display:inline-flex;padding:12px 18px;border-radius:999px;background:#1238c6;color:#ffffff;font-weight:700;text-decoration:none;">パスワードを設定する</a></p>
        <p>このリンクは1時間有効です。</p>
      `,
    ),
  });
}

export async function sendPasswordResetEmail(params: {
  to: string;
  name: string;
  link: string;
}) {
  const name = escapeHtml(params.name);
  const safeLink = sanitizeUrl(params.link);
  return sendEmail({
    to: params.to,
    subject: "DDS パスワード再設定のご案内",
    html: wrapEmail(
      "パスワードを再設定してください",
      `
        <p>${name} 様</p>
        <p>パスワード再設定のリクエストを受け付けました。下のボタンから新しいパスワードを設定してください。</p>
        <p><a href="${safeLink}" style="display:inline-flex;padding:12px 18px;border-radius:999px;background:#1238c6;color:#ffffff;font-weight:700;text-decoration:none;">新しいパスワードを設定する</a></p>
        <p>このリンクは1時間有効です。</p>
      `,
    ),
  });
}
