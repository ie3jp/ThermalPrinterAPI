import { serve, type ServerType } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { printRoutes } from './routes/print.js'
import { statusRoutes } from './routes/status.js'
import { config } from './config.js'
import { startOscServer, stopOscServer } from './services/osc-server.js'
import { existsSync, readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createServer } from 'net'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export const app = new Hono()

// Middleware
app.use('*', logger())
app.use('*', cors())

// API Routes
app.route('/api', printRoutes)
app.route('/api', statusRoutes)

// Health check
app.get('/health', (c) => c.json({ status: 'ok' }))

// 本番環境での静的ファイル配信
const clientDistPath = join(__dirname, '../client')
const isProduction = existsSync(clientDistPath)

if (isProduction) {
  // 静的ファイル配信（絶対パスを使用）
  app.use('*', async (c, next) => {
    const path = c.req.path
    const filePath = join(clientDistPath, path)

    // ファイルが存在する場合は返す
    if (existsSync(filePath) && !filePath.endsWith('/')) {
      try {
        const content = readFileSync(filePath)
        const ext = filePath.split('.').pop() || ''
        const mimeTypes: Record<string, string> = {
          'html': 'text/html',
          'js': 'application/javascript',
          'css': 'text/css',
          'json': 'application/json',
          'png': 'image/png',
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'gif': 'image/gif',
          'svg': 'image/svg+xml',
          'ico': 'image/x-icon',
          'woff': 'font/woff',
          'woff2': 'font/woff2',
        }
        const contentType = mimeTypes[ext] || 'application/octet-stream'
        return c.body(content, 200, { 'Content-Type': contentType })
      } catch {
        // ファイル読み込み失敗時は次へ
      }
    }
    await next()
  })

  // SPA用フォールバック: index.htmlを返す
  app.get('*', (c) => {
    const indexPath = join(clientDistPath, 'index.html')
    if (existsSync(indexPath)) {
      const html = readFileSync(indexPath, 'utf-8')
      return c.html(html)
    }
    return c.notFound()
  })

  console.log('Serving static files from:', clientDistPath)
}

/**
 * ポートが使用可能かチェック
 */
function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer()
    server.once('error', () => resolve(false))
    server.once('listening', () => {
      server.close()
      resolve(true)
    })
    server.listen(port, '0.0.0.0')
  })
}

/**
 * 空きポートを探す
 */
async function findAvailablePort(startPort: number): Promise<number> {
  let port = startPort
  while (port < startPort + 100) {
    if (await isPortAvailable(port)) {
      return port
    }
    port++
  }
  throw new Error(`No available port found (tried ${startPort}-${port - 1})`)
}

/**
 * サーバーを起動する
 * @returns サーバーインスタンス（停止用）
 */
export async function startServer(): Promise<ServerType> {
  const port = await findAvailablePort(config.port)
  const serverUrl = `http://localhost:${port}`

  // OSCサーバーを起動
  startOscServer()

  console.log('')
  console.log('========================================')
  console.log('   Thermal Printer API Server')
  console.log('========================================')
  console.log('')
  console.log(`  GUI: ${serverUrl}`)
  console.log(`  API: ${serverUrl}/api`)
  console.log(`  OSC: udp://0.0.0.0:${config.oscPort}`)
  console.log('')
  console.log('  停止するには Ctrl+C を押してください')
  console.log('========================================')
  console.log('')

  if (!isProduction) {
    console.log('Development mode: Use Vite dev server for frontend (http://localhost:5173)')
  }

  return serve({
    fetch: app.fetch,
    port,
    hostname: '0.0.0.0',
  })
}

export { config, stopOscServer }

// 直接実行時はサーバーを起動
const isDirectRun = process.argv[1]?.includes('server/index') ||
                    process.argv[1]?.includes('server\\index')
if (isDirectRun) {
  startServer().catch(console.error)
}
