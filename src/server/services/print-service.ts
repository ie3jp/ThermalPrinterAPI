/**
 * 印刷サービス
 * 画像処理 → SDK変換 → プリンタ送信 のフロー全体を統括
 */

import { commandsToXml } from './sdk-adapter.js'
import { processImage } from './image.js'
import { sendXml, queryStatus, getPrinterUrl } from './printer-client.js'
import type {
  PrintRequest,
  PrintResponse,
  PrintCommand,
  ImageCommand,
} from '../types/commands.js'

/**
 * 印刷キュー: リクエストを受け付けた順に1件ずつ処理する
 */
let printQueue: Promise<void> = Promise.resolve()

function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    printQueue = printQueue.then(() => fn().then(resolve, reject))
  })
}

/**
 * 画像コマンドをBMP Base64に変換
 */
async function processImageCommand(cmd: ImageCommand): Promise<ImageCommand> {
  // 既にBMP Base64の場合はそのまま返す（BMPマジックナンバーのBase64）
  if (cmd.data.startsWith('Qk')) {
    return cmd
  }

  const processed = await processImage(cmd.data, {
    mode: cmd.mode,
    width: cmd.width,
  })

  return {
    ...cmd,
    data: processed.base64,
    width: processed.width,
  }
}

/**
 * コマンド配列内の画像を全て変換
 */
async function processCommands(commands: PrintCommand[]): Promise<PrintCommand[]> {
  const result: PrintCommand[] = []

  for (const cmd of commands) {
    if (cmd.type === 'image') {
      result.push(await processImageCommand(cmd))
    } else {
      result.push(cmd)
    }
  }

  return result
}

/**
 * 印刷実行: キューに入れて順番に処理
 */
export function sendToPrinter(request: PrintRequest): Promise<PrintResponse> {
  return enqueue(() => executePrint(request))
}

/**
 * 実際の印刷処理: 画像処理 → XML生成 → プリンタ送信
 */
async function executePrint(request: PrintRequest): Promise<PrintResponse> {
  const printerUrl = getPrinterUrl(request.printerUrl)

  try {
    const commands = await processCommands(request.commands)
    const xml = commandsToXml(commands)
    const result = await sendXml(printerUrl, xml)

    if (!result.success) {
      return {
        success: false,
        message: result.error || 'Print failed',
        xml,
        response: result.responseText,
      }
    }

    return {
      success: true,
      message: 'Print job sent successfully',
      messageId: crypto.randomUUID(),
      xml,
      response: result.responseText,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)

    return {
      success: false,
      message: errorMessage.includes('image')
        ? 'Image processing failed'
        : 'Failed to process print request',
      error: errorMessage,
    }
  }
}

/**
 * XMLエクスポート: 画像処理 → XML生成（送信なし）
 */
export async function exportXml(request: PrintRequest): Promise<string> {
  const commands = await processCommands(request.commands)
  return commandsToXml(commands)
}

/**
 * プリンタステータス取得
 */
export async function getStatus(printerUrl?: string) {
  const url = getPrinterUrl(printerUrl)
  return queryStatus(url)
}
