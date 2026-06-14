# プロジェクト概要
研究室用の在庫管理システム (Lab Inventory API)。
物品の消費・入荷・管理を直感的に行えるフルスタックWebアプリケーション。

# 技術スタック
- **Frontend:** React (TypeScript), React Router DOM v6
- **Backend:** Node.js, Express, Multer (画像アップロード用)
- **Database:** Prisma ORM

# データ構造 (Prisma Schemaの前提)
## Item モデル
- `id`: Int
- `name`: String
- `quantity`: Int (現在庫)
- `barcode`: String | null
- `imageUrl`: String | null (Multer経由で /uploads 配下に保存)
- `minThreshold`: Int (アラートの閾値)
- `keywords`: String | null (検索の多様化用)
- `site_url`: String | null (商品購入用URL)
- `orderStatus`: String ('NONE' | 'ORDERED' | 'ARRIVED')
- `updatedAt`: DateTime

## History モデル (Itemと1対多)
- `id`: Int
- `itemId`: Int
- `actionType`: String ('CREATE', 'QUANTITY_UPDATE', 'CONSUME', 'RESTOCK', 'ORDERED', 'ARRIVED' 等)
- `amountChange`: Int

# 現在の実装進捗 (最新)
- 型定義を `types.ts` に集約し、保守性を向上。
- `GET /api/items`: 全アイテムと履歴の取得（降順）。
- `POST /api/items`: 新規作成（`keywords`, `site_url` などの新フィールドに対応済み）。
- `POST /api/quantity_change`: 消費・入荷による在庫数の増減と履歴の自動生成。
- `PATCH /api/change_status`: 注文ステータス (`orderStatus`) の更新APIを実装済み。
- `DELETE /api/items/:id`: Prismaのトランザクションを用いたDB削除と、`fs.unlinkSync` を用いた物理画像の連動削除。
- `Home.tsx`: 閾値(`minThreshold`)を下回るアイテムの警告表示機能（派生状態）。
- `Consume.tsx` / `Restock.tsx`: クイック増減ボタンと入力フォームによる在庫管理。

# 今後の実装タスク・ロードマップ
以下の構想に基づき、順次実装を行ってください．
実装時は必ず事前に Plan Mode（Shift+Tab で切替）で方針を提示し、
承認を得てからコードを書くこと。一度に複数タスクを実装しないこと。

## 1. 検索ロジックの多様化
- `Consume.tsx`, `Restock.tsx`, `Manage.tsx` の検索処理を拡張。
- `item.name` だけでなく、`item.keywords` も `.includes()` の対象に含め、ひっかかりやすくする。

## 2. アイテム詳細・編集ページ (`ItemDetail.tsx`) の作成
- 各ページ（使用・入荷・管理）のアイテムパネルをクリックした際の遷移先として新規作成。
- **機能要件:**
  - 名前、閾値、キーワード、画像などの情報編集機能。
  - 「注文済み (ORDERED)」へのステータス変更スイッチ。
  - アイテムに紐づく `histories` を時系列でリスト表示（いつ注文されたか、入荷されたか等のログ閲覧）。

## 3. 入荷画面 (`Restock.tsx`) のUI拡張
- 検索バーが空（未入力）の時のデフォルト表示を、「`orderStatus === 'ORDERED'` のアイテム一覧」にする。
- 入荷（在庫プラス）した際の orderStatus 連動:
  - 入荷前が 'ORDERED' の場合のみ → 'ARRIVED' に変更する
  - 'NONE' の場合 → 'NONE' のまま（数量のみ増加、ARRIVEDにしない）
  - 判定は「現在のorderStatusを読んでから分岐」する方式で実装すること


## 4. ホーム画面 (Home.tsx) の拡張
- 派生状態を分岐:
  - needsOrder: quantity <= minThreshold かつ orderStatus === 'NONE'（要発注）
  - arrivedItems: orderStatus === 'ARRIVED'（要確認）
- 要発注ブロック: 「注文した」ボタン → change_status で 'ORDERED' に
- 要確認ブロック（到着済み）: 「確認した」ボタン → change_status で 'NONE' に戻す
  （これが ARRIVED → NONE の唯一の出口）
- 既に注文済み(ORDERED)を視覚的に示すバッジ/アイコン
