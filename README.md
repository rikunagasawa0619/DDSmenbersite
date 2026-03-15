# DDS Member Site

DDS会員サイト v1 の実装ベースです。

- `Next.js 16 App Router`
- `TypeScript`
- `Tailwind CSS v4`
- `ローカル会員認証`（本番）/ デモ認証（開発用）
- `Prisma 6`（Neon/Postgres 想定）
- `Vitest`
- `Vercel Analytics`

## セットアップ（ローカル開発）

```bash
# 1. 依存関係を入れる（postinstall で prisma generate も実行される）
npm install

# 2. 環境変数を用意する
cp .env.example .env.local

# 3. 開発サーバーを起動する
npm run dev
```

`DATABASE_URL` がないローカル開発ではデモモードで動作します。本番環境ではデモ認証は自動で無効になります。

## 環境変数一覧

| 変数名 | 必須 | 説明 |
|--------|------|------|
| `NEXT_PUBLIC_APP_URL` | ○ | アプリの公開URL |
| `CRON_SECRET` | 月次付与自動実行時 | `/api/cron/monthly-credits` を保護する共通シークレット |
| `MEMBER_SESSION_SECRET` | 任意 | ログインセッション署名用。未設定時は `CRON_SECRET` を流用 |
| `DATABASE_URL` | 本番時 | Postgres 接続文字列 |
| `R2_ACCOUNT_ID` | 画像アップロード時 | Cloudflare R2 アカウントID |
| `R2_ACCESS_KEY_ID` | 画像アップロード時 | R2 アクセスキー |
| `R2_SECRET_ACCESS_KEY` | 画像アップロード時 | R2 シークレットキー |
| `R2_BUCKET` | 画像アップロード時 | R2 バケット名 |
| `R2_PUBLIC_BASE_URL` | 任意 | 公開用 CDN / カスタムドメイン。未設定時は `/api/assets/:id` 経由で配信 |
| `RESEND_API_KEY` | メール配信時 | Resend メール送信キー |
| `RESEND_FROM_EMAIL` | メール通知時 | 送信元メールアドレス |

## デモ認証

デモ認証はローカル開発専用です。本番環境では自動的に無効化されます。

Clerk 未設定時はデモログインが使えます。

- 管理者: `admin@dds.example` / `admin-demo`
- スタッフ: `staff@dds.example` / `staff-demo`
- 受講生: `hobby@dds.example` / `student-demo`
- Pro会員: `pro@dds.example` / `student-demo`

## データベース

`DATABASE_URL` を設定した上で以下を実行してください。

```bash
npm run db:push     # ローカル開発用にスキーマを即時反映
npm run db:migrate:deploy  # 本番・ステージングで migration を適用
npm run db:seed     # 初期データ投入
```

> seed スクリプトは本番環境（`NODE_ENV=production` または非 localhost DB）では `SEED_FORCE=1` を要求します。

## 本番デプロイ手順（Vercel）

### 1. 外部サービスの準備

- **Neon**: Postgres データベースを作成し、接続文字列を取得
- **Resend**: 予約確認・キャンセル通知を使う場合は API Key と送信元アドレスを取得

### 2. Vercel に環境変数を登録

```
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
CRON_SECRET=strong-random-secret
MEMBER_SESSION_SECRET=another-strong-random-secret
DATABASE_URL=postgresql://...
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=...
R2_PUBLIC_BASE_URL=https://cdn.example.com
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=notify@example.com
NEXT_PUBLIC_SENTRY_DSN=https://...
SENTRY_AUTH_TOKEN=...
SENTRY_ORG=...
SENTRY_PROJECT=...
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

### 3. デプロイ

Vercel に Git リポジトリを接続してデプロイ。`postinstall` で `prisma generate` が自動実行されます。

### 4. 初回データベースセットアップ

```bash
# ローカルから本番DBに接続して実行
DATABASE_URL="postgresql://..." npm run db:migrate:deploy
DATABASE_URL="postgresql://..." SEED_FORCE=1 npm run db:seed
```

### 5. 管理者アカウント

`User` レコードを `SUPER_ADMIN` または `STAFF` で作成し、会員追加または会員詳細画面から初期パスワード設定メールを送ってください。

## 認証・認可の仕組み

- **ローカル会員認証**: `User.passwordHash` と署名付き HTTP-only cookie でログインを管理
- **Server Actions / Layout 保護**: `getCurrentUser()` と `requireAdmin()` で会員画面・管理画面を保護
- **Audience フィルタリング**: プラン（Hobby/Biz/Pro）に応じてコンテンツを出し分け

## 現在の実装範囲

- 会員画面: ホーム / お得情報 / イベント / ツール / 講義予約 / オンライン教材 / FAQ
- 会員画面: プロフィール編集、パスワード変更、トースト通知、学習進捗保存、残クレジット表示
- 管理画面: 会員追加 / 初期設定メール再送 / プラン変更 / クレジット付与・補正 / テーマ設定 / バナー追加 / お知らせ追加 / 募集枠追加 / 監査ログ / CSV 出力
- 管理画面: モーダル型エディター、リッチテキスト編集、画像アップロード、カレンダー起点の募集枠作成、メール配信の今すぐ送信
- 予約機能: 定員、待機、予約確定時消費、返却期限内キャンセル、待機繰上げ、メール通知
- 出欠管理: `ON_ATTEND` 枠の参加済み / 欠席処理と、そのタイミングでのクレジット消費
- 学習機能: レッスン詳細表示、完了記録、コース進捗集計
- 本番品質: エラーページ、ローディングスケルトン、OGP、セキュリティヘッダー、環境変数バリデーション、簡易レート制限
- 本番品質: エラーページ、ローディングスケルトン、OGP、`robots.txt`、セキュリティヘッダー、環境変数バリデーション、簡易レート制限、Sentry 接続口

## 運用メモ

- レート制限は現状アプリ内メモリで行っています。単一インスタンスや小規模運用では有効ですが、厳密な分散制御が必要なら Redis 系へ切り替えてください。
- `UPSTASH_REDIS_REST_URL` と `UPSTASH_REDIS_REST_TOKEN` を設定すると、レート制限は Upstash Redis に切り替わります。
- 予約確認 / キャンセルメールは `RESEND_API_KEY` と `RESEND_FROM_EMAIL` が設定されている場合のみ送信されます。
- 告知メール配信も `RESEND_API_KEY` と `RESEND_FROM_EMAIL` が必要です。今すぐ送信は管理画面から実行できます。予約配信は `/api/cron/email-campaigns` を GitHub Actions から 30 分ごとに叩く構成を同梱しています。GitHub Secrets に `DDS_CRON_URL` と `DDS_CRON_SECRET` を登録してください。
- 監査ログ UI は `/admin/audit-logs`、CSV 出力は `/admin/exports` です。
- 月次クレジット付与は管理画面 `/admin/plans` から手動実行できます。本番では `vercel.json` の cron で `/api/cron/monthly-credits` を実行し、`CRON_SECRET` を設定してください。Vercel は `Authorization: Bearer <CRON_SECRET>` を自動付与します。
- 画像アップロードは Cloudflare R2 前提です。画像本体は DB に入れず、DB にはメタデータと URL だけを保存するため、記事やバナーが増えても DB コストは膨らみにくい構成です。
- ヘルスチェックは `/api/health` です。DB / Clerk / メール設定の到達性を返します。
- 認証済みでも会員データ未登録、または停止中アカウントは `/access-denied` へ誘導されます。
- バックアップ手順は [docs/BACKUP_AND_RESTORE.md](/Users/nagasawariku/Library/CloudStorage/GoogleDrive-rikunagasawa0619@gmail.com/マイドライブ/claude%20code/Codex/docs/BACKUP_AND_RESTORE.md) を参照してください。
- 公開前チェックは [docs/RELEASE_CHECKLIST.md](/Users/nagasawariku/Library/CloudStorage/GoogleDrive-rikunagasawa0619@gmail.com/マイドライブ/claude%20code/Codex/docs/RELEASE_CHECKLIST.md) を参照してください。
- CI は [ci.yml](/Users/nagasawariku/Library/CloudStorage/GoogleDrive-rikunagasawa0619@gmail.com/マイドライブ/claude%20code/Codex/.github/workflows/ci.yml) にあります。

## テスト

```bash
npm run test        # 全テスト実行
npm run test:watch  # ウォッチモード
npm run lint        # ESLint
npm run build       # 本番ビルド
```
