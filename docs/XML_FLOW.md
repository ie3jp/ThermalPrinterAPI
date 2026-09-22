# XML変換フロー

## 全体の流れ

```
クライアント (JSON)
    │
    ▼
APIルート (/api/print)
    │  PrintRequest { commands: [...] }
    ▼
PrintService (print-service.ts)
    │  画像コマンドがあれば image.ts で BMP Base64 に変換
    ▼
XML Builder (xml-builder.ts)
    │  各コマンドをSDKメソッドに変換
    ▼
SDK (cxmlp-node.ts → cxmlp-api.js)
    │  printer.ToString() で SOAP XML 生成
    ▼
プリンタへ HTTP POST
```

## 具体例

### 入力（クライアントからのJSON）

```json
{
  "commands": [
    {
      "type": "text",
      "data": "Hello",
      "alignment": "center",
      "attribute": { "bold": true },
      "textSize": { "width": 2, "height": 2 }
    },
    {
      "type": "cut",
      "percentage": "partial"
    }
  ]
}
```

### ステップ1: xml-builder.ts で変換関数を通してSDKに渡す

```typescript
// "center" → "Center", { bold: true } → 0x08, { width:2, height:2 } → 0x11
printer.PrintText("Hello", "Center", 8, 17)
printer.CutPaper("Partial")
```

### ステップ2: SDK内部で printer.message にXML断片を蓄積

```xml
<PrintText><Data>Hello</Data><Alignment>Center</Alignment><Attribute>8</Attribute><TextSize>17</TextSize></PrintText>
<CutPaper><Percentage>Partial</Percentage></CutPaper>
```

### ステップ3: printer.ToString() でSOAPエンベロープを付与

```xml
<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
  <s:Body>
    <POSPrinterRequest xmlns="http://www.citizen.co.jp/POSPrinter/" MajorVersion="1">
      <PrintText>
        <Data>Hello</Data>
        <Alignment>Center</Alignment>
        <Attribute>8</Attribute>
        <TextSize>17</TextSize>
      </PrintText>
      <CutPaper>
        <Percentage>Partial</Percentage>
      </CutPaper>
    </POSPrinterRequest>
  </s:Body>
</s:Envelope>
```

## 値の変換マッピング

| API側の値 | SDKに渡す値 | 変換関数 |
|-----------|------------|----------|
| `alignment: "center"` | `"Center"` | `alignmentToSdk()` |
| `attribute: { bold: true }` | `8` (ビットフラグ) | `attributeToNumber()` |
| `textSize: { width:2, height:2 }` | `17` (0x11) | `textSizeToNumber()` |
| `ecLevel: "M"` | `"LevelM"` | `ecLevelToSdk()` |
| `barcodeType: "EAN13"` | `"Ean13"` | `barcodeTypeToSdk()` |
| `percentage: "partial"` | `"Partial"` | `cutPercentageToSdk()` |
| `mode: "mono"` | `"Mono"` | `imageModeToSdk()` |
| `hriPosition: "below"` | `"Below"` | `hriPositionToSdk()` |

## テキスト属性のビットフラグ

| 属性 | ビット |
|------|--------|
| fontB | 0x01 |
| fontC | 0x02 |
| bold | 0x08 |
| reverse | 0x10 |
| underline | 0x80 |

## テキストサイズの数値エンコーディング

上位4ビット: (高さ - 1), 下位4ビット: (幅 - 1)

例: `{ width: 2, height: 2 }` → `(1 << 4) | 1` → `0x11` → `17`

## 役割分担

- **xml-builder.ts**: APIのJSON形式 → SDKの引数形式に変換するアダプタ層
- **cxmlp-api.js (SDK)**: XML構造・フォーマット・整形を担当
- **print-service.ts**: 画像のBMP変換とプリンタへのHTTP通信を担当
