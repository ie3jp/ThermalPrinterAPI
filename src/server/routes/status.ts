import { Hono } from 'hono'
import { getStatus } from '../services/print-service.js'
import type { StatusResponse } from '../types/commands.js'

export const statusRoutes = new Hono()

/**
 * GET /api/status - プリンタステータス取得
 *
 * クエリパラメータ:
 *   printerUrl: プリンタURL（省略時は環境変数 PRINTER_URL）
 *
 * レスポンス:
 * {
 *   "connected": true,
 *   "deviceStatus": "online",
 *   "paperNearEmpty": false
 * }
 */
statusRoutes.get('/status', async (c) => {
  try {
    const printerUrl = c.req.query('printerUrl')
    const result = await getStatus(printerUrl)

    const statusCode = result.connected ? 200 : 503
    return c.json<StatusResponse>(
      {
        connected: result.connected,
        deviceStatus: result.deviceStatus as StatusResponse['deviceStatus'],
        error: result.error,
      },
      statusCode
    )
  } catch (error) {
    console.error('Status error:', error)
    return c.json<StatusResponse>(
      {
        connected: false,
        deviceStatus: 'error',
        error: error instanceof Error ? error.message : String(error),
      },
      500
    )
  }
})
