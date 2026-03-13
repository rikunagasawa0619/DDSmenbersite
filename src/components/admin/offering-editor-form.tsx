"use client";

import { createOfferingAction } from "@/actions/admin";
import { ImageUploadField } from "@/components/ui/image-upload-field";
import { SubmitButton } from "@/components/ui/submit-button";

const minimumPlanOptions = [
  { value: "HOBBY", label: "DDS Hobby 以上" },
  { value: "BIZ", label: "DDS Biz 以上" },
  { value: "PRO", label: "DDS Pro のみ" },
];

export function getDefaultOfferingStartValue(value?: string) {
  if (value && /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/.test(value)) {
    return value.includes("T") ? value : `${value}T20:00`;
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}T20:00`;
}

export function OfferingEditorForm({
  defaultStart,
}: {
  defaultStart: string;
}) {
  return (
    <form action={createOfferingAction} className="dds-admin-form grid gap-5" encType="multipart/form-data">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="dds-admin-label">
          <span className="text-sm font-semibold text-slate-500">募集枠タイトル</span>
          <input name="title" placeholder="例: 3月グループコンサル" className="dds-admin-input" required minLength={2} />
        </label>
        <label className="dds-admin-label">
          <span className="text-sm font-semibold text-slate-500">種別</span>
          <select name="offeringType" className="dds-admin-select">
            <option value="BOOKING">講義予約</option>
            <option value="EVENT">イベント</option>
          </select>
        </label>
      </div>

      <label className="dds-admin-label">
        <span className="text-sm font-semibold text-slate-500">一覧用の要約</span>
        <textarea name="summary" placeholder="カレンダーや一覧カードに表示する短い説明" className="dds-admin-textarea min-h-24" required minLength={2} />
      </label>

      <label className="dds-admin-label">
        <span className="text-sm font-semibold text-slate-500">詳細説明</span>
        <textarea name="description" placeholder="参加対象、内容、持ち物、注意事項などを記載" className="dds-admin-textarea min-h-32" required minLength={2} />
      </label>

      <ImageUploadField name="thumbnailFile" label="募集枠サムネイル" hint="カード表示用。Cloudflare R2 に保存します。" />

      <div className="grid gap-4 md:grid-cols-2">
        <label className="dds-admin-label">
          <span className="text-sm font-semibold text-slate-500">開始日時</span>
          <input name="startsAt" type="datetime-local" defaultValue={defaultStart} className="dds-admin-input" required />
        </label>
        <label className="dds-admin-label">
          <span className="text-sm font-semibold text-slate-500">終了日時</span>
          <input name="endsAt" type="datetime-local" className="dds-admin-input" />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="dds-admin-label">
          <span className="text-sm font-semibold text-slate-500">開催場所</span>
          <input name="locationLabel" placeholder="Zoom / 渋谷 / 大阪" className="dds-admin-input" />
        </label>
        <label className="dds-admin-label">
          <span className="text-sm font-semibold text-slate-500">講師 / 主催</span>
          <input name="host" placeholder="講師名" className="dds-admin-input" />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="dds-admin-label">
          <span className="text-sm font-semibold text-slate-500">定員</span>
          <input name="capacity" type="number" defaultValue={20} className="dds-admin-input" min={1} required />
        </label>
        <label className="dds-admin-label">
          <span className="text-sm font-semibold text-slate-500">必要クレジット</span>
          <input name="creditRequired" type="number" defaultValue={1} className="dds-admin-input" min={0} required />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="dds-admin-label">
          <span className="text-sm font-semibold text-slate-500">クレジット消費タイミング</span>
          <select name="consumptionMode" className="dds-admin-select">
            <option value="ON_CONFIRM">予約確定時に消費</option>
            <option value="ON_ATTEND">参加済みにしたときに消費</option>
          </select>
        </label>
        <label className="dds-admin-label">
          <span className="text-sm font-semibold text-slate-500">対象プラン</span>
          <select name="minimumPlanCode" className="dds-admin-select">
            {minimumPlanOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="dds-admin-label">
          <span className="text-sm font-semibold text-slate-500">返却期限</span>
          <input name="refundDeadline" type="datetime-local" className="dds-admin-input" />
        </label>
        <label className="dds-admin-label">
          <span className="text-sm font-semibold text-slate-500">表示ラベル</span>
          <input name="priceLabel" placeholder="例: 1クレジット / 無料" className="dds-admin-input" />
        </label>
      </div>

      <label className="dds-admin-label">
        <span className="text-sm font-semibold text-slate-500">参加URL（任意）</span>
        <input name="externalJoinUrl" placeholder="Zoom URL など" className="dds-admin-input" />
      </label>

      <div className="grid gap-3 rounded-[24px] bg-black/[0.03] p-4 text-sm text-slate-700 md:grid-cols-2">
        <label className="inline-flex items-center gap-3">
          <input type="checkbox" name="waitlistEnabled" defaultChecked />
          満席時は待機受付を有効にする
        </label>
        <label className="inline-flex items-center gap-3">
          <input type="checkbox" name="featured" />
          ホームに優先表示する
        </label>
      </div>

      <div className="flex justify-end">
        <SubmitButton pendingLabel="作成中...">募集枠を保存</SubmitButton>
      </div>
    </form>
  );
}
