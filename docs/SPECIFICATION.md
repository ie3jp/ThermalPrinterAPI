# Citizen CTS255 印刷API仕様書

## 概要

Citizen CTS255サーマルプリンタに画像とテキストを送信するヘッドレスAPIエンドポイントを構築する。デバッグ用のGUIも提供する。

---

## SDK調査結果

### CITIZEN JavaScript POS SDK (cxmlp-api.js)

SDKは`citizen.CXMLPrint`クラスを提供し、以下の機能が利用可能：

| メソッド | 説明 |
|---------|------|
| `PrintText(data, alignment, attribute, textSize)` | テキスト印刷 |
| `PrintMemoryBitmap(base64Data, width, alignment, mode)` | 画像印刷（Base64） |
| `PrintQRCode(data, moduleSize, ecLevel, alignment)` | QRコード印刷 |
| `PrintBarCode(...)` | バーコード印刷 |
| `CutPaper(percentage)` | 用紙カット |
| `UnitFeed(count)` | 紙送り |
| `SetEncoding(encode)` | 文字エンコーディング設定 |

### 通信方式

```
HTTP POST → http://[プリンタIP]:8080/
Content-Type: text/xml; charset=UTF-8
SOAPAction: ""
```

リクエストはSOAP/XML形式でラップされる：
```xml
<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
  <s:Body>
    <POSPrinterRequest xmlns="http://www.citizen.co.jp/POSPrinter/" MajorVersion="1">
      <!-- コマンド群 -->
    </POSPrinterRequest>
  </s:Body>
</s:Envelope>
```

---

## 提案アーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│                      printAPI サーバー                        │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────┐    ┌───────────────┐    ┌─────────────┐ │
│  │   Hono API    │    │  Debug GUI    │    │  Static     │ │
│  │  (REST/JSON)  │    │  (Vue 3)      │    │  Assets     │ │
│  └───────┬───────┘    └───────────────┘    └─────────────┘ │
│          │                                                   │
│          ▼                                                   │
│  ┌───────────────────────────────────────────────────────┐ │
│  │              PrintService                              │ │
│  │  - XML Builder (SDK互換)                               │ │
│  │  - Image Processor (Sharp/Canvas)                      │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ HTTP POST (SOAP/XML)
                    ┌─────────────────────┐
                    │  Citizen CTS255     │
                    │  (192.168.x.x:8080) │
                    └─────────────────────┘
```

---

## 技術スタック

| 項目 | 選定 | 理由 |
|------|------|------|
| Runtime | **Bun** または Node.js | 高速、TypeScript native |
| Server | **Hono** | 軽量、エッジ対応、TypeScript |
| Build | **Vite** | 高速HMR、モダン |
| Frontend | **Vue 3** (Composition API) | SDKサンプルのUI構造を参考 |
| Styling | **Tailwind CSS** | ユーティリティファースト |
| Image | **Sharp** | Node.js画像処理 |

---

## APIエンドポイント設計

### 1. 印刷実行

```
POST /api/print
Content-Type: application/json

{
  "printerUrl": "http://192.168.10.100:8080/",
  "commands": [
    {
      "type": "text",
      "data": "Hello World\n",
      "alignment": "center",
      "attribute": { "bold": true },
      "textSize": { "width": 2, "height": 2 }
    },
    {
      "type": "image",
      "data": "base64...",  // または URL
      "alignment": "center",
      "mode": "mono"  // "mono" | "gray"
    },
    {
      "type": "qrcode",
      "data": "https://example.com",
      "moduleSize": 5,
      "ecLevel": "M"
    },
    {
      "type": "cut",
      "percentage": "partial"
    }
  ]
}

Response:
{
  "success": true,
  "messageId": "uuid",
  "response": { ... }
}
```

### 2. ステータス取得

```
GET /api/status?printerUrl=http://192.168.10.100:8080/

Response:
{
  "connected": true,
  "deviceStatus": "online",
  "paperNearEmpty": false
}
```

### 3. XMLエクスポート（デバッグ用）

```
POST /api/export/xml
(同上のbody)

Response:
{
  "xml": "<?xml version=\"1.0\"...>"
}
```

### 4. テンプレート印刷

```
POST /api/print/template
{
  "printerUrl": "...",
  "templateId": "receipt-v1",
  "variables": {
    "title": "領収書",
    "items": [...],
    "total": 1000
  }
}
```

---

## データ形式

### コマンドタイプ定義

```typescript
type PrintCommand =
  | TextCommand
  | ImageCommand
  | QRCodeCommand
  | BarCodeCommand
  | CutCommand
  | FeedCommand
  | RawCommand;

interface TextCommand {
  type: 'text';
  data: string;
  alignment?: 'left' | 'center' | 'right';
  attribute?: {
    fontB?: boolean;
    fontC?: boolean;
    bold?: boolean;
    reverse?: boolean;
    underline?: boolean;
  };
  textSize?: {
    width?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
    height?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  };
}

interface ImageCommand {
  type: 'image';
  data: string;  // Base64 or URL
  width?: number | 'asis';
  alignment?: 'left' | 'center' | 'right' | number;
  mode?: 'mono' | 'gray';
}

interface QRCodeCommand {
  type: 'qrcode';
  data: string;
  moduleSize?: number;
  ecLevel?: 'L' | 'M' | 'Q' | 'H';
  alignment?: 'left' | 'center' | 'right';
}

interface CutCommand {
  type: 'cut';
  percentage?: 'full' | 'partial' | 'fullPrefeed' | 'partialPrefeed';
}
```

---

## 確定した仕様

| 項目 | 決定内容 |
|------|----------|
| 用途 | 汎用（複数用途対応） |
| プリンタIP | 環境変数で固定 (`PRINTER_URL`) |
| 認証 | なし（同一LAN内使用想定） |
| ポート | 8080 |
| 用紙幅 | 80mm (576ドット) |
| 画像対応 | モノクロ/グレースケール両方 |
| デプロイ先 | ローカルPC |
| Runtime | Node.js 22+ (TypeScript native) |
| Package Manager | pnpm |

---

## 技術的な対応方針

### 1. SDK互換性

**決定**: SDKのXML生成ロジックを参考に、TypeScriptで新規実装（B案）

### 2. 画像処理

- Sharpで画像をリサイズ・変換
- モノクロ（1bpp）とグレースケール（4bpp）両対応
- ディザリング対応

### 3. エラーハンドリング

- プリンタ接続エラー → HTTPステータス + エラーメッセージ
- タイムアウト → 10秒でタイムアウト

---

## GUI開発ロードマップ

### Phase 1（最小限）- 初期実装
- [x] プリンタURL設定（環境変数）
- [ ] テキスト印刷
- [ ] 画像印刷
- [ ] QRコード印刷
- [ ] カット
- [ ] XMLプレビュー

### Phase 2（標準）
- [ ] バーコード印刷
- [ ] フォント設定（属性・サイズ）
- [ ] ページモード

### Phase 3（フル）
- [ ] SDKサンプル同等の全機能
- [ ] Swagger/OpenAPI生成
- [ ] テンプレート保存/読込

---

## ディレクトリ構造案

```
printAPI/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── src/
│   ├── server/
│   │   ├── index.ts          # Honoサーバー
│   │   ├── routes/
│   │   │   ├── print.ts      # /api/print
│   │   │   └── status.ts     # /api/status
│   │   ├── services/
│   │   │   ├── printer.ts    # プリンタ通信
│   │   │   ├── xml-builder.ts # XML生成
│   │   │   └── image.ts      # 画像処理
│   │   └── types/
│   │       └── commands.ts   # 型定義
│   └── client/
│       ├── main.ts
│       ├── App.vue
│       ├── components/
│       │   ├── CommandPanel.vue
│       │   ├── TextCommand.vue
│       │   ├── ImageCommand.vue
│       │   └── Preview.vue
│       └── stores/
│           └── print.ts      # Pinia store
├── public/
└── index.html
```

---

## 次のステップ

1. **質問への回答確認**
   - プリンタIP設定方法
   - 認証要件
   - デバッグGUIの必要範囲

2. **プロジェクト初期化**
   - Vite + Hono + Vue 3 セットアップ
   - TypeScript設定

3. **コア機能実装**
   - XML Builder（SDK互換）
   - PrintService

4. **API実装**
   - `/api/print` エンドポイント
   - `/api/status` エンドポイント

5. **デバッグGUI実装**
   - 基本UI
   - コマンドビルダー

---

## 参考

- SDK: `/CSJJavaScriptPOSSDK_V103J/Library/cxmlp-api.js`
- サンプル: `/CSJJavaScriptPOSSDK_V103J/Sample/cxmlp-editor/`
- マニュアル: `/CSJJavaScriptPOSSDK_V103J/Manual/`
