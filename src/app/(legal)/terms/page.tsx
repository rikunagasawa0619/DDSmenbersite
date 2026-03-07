import type { Metadata } from "next";

import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "利用規約 | DDS Members",
  description: "DDS会員サイトの利用規約",
};

export default function TermsPage() {
  return (
    <Card>
      <h1 className="font-display text-3xl font-bold text-slate-950">
        利用規約
      </h1>
      <p className="mt-4 text-sm text-slate-500">最終更新日: 2025年1月1日</p>

      <div className="mt-8 space-y-8 text-sm leading-7 text-slate-600">
        <section>
          <h2 className="text-lg font-bold text-slate-950">第1条（適用）</h2>
          <p className="mt-3">
            本規約は、DDS会員サイト（以下「本サービス」）の利用に関する条件を定めるものです。
            会員登録を行ったすべてのユーザー（以下「会員」）に適用されます。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-950">第2条（会員登録）</h2>
          <p className="mt-3">
            本サービスの利用を希望する方は、所定の方法により会員登録を行い、
            運営者の承認を得る必要があります。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-950">第3条（プランとクレジット）</h2>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>会員にはプラン（Hobby / Biz / Pro）に応じたクレジットが毎月付与されます。</li>
            <li>未使用クレジットはプランごとに定められた上限まで繰り越し可能です。</li>
            <li>Pro プランの会員は予約に対してクレジット消費なしで利用できます。</li>
            <li>クレジットの有効期限・繰越上限はプラン変更時にリセットされる場合があります。</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-950">第4条（予約とキャンセル）</h2>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>予約確定時にクレジットが消費されます（ON_CONFIRM モードの場合）。</li>
            <li>返却期限内のキャンセルに限り、クレジットが返却されます。</li>
            <li>返却期限を過ぎたキャンセルでは、クレジットは返却されません。</li>
            <li>定員超過時は待機リストに登録され、空きが出た際に自動で繰り上がります。</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-950">第5条（禁止事項）</h2>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>アカウントの貸与・譲渡</li>
            <li>教材コンテンツの無断複製・再配布</li>
            <li>サービスの運営を妨げる行為</li>
            <li>他の会員への迷惑行為</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-950">第6条（退会）</h2>
          <p className="mt-3">
            会員は、所定の手続きにより退会することができます。
            退会時に残存するクレジットは失効し、返金は行いません。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-950">第7条（免責事項）</h2>
          <p className="mt-3">
            運営者は、本サービスの中断・停止・変更等により会員に損害が生じた場合でも、
            故意または重大な過失がない限り責任を負いません。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-950">第8条（規約の変更）</h2>
          <p className="mt-3">
            運営者は、必要に応じて本規約を変更できるものとします。
            変更後の規約は、本サイト上に掲示した時点から効力を生じます。
          </p>
        </section>
      </div>
    </Card>
  );
}
