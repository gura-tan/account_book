# Supabase 連携手順

このドキュメントでは、Supabase プロジェクトとの連携方法を説明します。

## 1. Supabase プロジェクトの設定

### API キーの取得

1. [Supabase ダッシュボード](https://supabase.com/dashboard) にログイン
2. 使用するプロジェクトを開く
3. 左サイドバーの **Settings** → **API** に移動
4. 以下の値をコピー:
   - **Project URL** (例: `https://xxxxx.supabase.co`)
   - **Project API keys** → `anon` `public` のキー

### 環境変数の設定

プロジェクトルートに `.env` ファイルを作成し、コピーした値を貼り付けます:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxxxxxxxx
```

> ⚠️ `.env` ファイルは `.gitignore` に含まれているため、Git にコミットされません。

---

## 2. データベースのセットアップ

### スキーマの実行

1. Supabase ダッシュボードで **SQL Editor** を開く
2. **New Query** をクリック
3. `supabase/schema.sql` の内容をすべてコピー＆ペースト
4. **Run** をクリックして実行

これにより以下のテーブルが作成されます:
- `profiles` — ユーザープロフィール
- `groups` — グループ（Phase 3 用）
- `group_members` — グループメンバー
- `assets` — 資産（ツリー構造）
- `transactions` — 取引記録
- `categories` — デフォルトカテゴリ

### 自動的に作成されるもの

- **RLS ポリシー**: 各テーブルに行レベルセキュリティが設定されます
- **トリガー**: ユーザー登録時に自動で `profiles` にレコードが作成されます
- **デフォルトカテゴリ**: 一般的な収入/支出カテゴリが自動挿入されます

---

## 3. 認証の設定

### メール認証

Supabase のデフォルト設定でメール認証が有効です。

開発時にメール確認を省略したい場合:
1. **Authentication** → **Settings** → **Email** を開く
2. **Confirm email** を **OFF** に設定

---

## 4. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:5173` を開きます。

---

## 5. 本番デプロイ（Vercel）

1. GitHub にプッシュ
2. [Vercel](https://vercel.com) でインポート
3. **Environment Variables** に以下を追加:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. デプロイ

---

## トラブルシューティング

| 問題 | 対処法 |
|------|--------|
| ログインできない | `.env` の値が正しいか確認。Supabase ダッシュボードで Email Auth が有効か確認 |
| データが保存されない | SQL Editor でスキーマが正しく実行されたか確認。RLS ポリシーが有効か確認 |
| 画面が真っ白 | ブラウザの開発者ツール(F12)でエラーを確認 |
