import type { Metadata } from "next";

import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "プライバシーポリシー | DDS Members",
  description: "DDS会員サイトにおける個人情報の取り扱いについて",
};

export default function PrivacyPolicyPage() {
  return (
    <Card>
      <h1 className="font-display text-3xl font-bold text-slate-950">
        プライバシーポリシー
      </h1>
      <p className="mt-4 text-sm text-slate-500">最終更新日: 2025年1月1日</p>

      <div className="mt-8 space-y-8 text-sm leading-7 text-slate-600">
        <section>
          <h2 className="text-lg font-bold text-slate-950">1. 個人情報の収集</h2>
          <p className="mt-3">
            当サイトでは、サービスの提供にあたり、以下の個人情報を収集することがあります。
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>氏名</li>
            <li>メールアドレス</li>
            <li>利用履歴（予約履歴、教材閲覧履歴、クレジット利用履歴）</li>
            <li>Cookie 等のアクセス情報</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-950">2. 個人情報の利用目的</h2>
          <p className="mt-3">収集した個人情報は、以下の目的で利用します。</p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>会員サービスの提供・運営</li>
            <li>予約・クレジット管理</li>
            <li>お知らせやイベント情報の配信</li>
            <li>サービスの改善・新機能の開発</li>
            <li>お問い合わせへの対応</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-950">3. 個人情報の第三者提供</h2>
          <p className="mt-3">
            法令に基づく場合を除き、ご本人の同意なく個人情報を第三者に提供することはありません。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-950">4. 個人情報の管理</h2>
          <p className="mt-3">
            個人情報の漏洩・滅失・毀損を防止するため、適切なセキュリティ対策を実施します。
            データは暗号化された通信経路（SSL/TLS）を通じて送受信されます。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-950">5. Cookie の利用</h2>
          <p className="mt-3">
            当サイトでは、認証状態の維持およびサービスの利便性向上のために Cookie を使用します。
            ブラウザの設定により Cookie の受け入れを拒否することも可能ですが、
            一部サービスが正常に動作しなくなる場合があります。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-950">6. 個人情報の開示・訂正・削除</h2>
          <p className="mt-3">
            ご本人から個人情報の開示・訂正・削除の要求があった場合は、
            本人確認の上、合理的な期間内に対応いたします。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-950">7. お問い合わせ</h2>
          <p className="mt-3">
            個人情報の取扱いに関するお問い合わせは、サイト管理者までご連絡ください。
          </p>
        </section>
      </div>
    </Card>
  );
}
