# DDS Release Checklist

公開前と公開直後に確認すべき事項を、非エンジニア向けに整理したチェックリストです。

## 1. 外部サービス

- Vercel プロジェクトを作成し、このリポジトリを紐付ける
- Neon などの本番 Postgres を作成し、`DATABASE_URL` を取得する
- Clerk 本番アプリを作成し、`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` と `CLERK_SECRET_KEY` を取得する
- Resend を使う場合は送信ドメイン認証（SPF / DKIM）を完了し、`RESEND_API_KEY` と `RESEND_FROM_EMAIL` を用意する
- Sentry を使う場合はプロジェクトを作成し、DSN と upload 用トークンを用意する
- Upstash Redis を使う場合は REST URL と TOKEN を取得する
- カスタムドメインを使う場合は DNS 設定を完了する

## 2. Vercel 環境変数

最低限、以下を登録する。

- `NEXT_PUBLIC_APP_URL`
- `DATABASE_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CLERK_SIGN_IN_FORCE_REDIRECT_URL=/post-login`
- `CLERK_SIGN_UP_FORCE_REDIRECT_URL=/post-login`
- `CRON_SECRET`

必要に応じて追加する。

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_AUTH_TOKEN`
- `SENTRY_ORG`
- `SENTRY_PROJECT`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

## 3. データベース初期化

- `npm run db:migrate:deploy` を本番 DB に対して実行する
- `SEED_FORCE=1 npm run db:seed` を必要な初期データ投入時だけ実行する
- 初回管理者の `User` レコードを用意する
- 管理者メールアドレスが Clerk 側のメールアドレスと一致していることを確認する

## 4. Clerk 設定

- ログイン方法をメール + パスワードで有効化する
- 本番ドメインを Allowed Origins / Redirects に登録する
- 招待メール文面を必要に応じて調整する
- 可能ならメール認証を必須にする
- 管理者アカウントには MFA を有効にする

## 5. 公開前の動作確認

- `/login` が表示される
- 管理者ログイン後に `/admin` へ遷移する
- 受講生ログイン後に `/app` へ遷移する
- 停止アカウントが `/access-denied` に誘導される
- `/privacy` `/terms` `/tokushoho` が未ログインでも見られる
- `/api/health` が `ok` または `degraded` を返す
- 管理画面で会員追加時に Clerk 招待が飛ぶ
- 講義予約でクレジット消費、キャンセル返却、待機繰上げが正しく動く
- `ON_ATTEND` 枠で参加済み / 欠席処理が正しく台帳反映される
- メール通知が実際に届く
- `robots.txt` がクロール拒否になっている

## 6. 監視と運用

- Vercel の Cron が `/api/cron/monthly-credits` を叩けることを確認する
- `/api/health` を Uptime 監視サービスに登録する
- Sentry を使う場合はテストエラーを 1 件送って受信確認する
- Neon など DB 側の自動バックアップ設定を確認する
- [BACKUP_AND_RESTORE.md](/Users/nagasawariku/Library/CloudStorage/GoogleDrive-rikunagasawa0619@gmail.com/マイドライブ/claude%20code/Codex/docs/BACKUP_AND_RESTORE.md) に沿って復元手順を一度確認する

## 7. 事業・法務まわり

- プライバシーポリシーの運営者情報が正しい
- 利用規約のキャンセル / 返金ポリシーが運用ルールと一致している
- 特商法表記の事業者情報が正しい
- 問い合わせ先メールアドレスが有効で返信できる
- 必要なら cookie / analytics 同意バナーが法務要件に合っているか確認する

## 8. 公開直後の確認

- 実会員 1 名でログイン確認
- 実管理者 1 名で管理画面確認
- 予約 1 件、キャンセル 1 件、教材完了 1 件を実施
- CSV エクスポートが開ける
- 監査ログに主要操作が残る
- エラーや 500 が出ていないか Sentry / Vercel Logs を確認する

## 9. 今後の優先候補

- Playwright などの E2E テスト
- ステージング環境
- 管理画面のより細かい権限制御
- 画像アップロードの本格運用
- 請求 / 決済連携
