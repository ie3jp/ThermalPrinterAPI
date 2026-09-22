# ThermalPrinterAPI

サーマルプリンタを、ブラウザのGUI・HTTP API・OSCから操作するための小さなツールです。

IE3がTOKYO PROTOTYPEで展示した **Proto-rait** の制作に合わせて開発しました。作品側のプログラムから印刷を呼び出せるようにし、紙幅や画像の階調、コマンドの組み合わせはGUIで試せる構成にしています。

対象は **CITIZEN CT-S255のXML Printサービスを利用できるネットワーク構成**です。USB接続のみのモデルや他社製プリンタへの対応は確認していません。CITIZENの公式製品ではありません。

## できること

- テキスト、画像、QRコード、バーコードの印刷
- 紙送り・カットなどを組み合わせたコマンドの実行
- GUIでのコマンド編集、JSON／XMLプレビュー、テンプレート保存
- HTTP API・OSCによるTouchDesigner、Max/MSP、自作プログラムとの連携
- 画像のリサイズ、Floyd–Steinbergディザリング、モノクロ／16階調BMPへの変換
- 印刷要求を順番に処理するキュー

## 構成

```text
GUI / HTTP / OSC
       ↓
Node.js + Hono
       ↓
画像変換（Sharp）→ XML生成（CITIZEN SDK）
       ↓
プリンタのXML Printサービス
```

GUIはVue 3 + Vite、サーバーはTypeScriptです。

## 必要なもの

- Node.js 22以上、pnpm 9.15.0
- XML Printサービスを利用できるCITIZENプリンタと、同じLAN上のPC
- CITIZEN POS Print SDK（JavaScript）の `cxmlp-api.js`

SDKは独自の使用許諾に従います。[公式ダウンロードページ](https://www.citizen-systems.co.jp/printer/download/sdk/)と[第三者ソフトウェアについて](THIRD_PARTY_NOTICES.md)を確認してください。本リポジトリにはSDKを同梱していません。使用許諾に同意して公式配布物を入手し、`Library/cxmlp-api.js` を次の手順で配置します。

## 起動する

```bash
git clone https://github.com/ie3jp/ThermalPrinterAPI.git
cd ThermalPrinterAPI
pnpm install --frozen-lockfile
pnpm sdk:install /path/to/CSJJavaScriptPOSSDK/Library/cxmlp-api.js
PRINTER_URL=http://192.168.1.100:8080/ pnpm dev
```

- GUI：`http://localhost:5173`
- HTTP API：`http://localhost:3456`
- OSC：UDP `9350`（現行コードの既定値）

GUIの「プリンタURL」に `http://プリンタのIPアドレス:8080/` を入力してください。空欄の場合とOSCでの印刷には、起動時の `PRINTER_URL` 環境変数が使われます。既定値は `http://127.0.0.1:8080/` です。`.env` の自動読み込みは行いません。

`PORT` と `OSC_PORT` は環境変数で変更できます。

```bash
PRINTER_URL=http://192.168.1.100:8080/ OSC_PORT=9000 pnpm dev
```

GUIのMax/MSP用サンプルは9000番を案内するため、そのまま使う場合は上記のようにOSCポートを合わせてください。APIのポートを変更する場合は、`vite.config.ts` のプロキシ設定やクライアント側の接続先も合わせます。API起動時にポートが使用中だと次の空きポートを探すため、実際のポートは起動ログを確認してください。

認証なしでLANから印刷できる開発・展示用ツールです。信頼できるネットワークで使用し、インターネットへ直接公開しないでください。

## HTTP APIの例

### テキストとカット

`printerUrl` は実機のアドレスに置き換えます。

```bash
curl http://localhost:3456/api/print \
  -H 'Content-Type: application/json' \
  -d '{
    "printerUrl": "http://192.168.1.100:8080/",
    "commands": [
      {"type": "text", "data": "Hello from IE3!", "alignment": "center"},
      {"type": "feed", "units": 2},
      {"type": "cut", "percentage": "partial"}
    ]
  }'
```

### 画像

同じ `commands` 配列に画像コマンドを追加できます。`data` は画像URLまたはBase64文字列を受け付けます。

```json
{
  "type": "image",
  "data": "https://example.com/image.png",
  "width": 576,
  "alignment": "center",
  "mode": "mono"
}
```

`mono` は1bitモノクロ、`gray` は4bit・16階調です。576ドットは80mm用紙を想定した基準値です。用紙幅とプリンタの対応に合わせて指定してください。BMP入力は変換を迂回するため、適切な形式・サイズをあらかじめ用意します。

### 接続確認とXMLの確認

- `GET /health`：APIサーバーの稼働確認
- `GET /api/status?printerUrl=...`：プリンタとの通信確認
- `POST /api/export/xml`：印刷と同じコマンド形式からXMLを生成

`/api/status` は用紙残量などすべての実機状態を取得するものではありません。

## OSC

送信先はAPIサーバーを実行するPCのIPアドレス、既定ポートはUDP 9350です。

| アドレス | 主な引数 |
| --- | --- |
| `/print/text` | 文字列、配置、属性、横倍率、縦倍率 |
| `/print/image` | Base64画像、幅、配置、モード |
| `/print/qrcode` | 文字列、モジュールサイズ、誤り訂正レベル、配置 |
| `/print/barcode` | 文字列、種類、高さ、幅、配置、文字位置 |
| `/print/feed` | 紙送り量 |
| `/print/cut` | カット方法 |
| `/print/json` | コマンド配列のJSON文字列 |
| `/print/file` | サーバー上のJSONファイルのパス |

テキストやJSONなどの文字列は、TouchDesignerではOSC Out DAT等から送信できます。Max/MSPの例は [examples/PrintAPI-example.maxpat](examples/PrintAPI-example.maxpat) を参照し、送信先ポートを合わせてください。

## サンプル・詳細資料

- [APIリファレンス](API_REFERENCE.md)
- [CLIサンプル](examples/)
- [コマンド一覧](docs/COMMANDS.md)
- [設計時の仕様書](docs/SPECIFICATION.md)

`docs/TASKS.md`、`docs/QA.md`、`docs/XML_FLOW.md` は開発途中の記録です。未完了表記やポート番号、ファイル構成が現在の実装と異なる場合があります。まずこのREADMEと実装を参照してください。

## ビルド・確認

```bash
pnpm test
pnpm typecheck
pnpm build
pnpm start
```

ビルド後は `http://localhost:3456` でGUIとAPIを配信します。

macOSアプリをローカルで作成する場合：

```bash
pnpm package:mac
```

出力先は `release/PrintAPI.app`。現在のスクリプトはApple Silicon向けNode.jsを同梱し、Terminalでサーバーを起動してブラウザを開きます。署名・公証済みのアプリではありません。生成物にはCITIZEN SDKが含まれるため、そのまま一般配布しないでください。

実機の印字品質や動作は、プリンタ・用紙・ネットワーク環境で確認してください。

## ライセンス

IE3が作成したコードは [ISC License](LICENSE) で公開しています。CITIZEN SDK・参考サンプル・旧リポジトリの履歴・過去の配布アプリは含めていません。

利用者が別途導入するSDKや依存ライブラリには、それぞれの使用許諾が適用されます。詳細は [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) を参照してください。

制作：[IE3](https://ie3.jp/)
