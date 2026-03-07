# Backup And Restore

## 対象

- Neon Postgres 本番DB
- Vercel 環境変数
- Clerk 設定
- Cloudflare R2 バケット設定

## 日常運用

1. Neon の自動バックアップと Point-in-Time Restore を有効にする。
2. 本番反映前に Prisma schema の変更差分を確認する。
3. `SEED_FORCE=1` を本番で常用しない。
4. Vercel の環境変数は変更履歴を残せる運用フローにする。

## 復旧手順

1. 障害発生時刻を特定する。
2. Neon で障害直前の復旧ポイントを選ぶ。
3. 復旧用DBを別名で作成し、アプリをすぐに切り替えず検証する。
4. `npm run prisma:generate` と `npm run build` が通ることを確認する。
5. 管理者ログイン、会員ログイン、予約、キャンセル、教材閲覧を検証する。
6. 問題なければ `DATABASE_URL` を復旧先へ切り替える。
7. 切り替え後に監査ログ、予約、クレジット残高が整合しているか確認する。

## 定期点検

- 月1回: 復旧演習をステージングで実施
- 週1回: Neon バックアップ保持状態を確認
- 反映ごと: Clerk キー、Resend キー、R2 キーの棚卸し
