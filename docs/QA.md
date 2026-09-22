# QA / バグ候補

対象: `src/server` 配下のAPI/SDK/画像処理

## 指摘一覧
- [高] 透明PNGなどアルファ付き画像で `image.raw()` のチャンネル数を1ch前提に処理しており、画素列が崩れる可能性がある。`src/server/services/image.ts:332`
- [中] `/api/print` が type 以外の必須項目（例: `text.data`, `image.data`, `barcode.barcodeType`, `feed.units`）を検証しておらず、SDK例外が500で返る可能性がある。`src/server/routes/print.ts:55`
- [中] `/api/export/xml` はコマンド種別や必須項目の検証がなく、不正入力がそのまま処理される/500になる恐れがある。`src/server/routes/print.ts:114`
- [中] ステータス取得が `QuerySoftwareVersion` のHTTP成否のみで判定しており、`paperNearEmpty` 等の実状態が取得できない（仕様との差）。`src/server/services/printer-client.ts:85`
- [低] 画像URL取得にタイムアウト/サイズ制限がなく、外部URLでハングやメモリ増のリスクがある。`src/server/services/image.ts:50`

## 推奨確認（QA）
- 透明PNG（alphaあり）を `/api/print` の `image` で送信し、印字の崩れや欠けが出ないか確認する。
- `barcodeType` 欠落や `units` 欠落などの不正入力で 400 が返るか確認する（現状は500想定）。
- `/api/export/xml` に無効 `type` を送信し、適切に弾けるか確認する。
- `/api/status` で `paperNearEmpty` を取得できるか確認する（現状は不可）。
