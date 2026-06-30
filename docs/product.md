# Omni-Stock 現状仕様書

> 最終更新: 2026-06-30  
> ブランチ: `feat/testing`

---

## 1. システム概要

研究室向けの在庫管理 Web アプリ。物品（消耗品）と試薬の2系統を管理する。  
ローカル LAN 環境での運用を前提とし、インターネット接続は不要。

---

## 2. 技術スタック・起動方法

| 層 | 技術 |
|---|---|
| Frontend | React + TypeScript + Vite |
| Backend | Express + TypeScript (tsx) |
| DB | SQLite（Prisma ORM） |
| 画像保存 | Multer（`backend/uploads/` 以下） |
| Node.js | v24 必須（`nvm use 24`） |

### 起動手順

```bash
# バックエンド（ポート 3001）
cd backend
nvm use 24
npx tsx index.ts

# フロントエンド（ポート 5173）
cd frontend
npm run dev
```

---

## 3. データモデル

### Item（消耗品）

| フィールド | 型 | 説明 |
|---|---|---|
| id | Int | 主キー |
| name | String UNIQUE | アイテム名 |
| englishName | String? | 英語名（検索・英語UI用） |
| quantity | Int | 現在庫（個数単位） |
| barcode | String? UNIQUE | バーコード |
| imageUrl | String? | 画像URL（`/uploads/...`） |
| minThreshold | Int | 低在庫アラートの閾値（個数） |
| keywords | String? | 検索キーワード（スペース区切り可） |
| site_url | String? | 発注先URL |
| orderStatus | String | `NONE` / `ORDERED` / `ARRIVED` |
| unitPerBox | Int | 1箱あたりの個数（デフォルト1） |
| createdAt | DateTime | 作成日時 |
| updatedAt | DateTime | 更新日時 |

### History（消耗品の操作履歴）

| フィールド | 型 | 説明 |
|---|---|---|
| id | Int | 主キー |
| itemId | Int | Item への外部キー（Cascade削除） |
| actionType | String | `CREATE` / `CONSUME` / `RESTOCK` / `ORDERED` / `ARRIVED` / `NONE` / `QUANTITY_UPDATE` |
| amountChange | Int | 数量変化（消費は負値） |
| timestamp | DateTime | 操作日時 |

### Reagent（試薬マスタ）

| フィールド | 型 | 説明 |
|---|---|---|
| id | Int | 主キー |
| name | String UNIQUE | 試薬名 |
| englishName | String? | 英語名 |
| site_url | String? | 発注先URL |
| createdAt | DateTime | 作成日時 |

### ReagentRequest（試薬発注リクエスト）

| フィールド | 型 | 説明 |
|---|---|---|
| id | Int | 主キー |
| reagentId | Int | Reagent への外部キー（Cascade削除） |
| status | String | `REQUESTED` / `ORDERED` / `ARRIVED` |
| requestedBy | String? | 要望者名 |
| createdAt | DateTime | 作成日時 |
| updatedAt | DateTime | 更新日時 |

---

## 4. 状態遷移

### Item.orderStatus

```
NONE ──[注文した]──→ ORDERED ──[入荷]──→ ARRIVED ──[確認した]──→ NONE
 ↑                                                                    │
 └────────────────────────────────────────────────────────────────────┘
```

| 操作 | 画面 | 遷移 |
|---|---|---|
| 「注文した」ボタン | Home（低在庫ブロック） | NONE → ORDERED |
| 入荷（RESTOCK）時 | Restock | ORDERED → ARRIVED（NONE のまま入荷しても変化なし） |
| 「確認した」ボタン | Home（入荷確認ブロック） | ARRIVED → NONE |
| ステータス手動変更 | ItemDetail | 任意の状態へ変更可 |

### ReagentRequest.status

```
REQUESTED ──[発注した]──→ ORDERED ──[到着]──→ ARRIVED（終端）
```

| 操作 | 画面 | 遷移 |
|---|---|---|
| リクエスト作成 | ReagentRequest | — → REQUESTED（新規作成） |
| 「発注した」ボタン | ReagentManage | REQUESTED → ORDERED |
| 「到着」ボタン | ReagentManage / Restock | ORDERED → ARRIVED |
| ARRIVED の非表示 | Home（確認したボタン） | DBは変更せず localStorage に記録 |

---

## 5. API エンドポイント

### 消耗品

| メソッド | パス | 説明 |
|---|---|---|
| GET | `/api/items` | 全アイテム＋履歴を取得（updatedAt 降順） |
| POST | `/api/items` | アイテム新規作成 |
| GET | `/api/items/:id` | アイテム1件＋履歴取得（`site_url` → `orderUrl` にリネームして返す） |
| PATCH | `/api/items/:id` | メタデータ部分更新（name / englishName / minThreshold / unitPerBox / keywords / imageUrl / orderUrl） |
| DELETE | `/api/items/:id` | アイテム削除（履歴・画像ファイルを連動削除） |
| POST | `/api/quantity_change` | 在庫増減（`actionType`: `CONSUME` / `RESTOCK`）。RESTOCK 時に ORDERED→ARRIVED 自動遷移 |
| PATCH | `/api/change_status` | orderStatus を手動変更（許可リスト: NONE / ORDERED / ARRIVED） |

### 画像アップロード

| メソッド | パス | 説明 |
|---|---|---|
| POST | `/api/upload` | 画像を `uploads/` に保存、URL を返す |
| GET | `/uploads/:filename` | 静的ファイル配信 |

### 試薬

| メソッド | パス | 説明 |
|---|---|---|
| GET | `/api/reagents` | 全試薬マスタ＋リクエスト取得（name 昇順） |
| POST | `/api/reagents` | 試薬マスタ新規登録（重複名は 400） |
| POST | `/api/reagent_requests` | 発注リクエスト作成（status: REQUESTED 固定） |
| PATCH | `/api/reagent_requests/:id/status` | 状態遷移（許可リスト: REQUESTED / ORDERED / ARRIVED） |

### SSE（リアルタイム通知）

| メソッド | パス | 説明 |
|---|---|---|
| GET | `/api/events` | SSE 常時接続（30秒ハートビート） |

SSE イベント種別:

| イベント名 | 発火タイミング | ペイロード |
|---|---|---|
| `low_stock` | CONSUME 後に在庫 ≤ minThreshold | `{ name, quantity, minThreshold }` |
| `item_arrived` | RESTOCK で ORDERED→ARRIVED / change_status で ARRIVED 設定 | `{ name }` |
| `reagent_requested` | 試薬リクエスト作成 | `{ reagentName, requestedBy }` |
| `reagent_arrived` | 試薬 ORDERED→ARRIVED | `{ reagentName }` |

---

## 6. 画面仕様

### Home（`/`）

トップページ。4つのブロックを条件付きで表示する。

**ナビゲーションボタン（常時）**
- 使用・入荷・管理への大ボタン（3列）
- 試薬ページへの横長ボタン（紫）

**低在庫アラート（赤）**  
`quantity <= minThreshold` のアイテムを表示。
- NONE → 「注文した」ボタン → ORDERED に変更
- ORDERED → 「📦 注文済み」バッジ（ボタンなし）
- 残量は `unitPerBox > 1` のとき「25 (2箱+5個)」形式

**入荷確認（緑）**  
`orderStatus === 'ARRIVED'` のアイテムを表示。
- 「確認した」ボタン → NONE に変更し非表示

**試薬到着確認（紫）**  
`status === 'ARRIVED'` の ReagentRequest を表示。
- 「確認した」ボタン → localStorage に ID を記録して非表示（DB は変更しない）
- リロード後も非表示が維持される

**試薬リクエスト承認待ち（黄）**  
`status === 'REQUESTED'` のリクエストを持つ試薬を表示。
- 「→ 承認・発注管理へ」リンク → ReagentManage へ

---

### Consume（`/consume`）— 使用（消費）

- アイテム名・英語名・keywords で検索（部分一致）
- カード表示：画像 / アイテム名 / 残量（個数）
- `unitPerBox > 1` の場合のみ：「個で消費」/「箱で消費」トグル表示
  - 箱モード：入力値 × unitPerBox を quantity_change として送信
  - 個モード：入力値をそのまま送信
- 「-1 ボタン」：常に 1個 消費（箱モード関係なし）
- 詳細ボタン → ItemDetail へ

---

### Restock（`/restock`）— 入荷

**デフォルト表示（検索バーが空）**  
「📦 注文済み（入荷待ち）」セクションと「📋 その他のアイテム一覧」セクションに分けて表示。
- 注文済みセクション：`orderStatus === 'ORDERED'` のアイテム ＋ `status === 'ORDERED'` の試薬リクエストカード

**検索時**  
全アイテムを name / englishName / keywords でフィルタ（試薬カードは非表示）。

**アイテムカードの入荷操作**  
- `unitPerBox === 1`：個数を入力して「入荷」（`+1 クイック入荷` ボタンあり）
- `unitPerBox > 1`：箱数を入力して「入荷」（送信値 = 入力 × unitPerBox）、在庫表示は切り捨て箱数（`2箱`）、変換ヒント「1箱 = N個」
- ORDERED アイテムを入荷 → 自動的に ARRIVED に遷移
- NONE アイテムを入荷 → NONE のまま（数量のみ増加）

**試薬リクエストカード（紫枠）**  
試薬名・要望者・発注先URL・「到着」ボタン。押すと ARRIVED に遷移してカードが消える。

---

### Manage（`/manage`）— 管理

- アイテム一覧をテーブル表示（ID / 名前 / 在庫 / 閾値 / 操作）
- 検索フィルタ（name / englishName / keywords）
- 編集ボタン → ItemDetail へ
- 削除ボタン → 確認ダイアログ → DB削除 + 画像ファイル削除
- 「＋ 新規アイテム追加」ボタン → AddItem へ

---

### AddItem（`/manage/new`）— 新規アイテム追加

入力フォーム（必須: 名前のみ）:

| フィールド | 備考 |
|---|---|
| アイテム名 | 必須・UNIQUE |
| 英語名 | 任意 |
| 初期在庫数 | デフォルト 1 |
| 警告アラートのしきい値 | デフォルト 5 |
| 1箱あたりの個数 | デフォルト 1（1なら箱管理なし） |
| キーワード | 検索用 |
| 商品購入用URL | |
| 画像 | Multer アップロード・プレビュー表示 |

---

### ItemDetail（`/manage/:id`）— アイテム詳細・編集

**上部：在庫情報**
- 現在庫数表示
- 現在の orderStatus バッジ
- ステータス変更ボタン（NONE / ORDERED / ARRIVED）

**編集フォーム**  
名前・英語名・閾値・1箱あたりの個数・キーワード・購入URL・画像を編集して「保存する」。

**履歴一覧**  
操作ログを新しい順に表示（日時・操作種別・数量変化）。

---

### ReagentRequest（`/reagents`）— 試薬発注リクエスト

1. 試薬を検索（name / englishName で部分一致）
2. 候補から選択 → 要望者名を入力 → 「リクエスト提出」で `POST /api/reagent_requests`
3. 「＋ 新規試薬を登録」を展開すると新規試薬フォーム（名前・英語名・発注URL）→ 登録＆リクエストを同時実行
4. 「→ 発注状況を確認」リンク → ReagentManage へ

---

### ReagentManage（`/reagents/manage`）— 試薬発注管理

3セクション構成:

| セクション | 対象 | 操作 |
|---|---|---|
| 承認待ち（黄） | REQUESTED | 「発注した」ボタン → ORDERED に遷移 |
| 発注済み（青） | ORDERED | 「到着」ボタン → ARRIVED に遷移 |
| 到着済み（緑） | ARRIVED | 表示のみ（操作なし） |

各カードに：試薬名・英語名・要望者・リクエスト日時・発注先URL（外部リンク）を表示。

---

## 7. 横断機能

### 言語切り替え（日本語 / English）

- NavBar 右端のボタンで切り替え
- `localStorage` に保存（リロード後も維持）
- 全画面の文言が切り替わる（ロケール: `frontend/src/locales/ja.ts` / `en.ts`）

### ブラウザ通知（Web Notifications API + SSE）

- NavBar のベルボタン（🔔?）クリックで通知許可を要求
- 許可済み: 🔔 / 拒否: 🔕（薄暗く） / 未サポート: 非表示
- Safari 対応：ユーザーアクション（ボタンクリック）でのみ許可ダイアログを出す
- バックエンドとの SSE 常時接続で4種類のイベントを受信しブラウザ通知を出す

### 箱/個 換算（unitPerBox）

`unitPerBox = 1`（デフォルト）のアイテムは従来通り個数のみで管理。  
`unitPerBox > 1` に設定すると：

| 場面 | 表示・動作 |
|---|---|
| 入荷ページ | 在庫を「切り捨て箱数」で表示（`2箱`）。箱数を入力して入荷（送信値 = 入力 × unitPerBox） |
| 使用ページ | 個数表示のまま。個/箱トグルで消費単位を選択 |
| Home 低在庫 | 「25 (2箱+5個)」形式で併記 |
| AddItem / ItemDetail | 「1箱あたりの個数」フィールドで設定 |

---

## 8. 既知の制限・将来課題

| 項目 | 内容 |
|---|---|
| 認証なし | 誰でも全操作可能。権限制御は将来課題 |
| 試薬の個数管理なし | 試薬は「発注した/届いた」という状態のみ。在庫数は持たない |
| バーコード検索未実装 | カメラアイコンは「Camera feature coming soon!」のアラートのみ |
| 試薬 ARRIVED の完全削除手段なし | ARRIVED は表示のみ（Home で非表示にできるが DB には残る） |
| 購入URLバグ（新規登録時） | AddItem が `url` キーで送信し、バックエンドが `req.body.url` で受け取るため正常に動作している（既存の実装で統一済み） |
| unitPerBox の端数処理 | 入荷は箱数×unitPerBox で個数に変換。端数（余り個）の入荷手段はない |
| SSE 切断時の再接続 | ブラウザがタブを閉じると SSE が切断され、再接続は次のページ読み込みまで行われない |
