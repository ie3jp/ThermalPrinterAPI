/**
 * Citizen CTS255 印刷API 型定義
 * 全SDKコマンド対応
 */

// テキスト配置
export type Alignment = 'left' | 'center' | 'right'

// カット種別
export type CutPercentage = 'full' | 'partial' | 'fullPrefeed' | 'partialPrefeed'

// QRコードエラー訂正レベル
export type QRCodeECLevel = 'L' | 'M' | 'Q' | 'H'

// 画像モード
export type ImageMode = 'mono' | 'gray'

// テキストサイズ（1-8倍）
export type TextSizeMultiplier = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

// バーコードタイプ
export type BarcodeType =
  | 'UPC_A'
  | 'UPC_E'
  | 'EAN13'
  | 'EAN8'
  | 'CODE39'
  | 'ITF'
  | 'CODABAR'
  | 'CODE93'
  | 'CODE128'
  | 'GS1_DATABAR'
  | 'GS1_DATABAR_EXPANDED'
  | 'GS1_DATABAR_TRUNCATED'
  | 'GS1_DATABAR_LIMITED'

// バーコードHRI位置
export type BarcodeHRIPosition = 'none' | 'above' | 'below' | 'both'

// PDF417 エラー訂正レベル
export type PDF417ECLevel = 'Level0' | 'Level1' | 'Level2' | 'Level3' | 'Level4' | 'Level5' | 'Level6' | 'Level7' | 'Level8'

// GS1 DataBar Stacked タイプ
export type GS1DataBarStackedType = 'Stacked' | 'ExpandedStacked' | 'StackedOmnidirectional'

// MarkFeed タイプ
export type MarkFeedType = 'Cutter' | 'NextTof'

// ページモード制御
export type PageModeControl = 'PageMode' | 'Normal' | 'Cancel'

// ページモード印刷方向
export type PageModeDirection = 'LeftToRight' | 'BottomToTop' | 'RightToLeft' | 'TopToBottom'

// エンコーディング
export type EncodingType = 'UTF-8' | 'Japanese' | 'SimplifiedChinese' | 'Korean' | 'TraditionalChinese' | 'SingleByteCharacter' | 'None'

// MapMode
export type MapModeType = 'Dots' | 'Twips' | 'English' | 'Metric'

// RotatePrint
export type RotationType = 'Normal' | 'Rotate180'

// パディングテキスト方向
export type PaddingSide = 'Right' | 'Left'

// ドロワー
export type DrawerType = 'Drawer1' | 'Drawer2'

/**
 * テキストフォント属性
 */
export interface TextAttribute {
  fontB?: boolean
  fontC?: boolean
  bold?: boolean
  reverse?: boolean
  underline?: boolean
}

/**
 * テキストサイズ設定
 */
export interface TextSize {
  width?: TextSizeMultiplier
  height?: TextSizeMultiplier
}

// --- コマンドインターフェース ---

export interface TextCommand {
  type: 'text'
  data: string
  alignment?: Alignment
  attribute?: TextAttribute
  textSize?: TextSize
}

export interface PaddingTextCommand {
  type: 'paddingText'
  data: string
  attribute?: TextAttribute
  textSize?: TextSize
  length?: number
  side?: PaddingSide
}

export interface ImageCommand {
  type: 'image'
  data: string
  width?: number | 'asis'
  alignment?: Alignment | number
  mode?: ImageMode
}

export interface QRCodeCommand {
  type: 'qrcode'
  data: string
  moduleSize?: number
  ecLevel?: QRCodeECLevel
  alignment?: Alignment
}

export interface BarcodeCommand {
  type: 'barcode'
  data: string
  barcodeType: BarcodeType
  height?: number
  width?: number
  alignment?: Alignment
  hriPosition?: BarcodeHRIPosition
  hriFont?: 'A' | 'B'
}

export interface PDF417Command {
  type: 'pdf417'
  data: string
  digits?: number
  steps?: number
  moduleWidth?: number
  stepHeight?: number
  ecLevel?: PDF417ECLevel
  alignment?: Alignment
}

export interface GS1DataBarStackedCommand {
  type: 'gs1DataBarStacked'
  data: string
  symbology?: GS1DataBarStackedType
  moduleSize?: number
  maxSize?: number
  alignment?: Alignment
}

export interface CutCommand {
  type: 'cut'
  percentage?: CutPercentage
}

export interface FeedCommand {
  type: 'feed'
  units: number
}

export interface MarkFeedCommand {
  type: 'markFeed'
  feedType?: MarkFeedType
}

export interface PageModePrintCommand {
  type: 'pageModePrint'
  control?: PageModeControl
}

export interface SetPageModePrintAreaCommand {
  type: 'setPageModePrintArea'
  x?: number
  y?: number
  width?: number
  height?: number
}

export interface SetPageModePrintDirectionCommand {
  type: 'setPageModePrintDirection'
  direction?: PageModeDirection
}

export interface SetPageModeHPosCommand {
  type: 'setPageModeHPos'
  position?: number
}

export interface SetPageModeVPosCommand {
  type: 'setPageModeVPos'
  position?: number
}

export interface ClearPrintAreaCommand {
  type: 'clearPrintArea'
}

export interface SetEncodingCommand {
  type: 'setEncoding'
  encoding: string
}

export interface SetCodePageCommand {
  type: 'setCodePage'
  codePage: number
}

export interface SetCharactersetCommand {
  type: 'setCharacterset'
  characterset: number
}

export interface SetLineSpacingCommand {
  type: 'setLineSpacing'
  spacing: number
}

export interface SetMapModeCommand {
  type: 'setMapMode'
  mapMode: MapModeType
}

export interface OpenDrawerCommand {
  type: 'openDrawer'
  drawer?: DrawerType
  pulseLength?: number
}

export interface MessageIdCommand {
  type: 'messageId'
  messageId: string
}

export interface RotatePrintCommand {
  type: 'rotatePrint'
  rotation?: RotationType
  barcode?: boolean
  bitmap?: boolean
}

export interface ClearOutputCommand {
  type: 'clearOutput'
}

export interface RawCommand {
  type: 'raw'
  xml: string
}

/**
 * 全印刷コマンド型
 */
export type PrintCommand =
  | TextCommand
  | PaddingTextCommand
  | ImageCommand
  | QRCodeCommand
  | BarcodeCommand
  | PDF417Command
  | GS1DataBarStackedCommand
  | CutCommand
  | FeedCommand
  | MarkFeedCommand
  | PageModePrintCommand
  | SetPageModePrintAreaCommand
  | SetPageModePrintDirectionCommand
  | SetPageModeHPosCommand
  | SetPageModeVPosCommand
  | ClearPrintAreaCommand
  | SetEncodingCommand
  | SetCodePageCommand
  | SetCharactersetCommand
  | SetLineSpacingCommand
  | SetMapModeCommand
  | OpenDrawerCommand
  | MessageIdCommand
  | RotatePrintCommand
  | ClearOutputCommand
  | RawCommand

/**
 * 印刷リクエスト
 */
export interface PrintRequest {
  printerUrl?: string
  commands: PrintCommand[]
}

/**
 * 印刷レスポンス
 */
export interface PrintResponse {
  success: boolean
  message: string
  messageId?: string
  xml?: string
  response?: string
  error?: string
}

/**
 * ステータスレスポンス
 */
export interface StatusResponse {
  connected: boolean
  deviceStatus?: 'online' | 'offline' | 'error'
  paperNearEmpty?: boolean
  error?: string
}

/**
 * XMLエクスポートレスポンス
 */
export interface ExportXmlResponse {
  success: boolean
  xml: string
  error?: string
}

// SDK互換の数値変換ユーティリティ

/**
 * テキスト属性をSDK互換のビットフラグに変換
 */
export function attributeToNumber(attr?: TextAttribute): number {
  if (!attr) return 0
  let value = 0
  if (attr.fontB) value |= 0x01
  if (attr.fontC) value |= 0x02
  if (attr.bold) value |= 0x08
  if (attr.reverse) value |= 0x40
  if (attr.underline) value |= 0x80
  return value
}

/**
 * テキストサイズをSDK互換の数値に変換
 * 上位4ビット: 高さ-1, 下位4ビット: 幅-1
 */
export function textSizeToNumber(size?: TextSize): number {
  if (!size) return 0
  const w = (size.width ?? 1) - 1
  const h = (size.height ?? 1) - 1
  return (h << 4) | w
}
