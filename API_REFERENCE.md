# ThermalPrinterAPI リファレンス

メディアアート・インスタレーション向けサーマルプリンタ制御API

## 接続情報

| 項目 | 値 |
|------|-----|
| APIサーバー | `http://localhost:3456` |
| OSCポート | `9000` (UDP) |

---

## HTTP API

### POST /api/print

印刷ジョブを実行します。

#### リクエスト

```json
{
  "commands": [
    { "type": "text", "data": "Hello World", "alignment": "center" },
    { "type": "cut", "percentage": "partial" }
  ]
}
```

#### レスポンス

```json
{
  "success": true,
  "response": { ... }
}
```

---

### POST /api/export/xml

印刷せずにXMLを生成します（デバッグ用）。

#### レスポンス

```json
{
  "xml": "<?xml version=\"1.0\" ...>"
}
```

---

### GET /api/status

プリンタのステータスを取得します。

---

## OSC API

UDPポート9000で受信。TouchDesigner、Max/MSP、Processing等から直接制御できます。

### アドレス一覧

| アドレス | 引数 | 説明 |
|---------|------|------|
| `/print/text` | `data [alignment] [attribute] [widthMult] [heightMult]` | テキスト印刷 |
| `/print/image` | `base64data [width] [alignment] [mode]` | 画像印刷 |
| `/print/qrcode` | `data [moduleSize] [ecLevel] [alignment]` | QRコード印刷 |
| `/print/barcode` | `data barcodeType [height] [width] [alignment] [hriPos]` | バーコード印刷 |
| `/print/cut` | `[percentage]` | 用紙カット |
| `/print/feed` | `units` | 紙送り |
| `/print/drawer` | `[drawer] [pulseLength]` | ドロワー開閉 |
| `/print/raw` | `xmlString` | 生XML送信 |
| `/print/json` | `jsonString` | JSON形式でコマンド配列送信 |

### OSC使用例

```
# テキスト印刷（センター揃え、太字）
/print/text "Hello World" center 8

# QRコード印刷
/print/qrcode "https://example.com" 4 M center

# カット
/print/cut partial

# 複合コマンド（JSON形式）
/print/json '[{"type":"text","data":"Title","alignment":"center"},{"type":"cut"}]'
```

---

## コマンドリファレンス

### text - テキスト印刷

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|-----------|------|
| `data` | string | ○ | - | 印刷テキスト |
| `alignment` | string | - | `left` | `left` / `center` / `right` |
| `attribute` | number | - | `0` | テキスト属性（ビットフラグ） |
| `textSize` | number | - | `0` | 文字サイズ |

#### テキスト属性（ビットフラグ）

| 属性 | 値 | 説明 |
|------|-----|------|
| FontB | 1 | フォントB |
| FontC | 2 | フォントC |
| Bold | 8 | 太字 |
| Reverse | 64 | 白黒反転 |
| Underline | 128 | 下線 |

複数属性を組み合わせる場合は値を足す（例: 太字+下線 = 8+128 = 136）

#### 文字サイズ

幅倍率(1-8)と高さ倍率(1-8)を組み合わせた値。`(width - 1) | ((height - 1) << 4)`

| textSize | 幅 | 高さ |
|----------|-----|------|
| 0 | 1倍 | 1倍 |
| 1 | 2倍 | 1倍 |
| 16 | 1倍 | 2倍 |
| 17 | 2倍 | 2倍 |

---

### image - 画像印刷

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|-----------|------|
| `data` | string | ○ | - | Base64、Data URL、または画像URL |
| `width` | number | - | `576` | 幅（ドット）。最大576 |
| `alignment` | string | - | `left` | `left` / `center` / `right` |
| `mode` | string | - | `mono` | `mono`（モノクロ）/ `gray`（グレースケール） |

#### 画像処理

- **mono**: Floyd-Steinbergディザリングで2値化（高コントラスト）
- **gray**: 16階調グレースケール（写真向け）
- アルファチャンネルは自動的に白背景に合成
- 対応フォーマット: PNG, JPEG, GIF, BMP, WebP

---

### qrcode - QRコード印刷

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|-----------|------|
| `data` | string | ○ | - | QRコードに埋め込むデータ |
| `moduleSize` | number | - | `5` | モジュールサイズ（1-16） |
| `ecLevel` | string | - | `M` | 誤り訂正レベル: `L` / `M` / `Q` / `H` |
| `alignment` | string | - | `left` | `left` / `center` / `right` |

#### 誤り訂正レベル

| レベル | 復元能力 |
|--------|---------|
| L | 約7% |
| M | 約15% |
| Q | 約25% |
| H | 約30% |

---

### barcode - バーコード印刷

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|-----------|------|
| `data` | string | ○ | - | バーコードデータ |
| `barcodeType` | string | ○ | - | バーコード種別 |
| `height` | number | - | `64` | 高さ（ドット） |
| `width` | number | - | `2` | バー幅（1-6） |
| `alignment` | string | - | `left` | `left` / `center` / `right` |
| `hriPosition` | string | - | `none` | 数字表示位置: `none` / `above` / `below` / `both` |

#### バーコード種別

| barcodeType | 説明 | データ形式 |
|-------------|------|-----------|
| `CODE128` | Code 128 | 英数字 |
| `EAN13` | EAN-13 | 数字12-13桁 |
| `EAN8` | EAN-8 | 数字7-8桁 |
| `UPC_A` | UPC-A | 数字11-12桁 |
| `UPC_E` | UPC-E | 数字6-8桁 |
| `CODE39` | Code 39 | 英数字+記号 |
| `ITF` | Interleaved 2 of 5 | 数字（偶数桁） |
| `CODABAR` | Codabar | 数字+記号 |
| `CODE93` | Code 93 | 英数字 |

---

### cut - 用紙カット

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|-----------|------|
| `percentage` | string | - | `partialPrefeed` | カット方式 |

#### カット方式

| percentage | 説明 |
|------------|------|
| `full` | 全カット |
| `partial` | 部分カット（ミシン目） |
| `fullPrefeed` | 全カット + 次の用紙を先送り |
| `partialPrefeed` | 部分カット + 次の用紙を先送り |

---

### feed - 紙送り

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|-----------|------|
| `units` | number | ○ | - | 送り量（ドット単位） |

---

### paddingText - パディング付きテキスト

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|-----------|------|
| `data` | string | ○ | - | 印刷テキスト |
| `length` | number | ○ | - | 全体の文字数 |
| `side` | string | - | `right` | パディング方向: `left` / `right` |
| `attribute` | number | - | `0` | テキスト属性 |
| `textSize` | number | - | `0` | 文字サイズ |

---

### openDrawer - ドロワー開閉

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|-----------|------|
| `drawer` | string | - | `Drawer1` | `Drawer1` / `Drawer2` |
| `pulseLength` | number | - | `1` | パルス長 |

---

### raw - 生XML送信

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|-----------|------|
| `xml` | string | ○ | - | SOAP/XMLデータ |

---

## 使用例

### cURL

```bash
# テキスト印刷
curl -X POST http://localhost:3456/api/print \
  -H 'Content-Type: application/json' \
  -d '{
    "commands": [
      {"type": "text", "data": "Hello World!", "alignment": "center"},
      {"type": "feed", "units": 50},
      {"type": "cut", "percentage": "partial"}
    ]
  }'

# QRコード + テキスト
curl -X POST http://localhost:3456/api/print \
  -H 'Content-Type: application/json' \
  -d '{
    "commands": [
      {"type": "text", "data": "Scan me!", "alignment": "center"},
      {"type": "feed", "units": 20},
      {"type": "qrcode", "data": "https://example.com", "moduleSize": 6, "alignment": "center"},
      {"type": "feed", "units": 50},
      {"type": "cut"}
    ]
  }'

# 画像印刷（URL指定）
curl -X POST http://localhost:3456/api/print \
  -H 'Content-Type: application/json' \
  -d '{
    "commands": [
      {"type": "image", "data": "https://example.com/image.png", "width": 400, "mode": "mono"},
      {"type": "cut"}
    ]
  }'
```

### Node.js

```javascript
const API_URL = 'http://localhost:3456'

async function print(commands) {
  const response = await fetch(`${API_URL}/api/print`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ commands }),
  })
  return response.json()
}

// テキスト印刷
await print([
  { type: 'text', data: 'Hello World!', alignment: 'center', attribute: 8 },
  { type: 'cut', percentage: 'partial' },
])

// 画像印刷（Base64）
import { readFileSync } from 'fs'
const base64 = readFileSync('./image.png').toString('base64')
const dataUrl = `data:image/png;base64,${base64}`

await print([
  { type: 'image', data: dataUrl, width: 400, mode: 'mono' },
  { type: 'cut' },
])
```

### Python

```python
import requests
import base64

API_URL = 'http://localhost:3456'

def print_commands(commands):
    response = requests.post(
        f'{API_URL}/api/print',
        json={'commands': commands}
    )
    return response.json()

# テキスト印刷
print_commands([
    {'type': 'text', 'data': 'Hello World!', 'alignment': 'center'},
    {'type': 'cut', 'percentage': 'partial'},
])

# 画像印刷
with open('image.png', 'rb') as f:
    base64_data = base64.b64encode(f.read()).decode()
    data_url = f'data:image/png;base64,{base64_data}'

print_commands([
    {'type': 'image', 'data': data_url, 'width': 400, 'mode': 'mono'},
    {'type': 'cut'},
])
```

### TouchDesigner

OSC Out CHOPを使用:

```
Network: localhost
Port: 9000
Address: /print/text
Arguments: "Hello from TD" center
```

複合コマンドを送る場合はJSON形式:

```
Address: /print/json
Arguments: '[{"type":"text","data":"TouchDesigner Print"},{"type":"qrcode","data":"https://derivative.ca","alignment":"center"},{"type":"cut"}]'
```

### Max/MSP

```
[udpsend localhost 9000]
│
├── [prepend /print/text] ← [message "Hello from Max" center]
│
├── [prepend /print/qrcode] ← [message "https://cycling74.com" 6 M center]
│
└── [prepend /print/cut] ← [bang]
```

### Processing

```java
import oscP5.*;
import netP5.*;

OscP5 oscP5;
NetAddress printer;

void setup() {
  oscP5 = new OscP5(this, 12000);
  printer = new NetAddress("localhost", 9000);
}

void draw() {
  // press any key to print
}

void keyPressed() {
  OscMessage msg = new OscMessage("/print/text");
  msg.add("Hello from Processing");
  msg.add("center");
  oscP5.send(msg, printer);

  OscMessage cut = new OscMessage("/print/cut");
  cut.add("partial");
  oscP5.send(cut, printer);
}
```

---

## 用紙仕様

| 項目 | 値 |
|------|-----|
| 用紙幅 | 80mm |
| 印刷可能幅 | 72mm (576ドット) |
| 解像度 | 203 dpi |

---

## エラーハンドリング

### HTTPレスポンス

| ステータス | 説明 |
|-----------|------|
| 200 | 成功 |
| 400 | リクエスト不正 |
| 500 | サーバーエラー |
| 504 | プリンタタイムアウト（10秒） |

### エラーレスポンス例

```json
{
  "success": false,
  "error": "Printer connection timeout"
}
```
