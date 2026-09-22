# Citizen CTS255 SDK コマンド一覧

SDK で利用可能な全コマンドとそのパラメータを列挙する。

## 実装状況

| 状態 | 意味 |
|------|------|
| Phase 1 | 初期リリースで対応 |
| Phase 2 | 次期対応予定 |
| Phase 3 | 将来対応 |
| - | 未対応予定 |

---

## テキスト印刷

### PrintText [Phase 1]
テキストを印刷する。

| パラメータ | 型 | デフォルト | 説明 |
|-----------|-----|-----------|------|
| Data | string | (必須) | 印刷テキスト |
| Alignment | enum | Left | Left / Center / Right |
| Attribute | flags | 0 | Bold, Underline, Reverse, FontB, FontC |
| TextSize | byte | 0 | 幅(1-8倍) x 高さ(1-8倍) |

### PrintPaddingText [Phase 2]
パディング付きテキストを印刷する。

| パラメータ | 型 | デフォルト | 説明 |
|-----------|-----|-----------|------|
| Data | string | (必須) | 印刷テキスト |
| Attribute | flags | 0 | Bold, Underline, Reverse, FontB, FontC |
| TextSize | byte | 0 | 幅(1-8倍) x 高さ(1-8倍) |
| Length | number | 0 | パディング長 |
| Side | enum | Right | Right / Left |

---

## 画像印刷

### PrintMemoryBitmap [Phase 1]
メモリ上の画像（Base64 BMP）を印刷する。

| パラメータ | 型 | デフォルト | 説明 |
|-----------|-----|-----------|------|
| Data | base64 | (必須) | BMP画像データ（Base64） |
| Width | string/number | Asis | "Asis" または幅ドット数 |
| Alignment | enum/number | Left | Left / Center / Right またはオフセット値 |
| Mode | enum | Mono | Mono (1bpp) / Gray (4bpp) |

### PrintNVBitmap [Phase 3]
不揮発メモリに格納済みの画像を印刷する。

| パラメータ | 型 | デフォルト | 説明 |
|-----------|-----|-----------|------|
| NvImageNumber | number | (必須) | 画像番号 |
| Alignment | enum/number | Left | Left / Center / Right またはオフセット値 |

### SetNVBitmap [Phase 3]
画像を不揮発メモリに格納する。

| パラメータ | 型 | デフォルト | 説明 |
|-----------|-----|-----------|------|
| NvImageNumber | number | (必須) | 画像番号 |
| Data | base64 | (必須) | BMP画像データ（Base64） |
| Mode | enum | Mono | Mono / Gray |

---

## バーコード印刷

### PrintBarCode [Phase 2]
1次元バーコードを印刷する。

| パラメータ | 型 | デフォルト | 説明 |
|-----------|-----|-----------|------|
| Data | string | (必須) | バーコードデータ |
| Symbology | enum | Code128 | Upca, Upce, Ean8, Ean13, Jan8, Jan13, Itf, Codabar, Code39, Code93, Code128, Gs1DataBar, Gs1DataBarExpanded, Gs1DataBarTruncated, Gs1DataBarLimited |
| Height | number | 64 | バーコード高さ（ドット） |
| Width | number | 2 | バー幅 |
| Alignment | enum/number | Left | Left / Center / Right またはオフセット値 |
| TextPosition | enum | None | None / Above / Below |

### PrintPDF417 [Phase 2]
PDF417バーコードを印刷する。

| パラメータ | 型 | デフォルト | 説明 |
|-----------|-----|-----------|------|
| Data | string | (必須) | PDF417データ |
| Digits | number | 1 | Auto(0) または桁数 |
| Steps | number | 3 | Auto(0) またはステップ数 |
| ModuleWidth | number | 3 | モジュール幅 |
| StepHeight | number | 3 | ステップ高さ |
| EcLevel | enum | Level2 | Level0〜Level8 |
| Alignment | enum/number | Left | Left / Center / Right またはオフセット値 |

### PrintQRCode [Phase 1]
QRコードを印刷する。

| パラメータ | 型 | デフォルト | 説明 |
|-----------|-----|-----------|------|
| Data | string | (必須) | QRコードデータ |
| ModuleSize | number | 5 | モジュールサイズ（ドット） |
| EcLevel | enum | LevelM | LevelL / LevelM / LevelQ / LevelH |
| Alignment | enum/number | Left | Left / Center / Right またはオフセット値 |

### PrintGS1DataBarStacked [Phase 3]
GS1 DataBar Stackedバーコードを印刷する。

| パラメータ | 型 | デフォルト | 説明 |
|-----------|-----|-----------|------|
| Data | string | (必須) | GS1データ |
| Symbology | enum | Stacked | Stacked / ExpandedStacked / StackedOmnidirectional |
| ModuleSize | number | 4 | モジュールサイズ |
| MaxSize | number | 300 | 最大サイズ |
| Alignment | enum/number | Left | Left / Center / Right またはオフセット値 |

---

## 用紙制御

### CutPaper [Phase 1]
用紙をカットする。

| パラメータ | 型 | デフォルト | 説明 |
|-----------|-----|-----------|------|
| Percentage | enum | PartialPrefeed | Full / Partial / FullPrefeed / PartialPrefeed |

### UnitFeed [Phase 1]
用紙を送る（紙送り）。

| パラメータ | 型 | デフォルト | 説明 |
|-----------|-----|-----------|------|
| UfCount | number | 34 | 送り量（ドット） |

### MarkFeed [Phase 3]
マーク位置まで紙送りする。

| パラメータ | 型 | デフォルト | 説明 |
|-----------|-----|-----------|------|
| Type | enum | Cutter | Cutter / NextTof |

---

## ページモード

### PageModePrint [Phase 3]
ページモードの制御。

| パラメータ | 型 | デフォルト | 説明 |
|-----------|-----|-----------|------|
| Control | enum | PageMode | PageMode / Normal / Cancel |

### SetPageModePrintArea [Phase 3]
ページモードの印刷エリアを設定。

| パラメータ | 型 | デフォルト | 説明 |
|-----------|-----|-----------|------|
| PageModePrintArea | string | "0,0,300,300" | "x,y,width,height" 形式 |

### SetPageModePrintDirection [Phase 3]
ページモードの印刷方向を設定。

| パラメータ | 型 | デフォルト | 説明 |
|-----------|-----|-----------|------|
| PageModePrintDirection | enum | LeftToRight | LeftToRight / BottomToTop / RightToLeft / TopToBottom |

### SetPageModeHorizontalPosition [Phase 3]
ページモードの水平位置を設定。

| パラメータ | 型 | デフォルト | 説明 |
|-----------|-----|-----------|------|
| PageModeHorizontalPosition | number | 0 | 水平オフセット |

### SetPageModeVerticalPosition [Phase 3]
ページモードの垂直位置を設定。

| パラメータ | 型 | デフォルト | 説明 |
|-----------|-----|-----------|------|
| PageModeVerticalPosition | number | 0 | 垂直オフセット |

### ClearPrintArea [Phase 3]
ページモードの印刷エリアをクリア。

パラメータなし。

---

## 設定

### SetEncoding [Phase 2]
文字エンコーディングを設定する。

| パラメータ | 型 | デフォルト | 説明 |
|-----------|-----|-----------|------|
| Encode | enum | UTF-8 | SingleByteCharacter / UTF-8 / UTF-8(Prior half width font) / Japanese / SimplifiedChinese / Korean / TraditionalChinese / None |

### SetCodePage [Phase 3]
コードページを設定する。

| パラメータ | 型 | デフォルト | 説明 |
|-----------|-----|-----------|------|
| CodePage | number | 1 | コードページ番号 |

### SetInternationalCharacterset [Phase 3]
国際文字セットを設定する。

| パラメータ | 型 | デフォルト | 説明 |
|-----------|-----|-----------|------|
| Characterset | number | 8 | 文字セットID |

### SetRecLineSpacing [Phase 3]
行間隔を設定する。

| パラメータ | 型 | デフォルト | 説明 |
|-----------|-----|-----------|------|
| RecLineSpacing | number | 34 | 行間隔（ドット） |

### SetMapMode [Phase 3]
単位系を設定する。

| パラメータ | 型 | デフォルト | 説明 |
|-----------|-----|-----------|------|
| MapMode | enum | Dots | Dots / Twips / English / Metric |

---

## その他

### OpenDrawer [Phase 3]
キャッシュドロワーを開く。

| パラメータ | 型 | デフォルト | 説明 |
|-----------|-----|-----------|------|
| Drawer | enum | Drawer1 | Drawer1 / Drawer2 |
| PulseLength | number | 1 | パルス長 |

### MessageID [Phase 3]
メッセージIDを設定する（トラッキング用）。

| パラメータ | 型 | デフォルト | 説明 |
|-----------|-----|-----------|------|
| MessageID | string | (必須) | メッセージ識別子 |

### RotatePrint [Phase 3]
印刷方向を回転する。

| パラメータ | 型 | デフォルト | 説明 |
|-----------|-----|-----------|------|
| Rotation | enum | Rotate180 | Normal / Rotate180 |
| Barcode | boolean | true | バーコードに適用 |
| Bitmap | boolean | true | ビットマップに適用 |

### PrintData [Phase 3]
生のエスケープシーケンスを送信する。

| パラメータ | 型 | デフォルト | 説明 |
|-----------|-----|-----------|------|
| Data | string | (必須) | エスケープシーケンスデータ |

### ClearOutput [Phase 3]
出力バッファをクリアする。

パラメータなし。
