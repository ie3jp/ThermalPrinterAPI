/**
 * SDK アダプタ
 * APIのJSON形式コマンドをCitizen SDKのメソッド呼び出しに変換し、
 * SDKにXML生成を委譲する
 */

import { createPrinter } from '../lib/cxmlp-node.js'
import type {
  PrintCommand,
  TextCommand,
  PaddingTextCommand,
  ImageCommand,
  QRCodeCommand,
  BarcodeCommand,
  PDF417Command,
  GS1DataBarStackedCommand,
  CutCommand,
  FeedCommand,
  MarkFeedCommand,
  PageModePrintCommand,
  SetPageModePrintAreaCommand,
  SetPageModePrintDirectionCommand,
  SetPageModeHPosCommand,
  SetPageModeVPosCommand,
  SetEncodingCommand,
  SetCodePageCommand,
  SetCharactersetCommand,
  SetLineSpacingCommand,
  SetMapModeCommand,
  OpenDrawerCommand,
  MessageIdCommand,
  RotatePrintCommand,
} from '../types/commands.js'

import {
  attributeToNumber,
  textSizeToNumber,
} from '../types/commands.js'

function alignmentToSdk(alignment?: string): string {
  switch (alignment) {
    case 'left': return 'Left'
    case 'center': return 'Center'
    case 'right': return 'Right'
    default: return 'Left'
  }
}

function cutPercentageToSdk(percentage?: string): string {
  switch (percentage) {
    case 'full': return 'Full'
    case 'partial': return 'Partial'
    case 'fullPrefeed': return 'FullPrefeed'
    case 'partialPrefeed': return 'PartialPrefeed'
    default: return 'PartialPrefeed'
  }
}

function ecLevelToSdk(level?: string): string {
  switch (level) {
    case 'L': return 'LevelL'
    case 'M': return 'LevelM'
    case 'Q': return 'LevelQ'
    case 'H': return 'LevelH'
    default: return 'LevelM'
  }
}

function barcodeTypeToSdk(type: string): string {
  const mapping: Record<string, string> = {
    UPC_A: 'Upca',
    UPC_E: 'Upce',
    EAN13: 'Ean13',
    EAN8: 'Ean8',
    CODE39: 'Code39',
    ITF: 'Itf',
    CODABAR: 'Codabar',
    CODE93: 'Code93',
    CODE128: 'Code128',
    GS1_DATABAR: 'Gs1DataBar',
    GS1_DATABAR_EXPANDED: 'Gs1DataBarExpanded',
    GS1_DATABAR_TRUNCATED: 'Gs1DataBarTruncated',
    GS1_DATABAR_LIMITED: 'Gs1DataBarLimited',
  }
  return mapping[type] || type
}

function hriPositionToSdk(position?: string): string {
  switch (position) {
    case 'none': return 'None'
    case 'above': return 'Above'
    case 'below': return 'Below'
    case 'both': return 'Below'
    default: return 'Below'
  }
}

function imageModeToSdk(mode?: string): string {
  switch (mode) {
    case 'mono': return 'Mono'
    case 'gray': return 'Gray'
    default: return 'Mono'
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyTextCommand(printer: any, cmd: TextCommand): void {
  const alignment = alignmentToSdk(cmd.alignment)
  const attribute = attributeToNumber(cmd.attribute)
  const textSize = textSizeToNumber(cmd.textSize)
  printer.PrintText(cmd.data, alignment, attribute, textSize)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyPaddingTextCommand(printer: any, cmd: PaddingTextCommand): void {
  const attribute = attributeToNumber(cmd.attribute)
  const textSize = textSizeToNumber(cmd.textSize)
  printer.PrintPaddingText(cmd.data, attribute, textSize, cmd.length ?? 0, cmd.side ?? 'Right')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyImageCommand(printer: any, cmd: ImageCommand): void {
  const width = cmd.width === 'asis' ? 'Asis' : (cmd.width ?? null)
  const alignment = typeof cmd.alignment === 'number'
    ? cmd.alignment
    : alignmentToSdk(cmd.alignment as string)
  const mode = imageModeToSdk(cmd.mode)
  printer.PrintMemoryBitmap(cmd.data, width, alignment, mode)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyQRCodeCommand(printer: any, cmd: QRCodeCommand): void {
  const alignment = alignmentToSdk(cmd.alignment)
  const ecLevel = ecLevelToSdk(cmd.ecLevel)
  printer.PrintQRCode(cmd.data, cmd.moduleSize ?? 4, ecLevel, alignment)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyBarcodeCommand(printer: any, cmd: BarcodeCommand): void {
  const alignment = alignmentToSdk(cmd.alignment)
  const symbology = barcodeTypeToSdk(cmd.barcodeType)
  const textPosition = hriPositionToSdk(cmd.hriPosition)
  printer.PrintBarCode(
    cmd.data,
    symbology,
    cmd.height ?? 50,
    cmd.width ?? 2,
    alignment,
    textPosition
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyPDF417Command(printer: any, cmd: PDF417Command): void {
  const alignment = alignmentToSdk(cmd.alignment)
  printer.PrintPDF417(
    cmd.data,
    cmd.digits ?? 1,
    cmd.steps ?? 3,
    cmd.moduleWidth ?? 3,
    cmd.stepHeight ?? 3,
    cmd.ecLevel ?? 'Level2',
    alignment
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyGS1DataBarStackedCommand(printer: any, cmd: GS1DataBarStackedCommand): void {
  const alignment = alignmentToSdk(cmd.alignment)
  printer.PrintGS1DataBarStacked(
    cmd.data,
    cmd.symbology ?? 'Stacked',
    cmd.moduleSize ?? 4,
    cmd.maxSize ?? 300,
    alignment
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyCutCommand(printer: any, cmd: CutCommand): void {
  printer.CutPaper(cutPercentageToSdk(cmd.percentage))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyFeedCommand(printer: any, cmd: FeedCommand): void {
  printer.UnitFeed(cmd.units)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyMarkFeedCommand(printer: any, cmd: MarkFeedCommand): void {
  printer.MarkFeed(cmd.feedType ?? 'Cutter')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyPageModePrintCommand(printer: any, cmd: PageModePrintCommand): void {
  printer.PageModePrint(cmd.control ?? 'PageMode')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applySetPageModePrintAreaCommand(printer: any, cmd: SetPageModePrintAreaCommand): void {
  const area = `${cmd.x ?? 0},${cmd.y ?? 0},${cmd.width ?? 300},${cmd.height ?? 300}`
  printer.SetPageModePrintArea(area)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applySetPageModePrintDirectionCommand(printer: any, cmd: SetPageModePrintDirectionCommand): void {
  printer.SetPageModePrintDirection(cmd.direction ?? 'LeftToRight')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applySetPageModeHPosCommand(printer: any, cmd: SetPageModeHPosCommand): void {
  printer.SetPageModeHorizontalPosition(cmd.position ?? 0)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applySetPageModeVPosCommand(printer: any, cmd: SetPageModeVPosCommand): void {
  printer.SetPageModeVerticalPosition(cmd.position ?? 0)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyClearPrintAreaCommand(printer: any): void {
  printer.ClearPrintArea()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applySetEncodingCommand(printer: any, cmd: SetEncodingCommand): void {
  printer.SetEncoding(cmd.encoding)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applySetCodePageCommand(printer: any, cmd: SetCodePageCommand): void {
  printer.SetCodePage(cmd.codePage)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applySetCharactersetCommand(printer: any, cmd: SetCharactersetCommand): void {
  printer.SetInternationalCharacterset(cmd.characterset)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applySetLineSpacingCommand(printer: any, cmd: SetLineSpacingCommand): void {
  printer.SetRecLineSpacing(cmd.spacing)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applySetMapModeCommand(printer: any, cmd: SetMapModeCommand): void {
  const mapping: Record<string, string> = {
    Dots: 'MM_DOTS',
    Twips: 'MM_TWIPS',
    English: 'MM_ENGLISH',
    Metric: 'MM_METRIC',
  }
  const key = mapping[cmd.mapMode] || 'MM_DOTS'
  printer.SetMapMode(printer[key])
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyOpenDrawerCommand(printer: any, cmd: OpenDrawerCommand): void {
  printer.OpenDrawer(cmd.drawer ?? 'Drawer1', cmd.pulseLength ?? 1)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyMessageIdCommand(printer: any, cmd: MessageIdCommand): void {
  printer.MessageID(cmd.messageId)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyRotatePrintCommand(printer: any, cmd: RotatePrintCommand): void {
  let value = cmd.rotation === 'Normal' ? printer.RP_NORMAL : printer.RP_ROTATE180
  if (cmd.barcode ?? true) value |= 0x1000
  if (cmd.bitmap ?? true) value |= 0x2000
  printer.RotatePrint(value)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyClearOutputCommand(printer: any): void {
  printer.ClearOutput()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyCommand(printer: any, cmd: PrintCommand): void {
  switch (cmd.type) {
    case 'text':
      applyTextCommand(printer, cmd)
      break
    case 'paddingText':
      applyPaddingTextCommand(printer, cmd)
      break
    case 'image':
      applyImageCommand(printer, cmd)
      break
    case 'qrcode':
      applyQRCodeCommand(printer, cmd)
      break
    case 'barcode':
      applyBarcodeCommand(printer, cmd)
      break
    case 'pdf417':
      applyPDF417Command(printer, cmd)
      break
    case 'gs1DataBarStacked':
      applyGS1DataBarStackedCommand(printer, cmd)
      break
    case 'cut':
      applyCutCommand(printer, cmd)
      break
    case 'feed':
      applyFeedCommand(printer, cmd)
      break
    case 'markFeed':
      applyMarkFeedCommand(printer, cmd)
      break
    case 'pageModePrint':
      applyPageModePrintCommand(printer, cmd)
      break
    case 'setPageModePrintArea':
      applySetPageModePrintAreaCommand(printer, cmd)
      break
    case 'setPageModePrintDirection':
      applySetPageModePrintDirectionCommand(printer, cmd)
      break
    case 'setPageModeHPos':
      applySetPageModeHPosCommand(printer, cmd)
      break
    case 'setPageModeVPos':
      applySetPageModeVPosCommand(printer, cmd)
      break
    case 'clearPrintArea':
      applyClearPrintAreaCommand(printer)
      break
    case 'setEncoding':
      applySetEncodingCommand(printer, cmd)
      break
    case 'setCodePage':
      applySetCodePageCommand(printer, cmd)
      break
    case 'setCharacterset':
      applySetCharactersetCommand(printer, cmd)
      break
    case 'setLineSpacing':
      applySetLineSpacingCommand(printer, cmd)
      break
    case 'setMapMode':
      applySetMapModeCommand(printer, cmd)
      break
    case 'openDrawer':
      applyOpenDrawerCommand(printer, cmd)
      break
    case 'messageId':
      applyMessageIdCommand(printer, cmd)
      break
    case 'rotatePrint':
      applyRotatePrintCommand(printer, cmd)
      break
    case 'clearOutput':
      applyClearOutputCommand(printer)
      break
    case 'raw':
      printer.message += cmd.xml
      break
  }
}

/**
 * コマンド配列からSOAP XMLを生成
 * SDK の ToString() を使用して完全なXMLを返す
 */
export function commandsToXml(commands: PrintCommand[]): string {
  const printer = createPrinter()

  for (const cmd of commands) {
    applyCommand(printer, cmd)
  }

  return printer.ToString()
}
