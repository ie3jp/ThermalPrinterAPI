import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { processImage, ImageValidationError } from '../src/server/services/image.js'
import sharp from 'sharp'

describe('processImage - アルファチャンネルの白背景合成', () => {
  it('透明PNGを白背景に合成する', async () => {
    // 2x2 RGBA画像（アルファあり）
    const rgbaBuffer = await sharp({
      create: { width: 2, height: 2, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    })
      .png()
      .toBuffer()

    const base64 = rgbaBuffer.toString('base64')

    const white = await sharp({
      create: { width: 2, height: 2, channels: 3, background: '#ffffff' },
    }).png().toBuffer()
    const result = await processImage(base64, { width: 'asis' })
    const expected = await processImage(white.toString('base64'), { width: 'asis' })
    expect(result).toEqual(expected)
  })

  it('アルファなしPNGは処理できる', async () => {
    // 2x2 RGB画像（アルファなし）
    const rgbBuffer = await sharp({
      create: { width: 2, height: 2, channels: 3, background: { r: 128, g: 128, b: 128 } },
    })
      .png()
      .toBuffer()

    const base64 = rgbBuffer.toString('base64')
    const result = await processImage(base64, { width: 'asis' })

    expect(result.base64).toBeDefined()
    expect(result.width).toBe(2)
    expect(result.height).toBe(2)
    expect(result.mode).toBe('mono')
  })

  it('グレースケール画像（アルファなし）は処理できる', async () => {
    const grayBuffer = await sharp({
      create: { width: 4, height: 4, channels: 3, background: { r: 200, g: 200, b: 200 } },
    })
      .png()
      .toBuffer()

    const base64 = grayBuffer.toString('base64')
    const result = await processImage(base64, { mode: 'gray' })

    expect(result.mode).toBe('gray')
    expect(result.base64).toBeDefined()
  })

  it('data URL形式のアルファ付き画像を処理できる', async () => {
    const rgbaBuffer = await sharp({
      create: { width: 2, height: 2, channels: 4, background: { r: 255, g: 0, b: 0, alpha: 1 } },
    })
      .png()
      .toBuffer()

    const dataUrl = `data:image/png;base64,${rgbaBuffer.toString('base64')}`

    const result = await processImage(dataUrl, { width: 'asis' })
    expect(result.width).toBe(2)
    expect(result.height).toBe(2)
    expect(result.base64.startsWith('Qk')).toBe(true)
  })

  it('data URL形式のアルファなし画像は処理できる', async () => {
    const rgbBuffer = await sharp({
      create: { width: 2, height: 2, channels: 3, background: { r: 0, g: 0, b: 0 } },
    })
      .jpeg()
      .toBuffer()

    const dataUrl = `data:image/jpeg;base64,${rgbBuffer.toString('base64')}`
    const result = await processImage(dataUrl)

    expect(result.base64).toBeDefined()
  })
})

describe('processImage - URL取得制限', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('URL取得がタイムアウトした場合 ImageValidationError を投げる', async () => {
    const mockFetch = vi.fn().mockImplementation(() => {
      return new Promise((_, reject) => {
        setTimeout(() => {
          const error = new Error('abort')
          error.name = 'AbortError'
          reject(error)
        }, 50)
      })
    })
    vi.stubGlobal('fetch', mockFetch)

    await expect(processImage('http://example.com/image.png')).rejects.toThrow(ImageValidationError)
    await expect(processImage('http://example.com/image.png')).rejects.toThrow('timed out')
  })

  it('Content-Length超過時に ImageValidationError を投げる', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-length': '20000000' }), // 20MB
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
    })
    vi.stubGlobal('fetch', mockFetch)

    await expect(processImage('http://example.com/large.png')).rejects.toThrow(ImageValidationError)
    await expect(processImage('http://example.com/large.png')).rejects.toThrow('too large')
  })

  it('HTTP エラーステータスで ImageValidationError を投げる', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    })
    vi.stubGlobal('fetch', mockFetch)

    await expect(processImage('https://example.com/notfound.png')).rejects.toThrow(ImageValidationError)
    await expect(processImage('https://example.com/notfound.png')).rejects.toThrow('404')
  })

  it('不正な data URL で ImageValidationError を投げる', async () => {
    await expect(processImage('data:image/png;base64,')).rejects.toThrow(ImageValidationError)
    await expect(processImage('data:image/png;base64,')).rejects.toThrow('Invalid data URL')
  })
})

describe('processImage - BMP生成', () => {
  it('モノクロ (1bpp) BMP のBase64が生成される', async () => {
    const buffer = await sharp({
      create: { width: 8, height: 2, channels: 3, background: { r: 255, g: 255, b: 255 } },
    })
      .png()
      .toBuffer()

    const result = await processImage(buffer.toString('base64'), { mode: 'mono', width: 'asis' })
    // BMPマジックナンバー "BM" = Base64 "Qk"
    expect(result.base64.startsWith('Qk')).toBe(true)
    expect(result.mode).toBe('mono')
  })

  it('グレースケール (4bpp) BMP のBase64が生成される', async () => {
    const buffer = await sharp({
      create: { width: 8, height: 2, channels: 3, background: { r: 100, g: 100, b: 100 } },
    })
      .png()
      .toBuffer()

    const result = await processImage(buffer.toString('base64'), { mode: 'gray', width: 'asis' })
    expect(result.base64.startsWith('Qk')).toBe(true)
    expect(result.mode).toBe('gray')
  })

  it('幅がPRINTER_WIDTH(576)に制限される', async () => {
    const buffer = await sharp({
      create: { width: 1000, height: 100, channels: 3, background: { r: 0, g: 0, b: 0 } },
    })
      .png()
      .toBuffer()

    const result = await processImage(buffer.toString('base64'))
    expect(result.width).toBeLessThanOrEqual(576)
  })
})
