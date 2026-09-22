/**
 * プリンタ通信クライアント
 * プリンタへのHTTP送信とステータス取得を担当
 */

import { config } from '../config.js'

const REQUEST_TIMEOUT_MS = 10000 // 10秒
const STATUS_TIMEOUT_MS = 5000

/**
 * リクエスト指定またはconfigからプリンタURLを決定
 */
export function getPrinterUrl(requestUrl?: string): string {
  return requestUrl || config.printerUrl
}

/**
 * プリンタ送信結果
 */
export interface SendResult {
  success: boolean
  responseText?: string
  error?: string
}

/**
 * XMLをプリンタに送信
 */
export async function sendXml(printerUrl: string, xml: string): Promise<SendResult> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(printerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=UTF-8',
        SOAPAction: '',
      },
      body: xml,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    const responseText = await response.text()

    if (!response.ok) {
      return {
        success: false,
        responseText,
        error: `Printer returned status ${response.status}`,
      }
    }

    return { success: true, responseText }
  } catch (error) {
    clearTimeout(timeoutId)

    if (error instanceof Error && error.name === 'AbortError') {
      return {
        success: false,
        error: `Request timed out after ${REQUEST_TIMEOUT_MS / 1000} seconds`,
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * プリンタのステータスを取得
 */
export async function queryStatus(printerUrl: string): Promise<{
  connected: boolean
  deviceStatus: string
  error?: string
}> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), STATUS_TIMEOUT_MS)

  const statusXml = `<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
  <s:Body>
    <POSPrinterRequest xmlns="http://www.citizen.co.jp/POSPrinter/" MajorVersion="1">
      <QuerySoftwareVersion/>
    </POSPrinterRequest>
  </s:Body>
</s:Envelope>`

  try {
    const response = await fetch(printerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=UTF-8',
        SOAPAction: '',
      },
      body: statusXml,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (response.ok) {
      return { connected: true, deviceStatus: 'online' }
    }

    return {
      connected: false,
      deviceStatus: 'error',
      error: `HTTP ${response.status}`,
    }
  } catch (error) {
    clearTimeout(timeoutId)
    return {
      connected: false,
      deviceStatus: 'offline',
      error: error instanceof Error ? error.message : String(error),
    }
  }
}
