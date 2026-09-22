/**
 * 画像処理サービス
 * Sharpを使用してBMP変換、ディザリング、モノクロ/グレースケール対応
 */

import sharp from 'sharp'
import type { ImageMode } from '../types/commands.js'

// プリンタ用紙幅（80mm = 576ドット）
const PRINTER_WIDTH = 576

/**
 * 画像バリデーションエラー（400系として扱う）
 */
export class ImageValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ImageValidationError'
  }
}

/**
 * 画像処理結果
 */
export interface ProcessedImage {
  base64: string
  width: number
  height: number
  mode: ImageMode
}

/**
 * 画像処理オプション
 */
export interface ImageProcessOptions {
  mode?: ImageMode
  width?: number | 'asis'
  dither?: boolean
}

const IMAGE_FETCH_TIMEOUT_MS = 10000 // 10秒
const IMAGE_MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10MB

/**
 * Base64またはURLから画像バッファを取得
 */
async function getImageBuffer(data: string): Promise<Buffer> {
  // Data URL形式（base64）の場合
  if (data.startsWith('data:')) {
    const base64Data = data.split(',')[1]
    if (!base64Data) {
      throw new ImageValidationError('Invalid data URL format')
    }
    return Buffer.from(base64Data, 'base64')
  }

  // 純粋なBase64の場合
  if (!data.startsWith('http://') && !data.startsWith('https://')) {
    return Buffer.from(data, 'base64')
  }

  // URLの場合
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), IMAGE_FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(data, { signal: controller.signal })
    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new ImageValidationError(`Failed to fetch image: ${response.status}`)
    }

    // Content-Lengthでサイズチェック
    const contentLength = response.headers.get('content-length')
    if (contentLength && parseInt(contentLength, 10) > IMAGE_MAX_SIZE_BYTES) {
      throw new ImageValidationError(
        `Image too large: ${contentLength} bytes (max ${IMAGE_MAX_SIZE_BYTES} bytes)`
      )
    }

    const arrayBuffer = await response.arrayBuffer()

    // 実際のサイズもチェック
    if (arrayBuffer.byteLength > IMAGE_MAX_SIZE_BYTES) {
      throw new ImageValidationError(
        `Image too large: ${arrayBuffer.byteLength} bytes (max ${IMAGE_MAX_SIZE_BYTES} bytes)`
      )
    }

    return Buffer.from(arrayBuffer)
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof ImageValidationError) throw error
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ImageValidationError(
        `Image fetch timed out after ${IMAGE_FETCH_TIMEOUT_MS / 1000} seconds`
      )
    }
    throw new ImageValidationError(
      `Failed to fetch image: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

/**
 * Floyd-Steinbergディザリング
 */
function floydSteinbergDither(
  pixels: Uint8ClampedArray,
  width: number,
  height: number
): Uint8Array {
  // グレースケール値を作業用配列にコピー（浮動小数点で計算）
  const buffer = new Float32Array(width * height)
  for (let i = 0; i < pixels.length; i++) {
    buffer[i] = pixels[i]
  }

  const output = new Uint8Array(width * height)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x
      const oldPixel = buffer[idx]
      const newPixel = oldPixel < 128 ? 0 : 255
      output[idx] = newPixel

      const error = oldPixel - newPixel

      // 誤差を周囲のピクセルに分散
      if (x + 1 < width) {
        buffer[idx + 1] += (error * 7) / 16
      }
      if (y + 1 < height) {
        if (x > 0) {
          buffer[(y + 1) * width + (x - 1)] += (error * 3) / 16
        }
        buffer[(y + 1) * width + x] += (error * 5) / 16
        if (x + 1 < width) {
          buffer[(y + 1) * width + (x + 1)] += (error * 1) / 16
        }
      }
    }
  }

  return output
}

/**
 * 1bpp BMPを生成（モノクロ）
 */
function createMonoBmp(
  pixels: Uint8Array,
  width: number,
  height: number
): Buffer {
  // 行のバイト数は4バイト境界にアラインメント
  const rowBytes = Math.ceil(width / 8)
  const rowPadding = (4 - (rowBytes % 4)) % 4
  const alignedRowBytes = rowBytes + rowPadding

  const pixelDataSize = alignedRowBytes * height
  const fileSize = 62 + pixelDataSize // 14(file header) + 40(info header) + 8(color table) + pixel data

  const buffer = Buffer.alloc(fileSize)
  let offset = 0

  // BITMAPFILEHEADER (14 bytes)
  buffer.write('BM', offset)
  offset += 2
  buffer.writeUInt32LE(fileSize, offset)
  offset += 4
  buffer.writeUInt16LE(0, offset)
  offset += 2 // reserved
  buffer.writeUInt16LE(0, offset)
  offset += 2 // reserved
  buffer.writeUInt32LE(62, offset)
  offset += 4 // pixel data offset

  // BITMAPINFOHEADER (40 bytes)
  buffer.writeUInt32LE(40, offset)
  offset += 4 // header size
  buffer.writeInt32LE(width, offset)
  offset += 4 // width
  buffer.writeInt32LE(height, offset)
  offset += 4 // height (positive = bottom-up)
  buffer.writeUInt16LE(1, offset)
  offset += 2 // planes
  buffer.writeUInt16LE(1, offset)
  offset += 2 // bits per pixel (1bpp)
  buffer.writeUInt32LE(0, offset)
  offset += 4 // compression (none)
  buffer.writeUInt32LE(pixelDataSize, offset)
  offset += 4 // image size
  buffer.writeInt32LE(2835, offset)
  offset += 4 // x pixels per meter (72 DPI)
  buffer.writeInt32LE(2835, offset)
  offset += 4 // y pixels per meter
  buffer.writeUInt32LE(2, offset)
  offset += 4 // colors used
  buffer.writeUInt32LE(2, offset)
  offset += 4 // important colors

  // Color table (2 colors for 1bpp)
  // Color 0: Black (BGR + reserved)
  buffer.writeUInt32LE(0x00000000, offset)
  offset += 4
  // Color 1: White
  buffer.writeUInt32LE(0x00ffffff, offset)
  offset += 4

  // Pixel data (bottom-up)
  for (let y = height - 1; y >= 0; y--) {
    let byteVal = 0
    let bitPos = 7

    for (let x = 0; x < width; x++) {
      const pixel = pixels[y * width + x]
      // 白は1、黒は0
      if (pixel > 128) {
        byteVal |= 1 << bitPos
      }

      bitPos--
      if (bitPos < 0) {
        buffer.writeUInt8(byteVal, offset)
        offset++
        byteVal = 0
        bitPos = 7
      }
    }

    // 最後のバイトを書き込み
    if (bitPos < 7) {
      buffer.writeUInt8(byteVal, offset)
      offset++
    }

    // パディングを追加
    for (let p = 0; p < rowPadding; p++) {
      buffer.writeUInt8(0, offset)
      offset++
    }
  }

  return buffer
}

/**
 * 4bpp BMPを生成（16階調グレースケール）
 */
function createGray4bppBmp(
  pixels: Uint8ClampedArray,
  width: number,
  height: number
): Buffer {
  // 行のバイト数は4バイト境界にアラインメント
  const rowBytes = Math.ceil(width / 2)
  const rowPadding = (4 - (rowBytes % 4)) % 4
  const alignedRowBytes = rowBytes + rowPadding

  const pixelDataSize = alignedRowBytes * height
  const colorTableSize = 16 * 4 // 16色 × 4バイト
  const fileSize = 14 + 40 + colorTableSize + pixelDataSize

  const buffer = Buffer.alloc(fileSize)
  let offset = 0

  // BITMAPFILEHEADER (14 bytes)
  buffer.write('BM', offset)
  offset += 2
  buffer.writeUInt32LE(fileSize, offset)
  offset += 4
  buffer.writeUInt16LE(0, offset)
  offset += 2
  buffer.writeUInt16LE(0, offset)
  offset += 2
  buffer.writeUInt32LE(14 + 40 + colorTableSize, offset)
  offset += 4

  // BITMAPINFOHEADER (40 bytes)
  buffer.writeUInt32LE(40, offset)
  offset += 4
  buffer.writeInt32LE(width, offset)
  offset += 4
  buffer.writeInt32LE(height, offset)
  offset += 4
  buffer.writeUInt16LE(1, offset)
  offset += 2
  buffer.writeUInt16LE(4, offset)
  offset += 2 // 4bpp
  buffer.writeUInt32LE(0, offset)
  offset += 4
  buffer.writeUInt32LE(pixelDataSize, offset)
  offset += 4
  buffer.writeInt32LE(2835, offset)
  offset += 4
  buffer.writeInt32LE(2835, offset)
  offset += 4
  buffer.writeUInt32LE(16, offset)
  offset += 4
  buffer.writeUInt32LE(16, offset)
  offset += 4

  // Color table (16 grayscale colors)
  for (let i = 0; i < 16; i++) {
    const gray = Math.round((i / 15) * 255)
    buffer.writeUInt8(gray, offset)
    offset++ // B
    buffer.writeUInt8(gray, offset)
    offset++ // G
    buffer.writeUInt8(gray, offset)
    offset++ // R
    buffer.writeUInt8(0, offset)
    offset++ // reserved
  }

  // Pixel data (bottom-up)
  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x += 2) {
      const p1 = pixels[y * width + x]
      const p2 = x + 1 < width ? pixels[y * width + x + 1] : 0

      // 0-255を0-15に変換
      const v1 = Math.round((p1 / 255) * 15)
      const v2 = Math.round((p2 / 255) * 15)

      // 上位4ビットに最初のピクセル、下位4ビットに2番目のピクセル
      buffer.writeUInt8((v1 << 4) | v2, offset)
      offset++
    }

    // パディングを追加
    for (let p = 0; p < rowPadding; p++) {
      buffer.writeUInt8(0, offset)
      offset++
    }
  }

  return buffer
}

/**
 * BMPファイルかどうかを判定（マジックナンバー 'BM' = 0x42 0x4D）
 */
function isBmpBuffer(buffer: Buffer): boolean {
  return buffer.length >= 2 && buffer[0] === 0x42 && buffer[1] === 0x4d
}

/**
 * 画像を処理してBMP形式のBase64を生成
 */
export async function processImage(
  data: string,
  options: ImageProcessOptions = {}
): Promise<ProcessedImage> {
  const { mode = 'mono', width = PRINTER_WIDTH, dither = true } = options

  // 画像バッファを取得
  const inputBuffer = await getImageBuffer(data)

  // BMPファイルの場合はSharpを通さずそのまま返す（Sharpは BMP入力非対応）
  if (isBmpBuffer(inputBuffer)) {
    return {
      base64: inputBuffer.toString('base64'),
      width: width === 'asis' ? PRINTER_WIDTH : Math.min(width, PRINTER_WIDTH),
      height: 0,
      mode,
    }
  }

  // Sharpで画像を読み込み
  let image = sharp(inputBuffer)
  const metadata = await image.metadata()

  // アルファチャンネル付き画像は白背景に合成して除去
  if (metadata.hasAlpha) {
    image = image.flatten({ background: { r: 255, g: 255, b: 255 } })
  }

  // 幅を計算
  let targetWidth: number
  if (width === 'asis') {
    targetWidth = metadata.width || PRINTER_WIDTH
  } else {
    targetWidth = Math.min(width, PRINTER_WIDTH)
  }

  // アスペクト比を維持してリサイズ
  if (metadata.width && metadata.width !== targetWidth) {
    image = image.resize(targetWidth, null, {
      fit: 'inside',
      withoutEnlargement: false,
    })
  }

  // グレースケールに変換
  image = image.grayscale()

  // リサイズ後のメタデータを取得
  const resizedBuffer = await image.raw().toBuffer({ resolveWithObject: true })
  const { width: finalWidth, height: finalHeight } = resizedBuffer.info

  let bmpBuffer: Buffer

  if (mode === 'mono') {
    // モノクロ（1bpp）
    let monoPixels: Uint8Array

    if (dither) {
      // Floyd-Steinbergディザリングを適用
      monoPixels = floydSteinbergDither(
        new Uint8ClampedArray(resizedBuffer.data),
        finalWidth,
        finalHeight
      )
    } else {
      // 単純な閾値変換
      monoPixels = new Uint8Array(finalWidth * finalHeight)
      for (let i = 0; i < resizedBuffer.data.length; i++) {
        monoPixels[i] = resizedBuffer.data[i] < 128 ? 0 : 255
      }
    }

    bmpBuffer = createMonoBmp(monoPixels, finalWidth, finalHeight)
  } else {
    // グレースケール（4bpp）
    bmpBuffer = createGray4bppBmp(
      new Uint8ClampedArray(resizedBuffer.data),
      finalWidth,
      finalHeight
    )
  }

  return {
    base64: bmpBuffer.toString('base64'),
    width: finalWidth,
    height: finalHeight,
    mode,
  }
}

