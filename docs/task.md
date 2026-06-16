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



## 完了の定義（Definition of Done）
- [x] 全タスクのチェックボックスが `[x]`。
- [x] 状態遷移 `NONE → ORDERED → ARRIVED → NONE` が UI 操作だけで一周できる。
- [x] ARRIVED が溜まって詰まる経路がない（Home の確認ボタンで必ず NONE に戻せる）。
- [x] 検索が name と keywords の両方にヒットする。
- [x] 主要な設計判断にコメントが残っている。

---

## 補足: 将来の課題（今回のスコープ外・メモのみ）
- バーコードの1対多対応（ロット違い）: `Barcode` テーブルを切り出す案。今回は対象外。
- `@unique` 制約違反（重複名など）を 500 ではなく 400 + 専用メッセージで返す（Prisma の P2002 判定）。
- フロントの送信キー名とDBのカラム名の統一（`barcode_str`/`url` → `barcode`/`site_url`）。
