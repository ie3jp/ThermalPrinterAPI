# 実装タスク一覧

## 完了済み

- [x] プロジェクト初期化（Vite + Hono + Vue 3）
- [x] XML Builder基本実装（テキスト/画像/QR/カット）
- [x] PrintService基本実装（プリンタ通信）
- [x] APIエンドポイント雛形（/api/print, /api/status, /api/export/xml）
- [x] デバッグGUI雛形（Vue 3 + Tailwind）

---

## Phase 1（最小限）- 必須機能

### サーバーサイド

- [ ] **型定義の整備**
  - SPECIFICATION.mdのPrintCommand型を正式実装
  - `src/server/types/commands.ts` に配置

- [ ] **画像処理サービス**
  - Sharp使用
  - BMP変換（1bpp mono / 4bpp gray）
  - ディザリング対応
  - モノクロ/グレースケール両対応
  - `src/server/services/image.ts` に実装

- [ ] **XML Builder完成**
  - バーコード対応追加
  - UnitFeed（紙送り）追加
  - SetEncoding（文字エンコーディング）追加

- [ ] **PrintService完成**
  - 画像処理サービス統合
  - タイムアウト10秒設定
  - エラーハンドリング強化

- [ ] **APIルート完成**
  - SPECIFICATION.mdに沿ったリクエスト/レスポンス形式
  - バリデーション追加

### クライアントサイド（デバッグGUI）

- [ ] **テキスト印刷UI**
  - フォント属性設定（太字/下線/反転等）
  - テキストサイズ設定（幅・高さ 1-8倍）

- [ ] **画像印刷UI**
  - ファイルアップロード
  - プレビュー表示
  - モノクロ/グレースケール切替

- [ ] **QRコード印刷UI**
  - データ入力
  - モジュールサイズ設定
  - エラー訂正レベル設定

- [ ] **XMLプレビュー**
  - 送信前にXML確認可能に

### インフラ

- [ ] **本番ビルド時の静的ファイル配信**
  - Honoでクライアントビルド成果物を配信

---

## Phase 2（標準）

- [ ] **バーコード印刷対応**
  - XML Builder対応
  - GUI追加

- [ ] **フォント設定UI**
  - 属性選択（FontB/FontC/太字/反転/下線）
  - サイズ選択（1-8倍）

- [ ] **ページモード対応**
  - SDK同等機能

- [ ] **紙送り（UnitFeed）UI**

---

## Phase 3（フル）

- [ ] **Swagger/OpenAPI生成**
  - Hono OpenAPI統合（@hono/zod-openapi）

- [ ] **テンプレート機能**
  - `/api/print/template` エンドポイント実装
  - 変数埋め込み対応

- [ ] **SDKサンプル同等の全機能**
  - cxmlp-editorの機能移植

- [ ] **テンプレート保存/読込**
  - ローカルストレージ or ファイル

---

## インフラ・その他

- [ ] **.env ファイル対応**
  - dotenv or Node.js native env

- [ ] **エラーハンドリング統一**
  - エラーレスポンス形式統一
  - HTTPステータスコード適切化

- [ ] **ログ出力改善**
  - 本番用ログ形式

---

## 推奨着手順序

1. 型定義の整備
2. 画像処理サービス（最も複雑）
3. XML Builder完成
4. PrintService完成
5. APIルート完成
6. GUI - 画像印刷
7. GUI - QRコード印刷
8. GUI - XMLプレビュー
9. GUI - テキスト印刷（属性追加）
10. 本番ビルド配信
