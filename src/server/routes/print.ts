import { Hono } from 'hono'
import { sendToPrinter, exportXml } from '../services/print-service.js'
import { ImageValidationError } from '../services/image.js'
import type { PrintCommand, PrintRequest, PrintResponse, ExportXmlResponse } from '../types/commands.js'

export const printRoutes = new Hono()

// バリデーション用定数
const VALID_ALIGNMENTS = ['left', 'center', 'right']
const VALID_CUT_PERCENTAGES = ['full', 'partial', 'fullPrefeed', 'partialPrefeed']
const VALID_QR_EC_LEVELS = ['L', 'M', 'Q', 'H']
const VALID_IMAGE_MODES = ['mono', 'gray']
const VALID_BARCODE_TYPES = ['UPC_A', 'UPC_E', 'EAN13', 'EAN8', 'CODE39', 'ITF', 'CODABAR', 'CODE93', 'CODE128', 'GS1_DATABAR', 'GS1_DATABAR_EXPANDED', 'GS1_DATABAR_TRUNCATED', 'GS1_DATABAR_LIMITED']
const VALID_HRI_POSITIONS = ['none', 'above', 'below', 'both']
const VALID_PDF417_EC_LEVELS = ['Level0', 'Level1', 'Level2', 'Level3', 'Level4', 'Level5', 'Level6', 'Level7', 'Level8']
const VALID_GS1_TYPES = ['Stacked', 'ExpandedStacked', 'StackedOmnidirectional']
const VALID_MARK_FEED_TYPES = ['Cutter', 'NextTof']
const VALID_PAGE_MODE_CONTROLS = ['PageMode', 'Normal', 'Cancel']
const VALID_PAGE_MODE_DIRECTIONS = ['LeftToRight', 'BottomToTop', 'RightToLeft', 'TopToBottom']
const VALID_ENCODING_TYPES = ['UTF-8', 'Japanese', 'SimplifiedChinese', 'Korean', 'TraditionalChinese', 'SingleByteCharacter', 'None']
const VALID_MAP_MODES = ['Dots', 'Twips', 'English', 'Metric']
const VALID_ROTATION_TYPES = ['Normal', 'Rotate180']
const VALID_PADDING_SIDES = ['Right', 'Left']
const VALID_DRAWER_TYPES = ['Drawer1', 'Drawer2']

function isPositiveInt(v: unknown): boolean {
  return typeof v === 'number' && Number.isInteger(v) && v > 0
}

function isNonNegativeInt(v: unknown): boolean {
  return typeof v === 'number' && Number.isInteger(v) && v >= 0
}

/**
 * コマンドの必須フィールドと数値範囲・enum値をバリデーション
 * エラーがある場合はメッセージを返す、なければnull
 */
function validateCommandFields(cmd: PrintCommand): string | null {
  switch (cmd.type) {
    case 'text':
      if (!cmd.data && cmd.data !== '') return 'text command requires "data" field'
      if (cmd.alignment != null && !VALID_ALIGNMENTS.includes(cmd.alignment)) return `text: invalid alignment "${cmd.alignment}" (valid: ${VALID_ALIGNMENTS.join(', ')})`
      if (cmd.textSize) {
        if (cmd.textSize.width != null && (typeof cmd.textSize.width !== 'number' || cmd.textSize.width < 1 || cmd.textSize.width > 8)) return 'text: textSize.width must be 1-8'
        if (cmd.textSize.height != null && (typeof cmd.textSize.height !== 'number' || cmd.textSize.height < 1 || cmd.textSize.height > 8)) return 'text: textSize.height must be 1-8'
      }
      break
    case 'paddingText':
      if (!cmd.data && cmd.data !== '') return 'paddingText command requires "data" field'
      if (cmd.textSize) {
        if (cmd.textSize.width != null && (typeof cmd.textSize.width !== 'number' || cmd.textSize.width < 1 || cmd.textSize.width > 8)) return 'paddingText: textSize.width must be 1-8'
        if (cmd.textSize.height != null && (typeof cmd.textSize.height !== 'number' || cmd.textSize.height < 1 || cmd.textSize.height > 8)) return 'paddingText: textSize.height must be 1-8'
      }
      if (cmd.length != null && !isNonNegativeInt(cmd.length)) return 'paddingText: length must be a non-negative integer'
      if (cmd.side != null && !VALID_PADDING_SIDES.includes(cmd.side)) return `paddingText: invalid side "${cmd.side}" (valid: ${VALID_PADDING_SIDES.join(', ')})`
      break
    case 'image':
      if (!cmd.data) return 'image command requires "data" field'
      if (cmd.width != null && cmd.width !== 'asis' && (!isPositiveInt(cmd.width) || (cmd.width as number) > 576)) return 'image: width must be a positive integer (max 576) or "asis"'
      if (cmd.alignment != null && typeof cmd.alignment === 'string' && !VALID_ALIGNMENTS.includes(cmd.alignment)) return `image: invalid alignment "${cmd.alignment}" (valid: ${VALID_ALIGNMENTS.join(', ')})`
      if (cmd.alignment != null && typeof cmd.alignment === 'number' && !isNonNegativeInt(cmd.alignment)) return 'image: numeric alignment must be a non-negative integer'
      if (cmd.mode != null && !VALID_IMAGE_MODES.includes(cmd.mode)) return `image: invalid mode "${cmd.mode}" (valid: ${VALID_IMAGE_MODES.join(', ')})`
      break
    case 'qrcode':
      if (!cmd.data) return 'qrcode command requires "data" field'
      if (cmd.moduleSize != null && (typeof cmd.moduleSize !== 'number' || cmd.moduleSize < 1 || cmd.moduleSize > 16)) return 'qrcode: moduleSize must be 1-16'
      if (cmd.ecLevel != null && !VALID_QR_EC_LEVELS.includes(cmd.ecLevel)) return `qrcode: invalid ecLevel "${cmd.ecLevel}" (valid: ${VALID_QR_EC_LEVELS.join(', ')})`
      if (cmd.alignment != null && !VALID_ALIGNMENTS.includes(cmd.alignment)) return `qrcode: invalid alignment "${cmd.alignment}" (valid: ${VALID_ALIGNMENTS.join(', ')})`
      break
    case 'barcode':
      if (!cmd.data) return 'barcode command requires "data" field'
      if (!cmd.barcodeType) return 'barcode command requires "barcodeType" field'
      if (!VALID_BARCODE_TYPES.includes(cmd.barcodeType)) return `barcode: invalid barcodeType "${cmd.barcodeType}" (valid: ${VALID_BARCODE_TYPES.join(', ')})`
      if (cmd.height != null && (typeof cmd.height !== 'number' || cmd.height < 1 || cmd.height > 255)) return 'barcode: height must be 1-255'
      if (cmd.width != null && (typeof cmd.width !== 'number' || cmd.width < 1 || cmd.width > 6)) return 'barcode: width must be 1-6'
      if (cmd.alignment != null && !VALID_ALIGNMENTS.includes(cmd.alignment)) return `barcode: invalid alignment "${cmd.alignment}" (valid: ${VALID_ALIGNMENTS.join(', ')})`
      if (cmd.hriPosition != null && !VALID_HRI_POSITIONS.includes(cmd.hriPosition)) return `barcode: invalid hriPosition "${cmd.hriPosition}" (valid: ${VALID_HRI_POSITIONS.join(', ')})`
      break
    case 'pdf417':
      if (!cmd.data) return 'pdf417 command requires "data" field'
      if (cmd.digits != null && (typeof cmd.digits !== 'number' || cmd.digits < 1 || cmd.digits > 30)) return 'pdf417: digits must be 1-30'
      if (cmd.steps != null && (typeof cmd.steps !== 'number' || cmd.steps < 3 || cmd.steps > 90)) return 'pdf417: steps must be 3-90'
      if (cmd.moduleWidth != null && (typeof cmd.moduleWidth !== 'number' || cmd.moduleWidth < 1 || cmd.moduleWidth > 8)) return 'pdf417: moduleWidth must be 1-8'
      if (cmd.stepHeight != null && (typeof cmd.stepHeight !== 'number' || cmd.stepHeight < 2 || cmd.stepHeight > 8)) return 'pdf417: stepHeight must be 2-8'
      if (cmd.ecLevel != null && !VALID_PDF417_EC_LEVELS.includes(cmd.ecLevel)) return `pdf417: invalid ecLevel "${cmd.ecLevel}" (valid: ${VALID_PDF417_EC_LEVELS.join(', ')})`
      if (cmd.alignment != null && !VALID_ALIGNMENTS.includes(cmd.alignment)) return `pdf417: invalid alignment "${cmd.alignment}" (valid: ${VALID_ALIGNMENTS.join(', ')})`
      break
    case 'gs1DataBarStacked':
      if (!cmd.data) return 'gs1DataBarStacked command requires "data" field'
      if (cmd.symbology != null && !VALID_GS1_TYPES.includes(cmd.symbology)) return `gs1DataBarStacked: invalid symbology "${cmd.symbology}" (valid: ${VALID_GS1_TYPES.join(', ')})`
      if (cmd.moduleSize != null && (typeof cmd.moduleSize !== 'number' || cmd.moduleSize < 2 || cmd.moduleSize > 8)) return 'gs1DataBarStacked: moduleSize must be 2-8'
      if (cmd.maxSize != null && !isPositiveInt(cmd.maxSize)) return 'gs1DataBarStacked: maxSize must be a positive integer'
      if (cmd.alignment != null && !VALID_ALIGNMENTS.includes(cmd.alignment)) return `gs1DataBarStacked: invalid alignment "${cmd.alignment}" (valid: ${VALID_ALIGNMENTS.join(', ')})`
      break
    case 'cut':
      if (cmd.percentage != null && !VALID_CUT_PERCENTAGES.includes(cmd.percentage)) return `cut: invalid percentage "${cmd.percentage}" (valid: ${VALID_CUT_PERCENTAGES.join(', ')})`
      break
    case 'feed':
      if (cmd.units == null || typeof cmd.units !== 'number') return 'feed command requires numeric "units" field'
      if (!isPositiveInt(cmd.units)) return 'feed: units must be a positive integer'
      break
    case 'markFeed':
      if (cmd.feedType != null && !VALID_MARK_FEED_TYPES.includes(cmd.feedType)) return `markFeed: invalid feedType "${cmd.feedType}" (valid: ${VALID_MARK_FEED_TYPES.join(', ')})`
      break
    case 'pageModePrint':
      if (cmd.control != null && !VALID_PAGE_MODE_CONTROLS.includes(cmd.control)) return `pageModePrint: invalid control "${cmd.control}" (valid: ${VALID_PAGE_MODE_CONTROLS.join(', ')})`
      break
    case 'setPageModePrintArea':
      if (cmd.x != null && !isNonNegativeInt(cmd.x)) return 'setPageModePrintArea: x must be a non-negative integer'
      if (cmd.y != null && !isNonNegativeInt(cmd.y)) return 'setPageModePrintArea: y must be a non-negative integer'
      if (cmd.width != null && !isPositiveInt(cmd.width)) return 'setPageModePrintArea: width must be a positive integer'
      if (cmd.height != null && !isPositiveInt(cmd.height)) return 'setPageModePrintArea: height must be a positive integer'
      break
    case 'setPageModePrintDirection':
      if (cmd.direction != null && !VALID_PAGE_MODE_DIRECTIONS.includes(cmd.direction)) return `setPageModePrintDirection: invalid direction "${cmd.direction}" (valid: ${VALID_PAGE_MODE_DIRECTIONS.join(', ')})`
      break
    case 'setPageModeHPos':
      if (cmd.position != null && !isNonNegativeInt(cmd.position)) return 'setPageModeHPos: position must be a non-negative integer'
      break
    case 'setPageModeVPos':
      if (cmd.position != null && !isNonNegativeInt(cmd.position)) return 'setPageModeVPos: position must be a non-negative integer'
      break
    case 'setEncoding':
      if (!cmd.encoding) return 'setEncoding command requires "encoding" field'
      if (!VALID_ENCODING_TYPES.includes(cmd.encoding as string)) return `setEncoding: invalid encoding "${cmd.encoding}" (valid: ${VALID_ENCODING_TYPES.join(', ')})`
      break
    case 'setCodePage':
      if (cmd.codePage == null) return 'setCodePage command requires "codePage" field'
      if (!isNonNegativeInt(cmd.codePage)) return 'setCodePage: codePage must be a non-negative integer'
      break
    case 'setCharacterset':
      if (cmd.characterset == null) return 'setCharacterset command requires "characterset" field'
      if (!isNonNegativeInt(cmd.characterset)) return 'setCharacterset: characterset must be a non-negative integer'
      break
    case 'setLineSpacing':
      if (cmd.spacing == null) return 'setLineSpacing command requires "spacing" field'
      if (!isNonNegativeInt(cmd.spacing)) return 'setLineSpacing: spacing must be a non-negative integer'
      break
    case 'setMapMode':
      if (!cmd.mapMode) return 'setMapMode command requires "mapMode" field'
      if (!VALID_MAP_MODES.includes(cmd.mapMode)) return `setMapMode: invalid mapMode "${cmd.mapMode}" (valid: ${VALID_MAP_MODES.join(', ')})`
      break
    case 'openDrawer':
      if (cmd.drawer != null && !VALID_DRAWER_TYPES.includes(cmd.drawer)) return `openDrawer: invalid drawer "${cmd.drawer}" (valid: ${VALID_DRAWER_TYPES.join(', ')})`
      if (cmd.pulseLength != null && !isPositiveInt(cmd.pulseLength)) return 'openDrawer: pulseLength must be a positive integer'
      break
    case 'messageId':
      if (!cmd.messageId) return 'messageId command requires "messageId" field'
      break
    case 'rotatePrint':
      if (cmd.rotation != null && !VALID_ROTATION_TYPES.includes(cmd.rotation)) return `rotatePrint: invalid rotation "${cmd.rotation}" (valid: ${VALID_ROTATION_TYPES.join(', ')})`
      break
    case 'raw':
      if (!cmd.xml) return 'raw command requires "xml" field'
      break
  }
  return null
}

/**
 * POST /api/print - 印刷実行
 *
 * リクエスト:
 * {
 *   "printerUrl": "http://192.168.10.100:8080/", // optional
 *   "commands": [
 *     { "type": "text", "data": "Hello World", ... },
 *     { "type": "image", "data": "base64...", ... },
 *     { "type": "qrcode", "data": "https://...", ... },
 *     { "type": "cut", "percentage": "partial" }
 *   ]
 * }
 *
 * レスポンス:
 * {
 *   "success": true,
 *   "message": "Print job sent successfully",
 *   "messageId": "uuid",
 *   "xml": "...", // 送信したXML
 *   "response": "..." // プリンタからのレスポンス
 * }
 */
printRoutes.post('/print', async (c) => {
  try {
    const body = await c.req.json<PrintRequest>()

    // バリデーション
    if (!body.commands || !Array.isArray(body.commands)) {
      return c.json<PrintResponse>(
        {
          success: false,
          message: 'Invalid request: commands array is required',
        },
        400
      )
    }

    if (body.commands.length === 0) {
      return c.json<PrintResponse>(
        {
          success: false,
          message: 'Invalid request: commands array is empty',
        },
        400
      )
    }

    // 各コマンドの基本バリデーション
    for (const cmd of body.commands) {
      if (!cmd.type) {
        return c.json<PrintResponse>(
          {
            success: false,
            message: 'Invalid command: type is required',
          },
          400
        )
      }

      const validTypes = ['text', 'paddingText', 'image', 'qrcode', 'barcode', 'pdf417', 'gs1DataBarStacked', 'cut', 'feed', 'markFeed', 'pageModePrint', 'setPageModePrintArea', 'setPageModePrintDirection', 'setPageModeHPos', 'setPageModeVPos', 'clearPrintArea', 'setEncoding', 'setCodePage', 'setCharacterset', 'setLineSpacing', 'setMapMode', 'openDrawer', 'messageId', 'rotatePrint', 'clearOutput', 'raw']
      if (!validTypes.includes(cmd.type)) {
        return c.json<PrintResponse>(
          {
            success: false,
            message: `Invalid command type: ${cmd.type}`,
          },
          400
        )
      }

      const fieldError = validateCommandFields(cmd)
      if (fieldError) {
        return c.json<PrintResponse>(
          {
            success: false,
            message: `Invalid command: ${fieldError}`,
          },
          400
        )
      }
    }

    // 印刷実行
    const result = await sendToPrinter(body)

    const statusCode = result.success ? 200 : 500
    return c.json<PrintResponse>(result, statusCode)
  } catch (error) {
    console.error('Print error:', error)

    if (error instanceof ImageValidationError) {
      return c.json<PrintResponse>(
        {
          success: false,
          message: error.message,
        },
        400
      )
    }

    return c.json<PrintResponse>(
      {
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : String(error),
      },
      500
    )
  }
})

/**
 * POST /api/export/xml - XMLエクスポート（デバッグ用）
 *
 * プリンタに送信せず、生成されるXMLのみを返す
 *
 * リクエスト: /api/print と同じ
 *
 * レスポンス:
 * {
 *   "success": true,
 *   "xml": "<?xml version=\"1.0\"...>"
 * }
 */
printRoutes.post('/export/xml', async (c) => {
  try {
    const body = await c.req.json<PrintRequest>()

    // バリデーション
    if (!body.commands || !Array.isArray(body.commands)) {
      return c.json<ExportXmlResponse>(
        {
          success: false,
          xml: '',
          error: 'Invalid request: commands array is required',
        },
        400
      )
    }

    if (body.commands.length === 0) {
      return c.json<ExportXmlResponse>(
        {
          success: false,
          xml: '',
          error: 'Invalid request: commands array is empty',
        },
        400
      )
    }

    // 各コマンドのバリデーション
    for (const cmd of body.commands) {
      if (!cmd.type) {
        return c.json<ExportXmlResponse>(
          {
            success: false,
            xml: '',
            error: 'Invalid command: type is required',
          },
          400
        )
      }

      const validTypes = ['text', 'paddingText', 'image', 'qrcode', 'barcode', 'pdf417', 'gs1DataBarStacked', 'cut', 'feed', 'markFeed', 'pageModePrint', 'setPageModePrintArea', 'setPageModePrintDirection', 'setPageModeHPos', 'setPageModeVPos', 'clearPrintArea', 'setEncoding', 'setCodePage', 'setCharacterset', 'setLineSpacing', 'setMapMode', 'openDrawer', 'messageId', 'rotatePrint', 'clearOutput', 'raw']
      if (!validTypes.includes(cmd.type)) {
        return c.json<ExportXmlResponse>(
          {
            success: false,
            xml: '',
            error: `Invalid command type: ${cmd.type}`,
          },
          400
        )
      }

      const fieldError = validateCommandFields(cmd)
      if (fieldError) {
        return c.json<ExportXmlResponse>(
          {
            success: false,
            xml: '',
            error: `Invalid command: ${fieldError}`,
          },
          400
        )
      }
    }

    // XML生成（送信なし）
    const xml = await exportXml(body)

    return c.json<ExportXmlResponse>({
      success: true,
      xml,
    })
  } catch (error) {
    console.error('Export XML error:', error)

    if (error instanceof ImageValidationError) {
      return c.json<ExportXmlResponse>(
        {
          success: false,
          xml: '',
          error: error.message,
        },
        400
      )
    }

    return c.json<ExportXmlResponse>(
      {
        success: false,
        xml: '',
        error: error instanceof Error ? error.message : String(error),
      },
      500
    )
  }
})
