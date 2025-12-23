# WireMock JP - 開発ガイド

WireMock用の日本語GUIクライアント（Vue 3 + Element Plus + Fastify Backend）

## クイックスタート

### 1. 前提条件

- Node.js 20.19.0以上 または 22.12.0以上
- pnpm（`npm install -g pnpm`）
- PostgreSQL（Docker推奨）
- WireMock（オプション：スタブ同期時に必要）

### 2. PostgreSQL起動（Docker）

```bash
docker run -d \
  --name wiremock-jp-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=wiremock_jp \
  -p 5432:5432 \
  postgres:16
```

### 3. 初期セットアップ

```bash
# 依存パッケージインストール
pnpm install

# 環境変数設定
cp packages/backend/.env.example packages/backend/.env

# DBマイグレーション実行
cd packages/backend
pnpm run db:migrate

# Prismaクライアント生成
pnpm run db:generate

# ルートに戻る
cd ../..
```

### 4. 開発サーバー起動

```bash
# 全サービス同時起動（推奨）
pnpm run dev
```

起動後のURL:
- フロントエンド: http://localhost:5173
- バックエンドAPI: http://localhost:3000

### 5. 初回利用

1. http://localhost:5173 にアクセス
2. プロジェクトを作成（WireMock URLを設定）
3. スタブを作成・編集

## プロジェクト構成

モノレポ構成（pnpm workspace）：
- `packages/frontend` - Vue 3フロントエンド
- `packages/backend` - Fastify + Prisma APIサーバー
- `packages/shared` - 共通型定義

## コマンド一覧

```bash
# 依存パッケージインストール
pnpm install

# 全パッケージビルド
pnpm run build

# フロントエンド開発サーバー起動（http://localhost:5173）
pnpm run dev:frontend

# バックエンド開発サーバー起動（http://localhost:3000）
pnpm run dev:backend

# 全サービス同時起動
pnpm run dev
```

### バックエンドコマンド

```bash
cd packages/backend

# DBマイグレーション
pnpm run db:migrate

# Prismaクライアント生成
pnpm run db:generate

# DBスキーマをDBに直接反映（開発用）
pnpm run db:push

# Prisma Studio（DBブラウザ）
pnpm run db:studio
```

## 技術スタック

### フロントエンド
- Vue 3 + TypeScript
- Element Plus（UIライブラリ）
- Pinia（状態管理）
- Vue Router（ルーティング）
- Vue I18n（日本語/英語対応）
- Monaco Editor（JSONエディタ）
- Axios（HTTP通信）

### バックエンド
- Fastify（Webフレームワーク）
- Prisma（ORM）
- PostgreSQL（データベース）
- Zod（バリデーション）

## ディレクトリ構成

```
packages/
├── frontend/
│   └── src/
│       ├── i18n/           # 多言語対応（ja.json, en.json）
│       ├── router/         # ルーティング設定
│       ├── services/       # API通信
│       ├── stores/         # Pinia ストア
│       ├── types/          # TypeScript型定義
│       └── views/          # ページコンポーネント
├── backend/
│   ├── prisma/             # DBスキーマ・マイグレーション
│   └── src/
│       ├── routes/         # APIルート（projects, stubs, wiremock-instances）
│       └── index.ts        # エントリーポイント
└── shared/
    └── src/types/          # 共通型定義
```

## API エンドポイント

### プロジェクト
- `GET /api/projects` - プロジェクト一覧
- `POST /api/projects` - プロジェクト作成
- `GET /api/projects/:id` - プロジェクト詳細
- `PUT /api/projects/:id` - プロジェクト更新
- `DELETE /api/projects/:id` - プロジェクト削除

### スタブ
- `GET /api/stubs?projectId=` - スタブ一覧
- `POST /api/stubs` - スタブ作成
- `PUT /api/stubs/:id` - スタブ更新
- `DELETE /api/stubs/:id` - スタブ削除
- `POST /api/stubs/:id/sync` - WireMockに同期
- `POST /api/stubs/sync-all` - 全スタブをWireMockに同期

### WireMockインスタンス
- `GET /api/wiremock-instances?projectId=` - インスタンス一覧
- `POST /api/wiremock-instances` - インスタンス登録
- `GET /api/wiremock-instances/:id` - インスタンス詳細（ヘルスチェック含む）
- `GET /api/wiremock-instances/:id/mappings` - マッピング取得
- `GET /api/wiremock-instances/:id/requests` - リクエストログ取得
- `POST /api/wiremock-instances/:id/reset` - インスタンスリセット

## WireMock連携

開発時はViteのプロキシ経由でWireMockに接続：
- フロントエンド: http://localhost:5173
- WireMock: http://localhost:8080（デフォルト）
- プロキシ設定: `/__admin` → WireMock Admin API

### WireMockサーバー起動

```bash
# Dockerを使う場合（推奨）
docker run -it --rm -p 8080:8080 wiremock/wiremock

# JARファイルを使う場合
java -jar wiremock-standalone.jar --port 8080
```

WireMockが起動していないとNetwork Errorになります。

## 注意事項

- Node.js 20.19.0以上または22.12.0以上が必要
- 認証なし：全員が全データにアクセス可能
