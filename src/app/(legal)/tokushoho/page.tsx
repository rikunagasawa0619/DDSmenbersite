import type { Metadata } from "next";

import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "特定商取引法に基づく表記 | DDS Members",
  description: "特定商取引法に基づく表記",
};

export default function TokushohoPage() {
  return (
    <Card>
      <h1 className="font-display text-3xl font-bold text-slate-950">
        特定商取引法に基づく表記
      </h1>

      <div className="mt-8 space-y-6 text-sm leading-7 text-slate-600">
        <table className="w-full">
          <tbody className="divide-y divide-black/6">
            {[
              ["販売事業者名", "（事業者名を記入してください）"],
              ["代表者", "（代表者名を記入してください）"],
              ["所在地", "（住所を記入してください）"],
              ["連絡先", "（メールアドレス・電話番号を記入してください）"],
              ["販売価格", "各プランの料金ページに記載"],
              ["支払方法", "（決済手段を記入してください）"],
              ["支払時期", "（支払時期を記入してください）"],
              ["商品の引渡し時期", "決済確認後、即時にアカウントが有効化されます"],
              ["返品・キャンセル", "デジタルサービスの性質上、原則として返品・返金は承っておりません。予約のキャンセルは利用規約に基づきます。"],
            ].map(([label, value]) => (
              <tr key={label}>
                <th className="w-40 py-4 text-left font-semibold text-slate-950 align-top">
                  {label}
                </th>
                <td className="py-4">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="text-xs text-slate-400">
          上記の「（）」内の項目は、事業者情報に合わせて更新してください。
        </p>
      </div>
    </Card>
  );
}
