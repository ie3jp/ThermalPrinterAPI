import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { printRoutes } from '../src/server/routes/print.js'

// プリンタ送信とImage処理をモック
vi.mock('../src/server/services/print-service.js', () => ({
  sendToPrinter: vi.fn().mockResolvedValue({
    success: true,
    message: 'Print job sent successfully',
    messageId: 'test-uuid',
    xml: '<xml/>',
  }),
  exportXml: vi.fn().mockResolvedValue('<xml/>'),
}))

vi.mock('../src/server/services/image.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/server/services/image.js')>()
  return {
    ...actual,
    processImage: vi.fn().mockResolvedValue({
      base64: 'Qk...',
      width: 576,
      height: 100,
      mode: 'mono',
    }),
  }
})

function createApp() {
  const app = new Hono()
  app.route('/api', printRoutes)
  return app
}

describe('POST /api/print - バリデーション', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    app = createApp()
  })

  it('commands が配列でない場合 400 を返す', async () => {
    const res = await app.request('/api/print', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commands: 'not-array' }),
    })
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.success).toBe(false)
  })

  it('commands が空配列の場合 400 を返す', async () => {
    const res = await app.request('/api/print', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commands: [] }),
    })
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.message).toContain('empty')
  })

  it('type が未指定のコマンドで 400 を返す', async () => {
    const res = await app.request('/api/print', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commands: [{ data: 'hello' }] }),
    })
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.message).toContain('type is required')
  })

  it('無効な type で 400 を返す', async () => {
    const res = await app.request('/api/print', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commands: [{ type: 'invalid' }] }),
    })
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.message).toContain('Invalid command type')
  })

  it('text コマンドで data が欠落している場合 400 を返す', async () => {
    const res = await app.request('/api/print', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commands: [{ type: 'text' }] }),
    })
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.message).toContain('text command requires "data"')
  })

  it('text コマンドで data が空文字列の場合は許容する', async () => {
    const res = await app.request('/api/print', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commands: [{ type: 'text', data: '' }] }),
    })
    expect(res.status).toBe(200)
  })

  it('image コマンドで data が欠落している場合 400 を返す', async () => {
    const res = await app.request('/api/print', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commands: [{ type: 'image' }] }),
    })
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.message).toContain('image command requires "data"')
  })

  it('qrcode コマンドで data が欠落している場合 400 を返す', async () => {
    const res = await app.request('/api/print', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commands: [{ type: 'qrcode' }] }),
    })
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.message).toContain('qrcode command requires "data"')
  })

  it('barcode コマンドで barcodeType が欠落している場合 400 を返す', async () => {
    const res = await app.request('/api/print', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commands: [{ type: 'barcode', data: '123456' }] }),
    })
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.message).toContain('barcode command requires "barcodeType"')
  })

  it('barcode コマンドで data が欠落している場合 400 を返す', async () => {
    const res = await app.request('/api/print', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commands: [{ type: 'barcode', barcodeType: 'CODE128' }] }),
    })
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.message).toContain('barcode command requires "data"')
  })

  it('feed コマンドで units が欠落している場合 400 を返す', async () => {
    const res = await app.request('/api/print', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commands: [{ type: 'feed' }] }),
    })
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.message).toContain('feed command requires numeric "units"')
  })

  it('setEncoding コマンドで encoding が欠落している場合 400 を返す', async () => {
    const res = await app.request('/api/print', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commands: [{ type: 'setEncoding' }] }),
    })
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.message).toContain('setEncoding command requires "encoding"')
  })

  it('raw コマンドで xml が欠落している場合 400 を返す', async () => {
    const res = await app.request('/api/print', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commands: [{ type: 'raw' }] }),
    })
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.message).toContain('raw command requires "xml"')
  })

  it('cut コマンドは必須フィールドなしで許容する', async () => {
    const res = await app.request('/api/print', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commands: [{ type: 'cut' }] }),
    })
    expect(res.status).toBe(200)
  })

  it('正常なリクエストで 200 を返す', async () => {
    const res = await app.request('/api/print', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        commands: [
          { type: 'text', data: 'Hello' },
          { type: 'cut' },
        ],
      }),
    })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
  })
})

describe('POST /api/export/xml - バリデーション', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    app = createApp()
  })

  it('commands が配列でない場合 400 を返す', async () => {
    const res = await app.request('/api/export/xml', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commands: 'not-array' }),
    })
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.success).toBe(false)
  })

  it('commands が空配列の場合 400 を返す', async () => {
    const res = await app.request('/api/export/xml', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commands: [] }),
    })
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('empty')
  })

  it('無効な type で 400 を返す', async () => {
    const res = await app.request('/api/export/xml', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commands: [{ type: 'unknown' }] }),
    })
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('Invalid command type')
  })

  it('barcode コマンドで barcodeType 欠落の場合 400 を返す', async () => {
    const res = await app.request('/api/export/xml', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commands: [{ type: 'barcode', data: '123' }] }),
    })
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('barcodeType')
  })

  it('feed コマンドで units 欠落の場合 400 を返す', async () => {
    const res = await app.request('/api/export/xml', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commands: [{ type: 'feed' }] }),
    })
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('units')
  })

  it('正常なリクエストで 200 と xml を返す', async () => {
    const res = await app.request('/api/export/xml', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        commands: [{ type: 'text', data: 'test' }],
      }),
    })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.xml).toBeDefined()
  })
})
