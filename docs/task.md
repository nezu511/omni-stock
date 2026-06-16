# タスク管理票 (task.md) — Lab Inventory システム仕上げ

このファイルは Claude Code への作業指示と進捗管理を兼ねる。
**進め方のルールは `CLAUDE.md` を参照すること。**

## 基本ルール（厳守）
- 1タスクずつ着手する。複数タスクを同時に実装しない。
- 各タスクは着手前に Plan Mode（Shift+Tab で切替）で方針を提示し、承認を得てからコードを書く。
- 各タスク完了後に手を止め、何をどう変更したかを日本語で説明する。
- 状態遷移・原子性・派生状態などの設計判断には、理由をコメントで残す。
- 一区切りごとに git commit を提案する。
- 完了したタスクは、このファイルの該当チェックボックスを `[x]` に更新する。

---

## タスク0: 事前確認（コードを書く前に）
- [x] `src/` 全体と `types.ts`、バックエンドの `index.ts`、`schema.prisma` を読み、実装済み機能と未実装機能を整理して報告する。
- [x] 既知の不整合を確認する:
  - `POST /api/items` の遷移やフィールド対応に問題がないか
    - → `AddItem.tsx` は `orderUrl` を送信するが、バックエンドは `req.body.url` を見ているため新規登録時に購入URLが保存されないバグを発見。補足セクションの「送信キー名とDBカラム名の統一」と同種の問題のため、今回は修正せず記録のみ。
  - ステータス変更APIは既に `app.patch("/api/change_status", ...)` で実装済み（PUTへの読み替えは不要）。
- [x] 各画面の `interface Item` が `types.ts` からの import に統一されているか確認する。→ 全画面で統一済み。

---

## タスク1: 検索ロジックの多様化【最優先・足慣らし】
依存: なし / 難易度: 低

- [x] `Consume.tsx` の検索フィルタを拡張: `item.name` だけでなく `item.keywords` も `.includes()` の対象に含める。
- [x] `Restock.tsx` も同様に拡張。
- [x] `Manage.tsx` も同様に拡張。
- [x] 注意点: `keywords` は `String | null` の可能性があるため、null のときに `.toLowerCase()` で落ちないようガードする（`(item.keywords ?? '')` 等）。
- [x] 3画面で検索ロジックが重複するため、共通のフィルタ関数に切り出せないか検討・提案する（必須ではない）。
  - → `frontend/src/utils/searchItems.ts` に `matchesSearchQuery(item, query)` を切り出し、3画面から共通利用する形にした。

---

## タスク2: ホーム画面 (Home.tsx) の拡張【状態の出口を作る】 :完了！
依存: なし（ただしステータス変更APIを使うため、change_status を叩く関数が必要） / 難易度: 中

派生状態を2系統に分岐する:
- [x] `needsOrder`: `quantity <= minThreshold` かつ `orderStatus === 'NONE'`（要発注）
  - ※ `&& orderStatus === 'NONE'` を必ず入れること。注文済みアイテムが要発注に二重表示されるのを防ぐため。
- [x] `arrivedItems`: `orderStatus === 'ARRIVED'`（要確認）

UI とアクション:
- [x] 要発注ブロック（赤系）: 各カードに「注文した」ボタン → `change_status` に `{ itemId, orderStatus: 'ORDERED' }` を送る。
- [x] 要確認ブロック（緑系・控えめ）: 各カードに「確認した」ボタン → `change_status` に `{ itemId, orderStatus: 'NONE' }` を送る。
  - **これが `ARRIVED → NONE` の唯一の出口。** これがないと ARRIVED 状態が溜まり続けて詰まる。
- [x] 既に注文済み（`ORDERED`）であることが分かるバッジ/アイコンを、閾値割れ一覧の表示に追加する。
- [x] `change_status` を叩く関数は `handleConsume` と同じ骨格（fetch → response.ok 確認 → 状態更新）。URL と body だけが異なる。
- [x] 各ブロックは該当アイテムが0件のとき非表示にする（`length > 0 &&`）。

---

## タスク3: 入荷画面 (Restock.tsx) のUI拡張【状態遷移の本丸】
依存: タスク2（状態遷移の理解）/ 難易度: 中〜高

- [x] 検索バーが空（未入力）のときのデフォルト表示を「`orderStatus === 'ORDERED'` のアイテム一覧」にする。検索ワードが入ったら通常の絞り込みに戻す。
  - → 検索ワードが空のときは見出し「📦 注文済み（入荷待ち）のアイテム」を表示し`ORDERED`のみに絞り込み、入力が始まったらstatusに関係なく`matchesSearchQuery`で絞り込む。0件時のメッセージも分岐させた。
- [x] 入荷（在庫プラス）時の `orderStatus` 連動ルール（**この前の議論で確定した仕様**）:
  - 入荷前が `'ORDERED'` の場合のみ → `'ARRIVED'` に変更する。
  - 入荷前が `'NONE'` の場合 → `'NONE'` のまま（数量のみ増加、ARRIVED にしない）。
  - 「注文していない物がたまたま増えただけ」を ARRIVED 扱いしないための分岐。
- [x] 実装方式: バックエンドで「現在の orderStatus を `findUnique` で読んでから分岐」する方式を推奨（数量変更とステータス変更を1回のリクエストで原子的に行うため）。
  - この設計判断（なぜフロントで2回叩かずバックで1回にまとめるか＝中途半端な状態を防ぐ原子性）をコメントで残す。
- [x] 実装前に Plan Mode で「どのAPIをどう改修するか」を必ず提示すること。

---

## タスク4: アイテム詳細・編集ページ (ItemDetail.tsx) の作成
依存: なし（独立タスク。最後でよい）/ 難易度: 高

ルーティング:
- [x] `/manage/:id` のルートを追加（App.tsx）。
- [x] 各画面（Consume / Restock / Manage）のアイテムパネルをクリックで、このページへ遷移する導線を作る。
  - ※ Manage.tsx の編集ボタンのテンプレートリテラルのバグは既に修正済み（`navigate(\`/manage/${item.id}\`)`）。Consume/Restockは画像クリック＋詳細ボタンで遷移できるようにした（本日対応）。

バックエンド:
- [x] `PUT /api/items/:id`（または PATCH）を新規作成。`Partial<Omit<Item, 'id'>>` 相当の部分更新を受け付ける。→ `PATCH /api/items/:id` で実装済み。
- [x] バリデーション: `orderStatus` を含む場合は許可リスト（NONE/ORDERED/ARRIVED）で門番を立てる。→ `orderStatus`の変更は`/api/change_status`側で許可リスト判定済み。`PATCH /api/items/:id`は`orderStatus`を受け付けないため対象外。

フロント機能要件:
- [x] 名前・閾値・キーワード・画像などの編集機能。
- [x] 「注文済み (ORDERED)」へのステータス変更スイッチ。
- [x] アイテムに紐づく `histories` を時系列でリスト表示（注文・入荷などのログ閲覧）。

---

## タスク: 日本語・英語を切り替えるようにして
フロントエンド：
- [x] ボタンなど全ての表記を英語にして
- [x] 各ページに英語と日本語を切り替えるボタンを配置
  - → ナビバー右端に EN/日本語 トグルボタンを設置。`localStorage` に保存してリロード後も維持。
  - → `frontend/src/locales/` に翻訳オブジェクト（ja.ts/en.ts）、`LanguageContext.tsx` で全体管理。

データベース：
- [x] 英語名を記録
  - → Itemモデルに `englishName String?` を追加（`prisma db push` 適用済み）。
  - → AddItem・ItemDetail に「英語名」入力欄を追加。英語名でも検索可能（searchItems.ts を拡張）。



## タスク5: 試薬発注管理機能【新規・独立機能】
依存: タスク1〜4がすべて完了していること（在庫の状態遷移と混在させない）/ 難易度: 高

### 背景・設計方針（必ず先に読むこと）
試薬は既存の `Item`（消耗品）とは**性質が異なる**ため、`Item` に相乗りさせず**別モデルに切り出す**（案C）。
- 試薬は個数（`quantity`）を管理しない。「頼んだ / 届いた」という**発注状態**が主役。
- 同じ試薬を繰り返し発注するため、「試薬の品目マスタ」と「発注リクエスト1件」を**1対多**で分離する。
  （`Item`↔`History`、`Reagent`↔`ReagentRequest` は同じ1対多パターン）
- **リクエストする人と発注する人は別**。よって `REQUESTED`（要望）→ `ORDERED`（発注担当が承認・発注）→ `ARRIVED`（到着）の承認フローを持つ。
- 状態の語彙のうち `ORDERED` / `ARRIVED` は既存Itemと共通にし、業者の受け取り操作を共通の感覚で扱えるようにする。試薬だけ先頭に `REQUESTED` がある。
- ログイン機能はまだないため、権限チェック（誰が押せるか）はUI上の画面分離で表現するに留め、サーバー側の権限制御は将来課題とする。

### 5-1. DBスキーマ（schema.prisma）
- [x] `Reagent` モデル（品目マスタ）を追加する。
  - `id` Int @id @default(autoincrement())
  - `name` String @unique（試薬名・重複登録を防ぐ）
  - `englishName` String?（英語UI対応。既存Itemと揃える）
  - `site_url` String?（発注先URL）
  - `createdAt` DateTime @default(now())
  - `requests` ReagentRequest[]（1対多）
- [x] `ReagentRequest` モデル（発注リクエスト1件＝イベント）を追加する。
  - `id` Int @id @default(autoincrement())
  - `reagentId` Int
  - `reagent` Reagent @relation(fields: [reagentId], references: [id], onDelete: Cascade)
  - `status` String @default("REQUESTED")（REQUESTED / ORDERED / ARRIVED）
  - `requestedBy` String?（誰が要望したか）
  - `createdAt` DateTime @default(now())（いつ要望したか＝履歴の起点）
  - `updatedAt` DateTime @updatedAt
- [x] `prisma db push`（または migrate）でDBに反映する。
- [x] `status` を String にした理由（SQLiteはネイティブenum非対応）をコメントで残し、許可リストはAPI側の門番で担保する。

### 5-2. バックエンドAPI
- [x] `GET /api/reagents`: 全試薬マスタを `requests` 込みで取得（最新リクエストの状態を一覧に出すため）。
- [x] `POST /api/reagents`: 試薬マスタの新規登録（name, englishName, site_url）。既存なら作らない運用なので、重複名は P2002 を想定し 400 で返すと親切（必須ではない）。
- [x] `POST /api/reagent_requests`: 発注リクエストを1件作成（reagentId, requestedBy を受け、status は "REQUESTED" 固定）。
  - 既存の試薬を選んで発注 = 新しい ReagentRequest を1行生やすだけ（マスタは増やさない）。
- [x] `PATCH /api/reagent_requests/:id/status`: リクエストの状態遷移。
  - 許可リスト `['REQUESTED', 'ORDERED', 'ARRIVED']` で門番を立てる（400で弾く）。
  - 数量は存在しないため在庫操作は行わない。状態だけ更新する。
- [x] 実装前に Plan Mode でAPI設計を提示すること。

### 5-3. フロント：リクエスト作成画面（ReagentRequest.tsx 等）
- [x] 試薬マスタを**検索**して選べるUI（`searchItems.ts` と同様の name/englishName 部分一致）。
  - 既存試薬：選ぶだけで発注リクエスト作成。
  - 新規試薬：その場でマスタ登録（name, englishName, site_url）してからリクエスト作成。
- [x] フォームは個数・画像・閾値を持たない（既存AddItemより大幅に軽量でよい）。
- [x] `requestedBy` を入力（ログインがないため当面は手入力のテキストでよい）。

### 5-4. フロント：発注承認・状態管理画面
- [x] リクエスト一覧を状態別に表示：REQUESTED（承認待ち）/ ORDERED（発注済・入荷待ち）/ ARRIVED（到着）。
- [x] `REQUESTED → ORDERED`：「発注した（承認）」ボタン。発注担当の操作。`site_url` があれば発注先リンクを併設（target="_blank" rel="noopener noreferrer"）。
- [x] `ORDERED → ARRIVED`：「到着」ボタン。業者の受け取り操作。
- [x] `ARRIVED` は履歴として残す（消す必要はない）。同じ試薬の過去リクエスト件数・日時が `requests` から辿れることを確認する。

### 5-5. 多言語・導線
- [x] 新規画面の文言を `locales`（ja/en）に追加し、言語トグルに追従させる。
- [x] ナビゲーション（または Home）から試薬管理画面への導線を追加する。

### 5-x 設計上の注意（混同しやすい点）
- 試薬の状態遷移と、既存Itemの `orderStatus` 遷移は**別物**。同じ関数・同じテーブルで処理しないこと。
- 「同じ試薬を再発注」は「マスタを編集」ではなく「新しい ReagentRequest を作成」で実現する（履歴が残る）。

---

## 完了の定義（Definition of Done）
- [x] 全タスクのチェックボックスが `[x]`。
- [x] 状態遷移 `NONE → ORDERED → ARRIVED → NONE` が UI 操作だけで一周できる。
- [x] ARRIVED が溜まって詰まる経路がない（Home の確認ボタンで必ず NONE に戻せる）。
- [x] 検索が name と keywords の両方にヒットする。
- [x] 主要な設計判断にコメントが残っている。

### タスク5（試薬）の完了の定義
- [x] 試薬の状態遷移 `REQUESTED → ORDERED → ARRIVED` が UI 操作だけで一周できる。
- [x] 同じ試薬を再発注すると、マスタは増えず ReagentRequest だけが1件増える（履歴が残る）。
- [x] 試薬管理が既存Itemの在庫ロジック（Home の閾値割れ等）に一切影響していない。
- [x] 新規画面が言語トグル（ja/en）に追従する。

---

## 補足: 将来の課題（今回のスコープ外・メモのみ）
- バーコードの1対多対応（ロット違い）: `Barcode` テーブルを切り出す案。今回は対象外。
- `@unique` 制約違反（重複名など）を 500 ではなく 400 + 専用メッセージで返す（Prisma の P2002 判定）。
- フロントの送信キー名とDBのカラム名の統一（`barcode_str`/`url` → `barcode`/`site_url`）。
- タスク0で発見済み: `AddItem.tsx` が購入URLを `url` キーで送るがバックは `req.body.url` 経由で、新規登録時に `site_url` が保存されないバグ。上記キー名統一とあわせて修正する。
- 試薬発注の権限制御（リクエスト者と発注担当の区別をサーバー側で強制）: ログイン機能の実装が前提のため将来課題。
