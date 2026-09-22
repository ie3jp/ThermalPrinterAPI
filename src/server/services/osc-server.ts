/**
 * OSC (Open Sound Control) サーバー
 *
 * 全印刷コマンドをOSCメッセージで受け付け、HTTP APIと同等の印刷を実行
 *
 * OSCアドレスパターン:
 *   /print/text      [data, alignment?, attribute?, widthMult?, heightMult?]
 *   /print/image     [base64data, width?, alignment?, mode?]
 *   /print/qrcode    [data, moduleSize?, ecLevel?, alignment?]
 *   /print/barcode   [data, barcodeType, height?, width?, alignment?, hriPosition?]
 *   /print/cut       [percentage?]
 *   /print/feed      [units]
 *   /print/raw       [xmlString]
 *   /print/json      [jsonString]  -- 完全なコマンド配列をJSONで送信
 *   /print/file      [filepath]    -- JSONファイルパスを受け取り読み込んで実行
 */

import { Server } from 'node-osc'
import { readFileSync, existsSync } from 'fs'
import { sendToPrinter } from './print-service.js'
import type {
  PrintCommand,
  PrintRequest,
  Alignment,
  CutPercentage,
  QRCodeECLevel,
  ImageMode,
  BarcodeType,
  BarcodeHRIPosition
} from '../types/commands.js'
import { config } from '../config.js'

type OSCServer = InstanceType<typeof Server>

let oscServer: OSCServer | null = null

/**
 * OSCメッセージから印刷コマンドを生成して実行
 */
async function handleOscMessage(address: string, args: (string | number | boolean)[]): Promise<void> {
  console.log(`[OSC] Received: ${address}`, args)

  let commands: PrintCommand[] = []

  try {
    // アドレスパターン解析
    const parts = address.split('/')
    if (parts[1] !== 'print') {
      console.log(`[OSC] Unknown address prefix: ${address}`)
      return
    }

    const commandType = parts[2]

    switch (commandType) {
      case 'text': {
        // /print/text [data, alignment?, attributeBits?, widthMult?, heightMult?]
        const data = String(args[0] ?? '')
        const alignment = (args[1] as Alignment) || undefined
        const attributeBits = typeof args[2] === 'number' ? args[2] : 0
        const widthMult = typeof args[3] === 'number' ? args[3] : undefined
        const heightMult = typeof args[4] === 'number' ? args[4] : undefined

        commands.push({
          type: 'text',
          data,
          alignment,
          attribute: attributeBits ? {
            fontB: !!(attributeBits & 0x01),
            fontC: !!(attributeBits & 0x02),
            bold: !!(attributeBits & 0x08),
            reverse: !!(attributeBits & 0x40),
            underline: !!(attributeBits & 0x80),
          } : undefined,
          textSize: (widthMult || heightMult) ? {
            width: widthMult as 1|2|3|4|5|6|7|8,
            height: heightMult as 1|2|3|4|5|6|7|8,
          } : undefined,
        })
        break
      }

      case 'image': {
        // /print/image [base64data, width?, alignment?, mode?]
        const data = String(args[0] ?? '')
        const width = typeof args[1] === 'number' ? args[1] : (args[1] === 'asis' ? 'asis' : undefined)
        const alignment = (args[2] as Alignment) || undefined
        const mode = (args[3] as ImageMode) || undefined

        commands.push({
          type: 'image',
          data,
          width,
          alignment,
          mode,
        })
        break
      }

      case 'qrcode': {
        // /print/qrcode [data, moduleSize?, ecLevel?, alignment?]
        const data = String(args[0] ?? '')
        const moduleSize = typeof args[1] === 'number' ? args[1] : undefined
        const ecLevel = (args[2] as QRCodeECLevel) || undefined
        const alignment = (args[3] as Alignment) || undefined

        commands.push({
          type: 'qrcode',
          data,
          moduleSize,
          ecLevel,
          alignment,
        })
        break
      }

      case 'barcode': {
        // /print/barcode [data, barcodeType, height?, width?, alignment?, hriPosition?]
        const data = String(args[0] ?? '')
        const barcodeType = String(args[1] ?? 'CODE128') as BarcodeType
        const height = typeof args[2] === 'number' ? args[2] : undefined
        const width = typeof args[3] === 'number' ? args[3] : undefined
        const alignment = (args[4] as Alignment) || undefined
        const hriPosition = (args[5] as BarcodeHRIPosition) || undefined

        commands.push({
          type: 'barcode',
          data,
          barcodeType,
          height,
          width,
          alignment,
          hriPosition,
        })
        break
      }

      case 'cut': {
        // /print/cut [percentage?]
        const percentage = (args[0] as CutPercentage) || undefined

        commands.push({
          type: 'cut',
          percentage,
        })
        break
      }

      case 'feed': {
        // /print/feed [units]
        const units = typeof args[0] === 'number' ? args[0] : 1

        commands.push({
          type: 'feed',
          units,
        })
        break
      }

      case 'raw': {
        // /print/raw [xmlString]
        const xml = String(args[0] ?? '')

        commands.push({
          type: 'raw',
          xml,
        })
        break
      }

      case 'json': {
        // /print/json [jsonString] -- 完全なコマンド配列をJSONで送信
        const jsonStr = String(args[0] ?? '[]')
        try {
          const parsed = JSON.parse(jsonStr)
          if (Array.isArray(parsed)) {
            commands = parsed as PrintCommand[]
          } else if (parsed.commands && Array.isArray(parsed.commands)) {
            commands = parsed.commands as PrintCommand[]
          }
        } catch (e) {
          console.error('[OSC] JSON parse error:', e)
          return
        }
        break
      }

      case 'file': {
        // /print/file [filepath] -- JSONファイルパスを受け取り読み込んで実行
        const filepath = String(args[0] ?? '')
        if (!filepath) {
          console.error('[OSC] /print/file: No filepath provided')
          return
        }

        // ファイル存在チェック
        if (!existsSync(filepath)) {
          console.error(`[OSC] /print/file: File not found: ${filepath}`)
          return
        }

        try {
          console.log(`[OSC] /print/file: Reading ${filepath}`)
          const fileContent = readFileSync(filepath, 'utf-8')
          const parsed = JSON.parse(fileContent)

          if (Array.isArray(parsed)) {
            commands = parsed as PrintCommand[]
          } else if (parsed.commands && Array.isArray(parsed.commands)) {
            commands = parsed.commands as PrintCommand[]
          } else {
            console.error('[OSC] /print/file: Invalid JSON structure (expected array or {commands: [...]})')
            return
          }

          console.log(`[OSC] /print/file: Loaded ${commands.length} commands from file`)
        } catch (e) {
          console.error('[OSC] /print/file: Error reading/parsing file:', e)
          return
        }
        break
      }

      case 'drawer': {
        // /print/drawer [drawer?, pulseLength?]
        const drawer = (args[0] as 'Drawer1' | 'Drawer2') || undefined
        const pulseLength = typeof args[1] === 'number' ? args[1] : undefined

        commands.push({
          type: 'openDrawer',
          drawer,
          pulseLength,
        })
        break
      }

      default:
        console.log(`[OSC] Unknown command type: ${commandType}`)
        return
    }

    if (commands.length === 0) {
      console.log('[OSC] No commands to execute')
      return
    }

    // 印刷実行
    const request: PrintRequest = { commands }
    const result = await sendToPrinter(request)

    if (result.success) {
      console.log(`[OSC] Print success: ${result.message}`)
    } else {
      console.error(`[OSC] Print failed: ${result.message}`, result.error)
    }
  } catch (error) {
    console.error('[OSC] Error handling message:', error)
  }
}

/**
 * OSCサーバーを起動
 */
export function startOscServer(): OSCServer {
  if (oscServer) {
    console.log('[OSC] Server already running')
    return oscServer
  }

  const port = config.oscPort

  oscServer = new Server(port, '0.0.0.0')

  oscServer.on('listening', () => {
    console.log(`[OSC] Server listening on port ${port}`)
  })

  oscServer.on('message', (msg: [string, ...unknown[]]) => {
    const [address, ...args] = msg
    handleOscMessage(address, args as (string | number | boolean)[])
  })

  oscServer.on('error', (err: Error) => {
    console.error('[OSC] Server error:', err)
  })

  return oscServer
}

/**
 * OSCサーバーを停止
 */
export function stopOscServer(): void {
  if (oscServer) {
    oscServer.close()
    oscServer = null
    console.log('[OSC] Server stopped')
  }
}

/**
 * OSCサーバーの状態を取得
 */
export function isOscServerRunning(): boolean {
  return oscServer !== null
}
