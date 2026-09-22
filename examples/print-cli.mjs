#!/usr/bin/env node
/**
 * PrintAPI Node.js CLIサンプル
 * 使い方: node print-cli.mjs [image-path]
 */

import { readFileSync } from 'fs'
import { basename, extname } from 'path'

const API_URL = 'http://localhost:3456'

/**
 * 印刷APIを呼び出す
 */
async function print(commands) {
  const response = await fetch(`${API_URL}/api/print`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ commands }),
  })
  return response.json()
}

/**
 * テキスト印刷
 */
async function printText(text, options = {}) {
  const { alignment = 'left', textSize = 0, cut = true } = options
  const commands = [
    { type: 'text', data: text, alignment, textSize },
  ]
  if (cut) {
    commands.push({ type: 'feed', units: 3 })
    commands.push({ type: 'cut', percentage: 'partial' })
  }
  return print(commands)
}

/**
 * 画像印刷（URL）
 */
async function printImageUrl(url, options = {}) {
  const { width = 400, alignment = 'center', mode = 'mono', caption, cut = true } = options
  const commands = [
    { type: 'image', data: url, width, alignment, mode },
  ]
  if (caption) {
    commands.push({ type: 'feed', units: 1 })
    commands.push({ type: 'text', data: caption, alignment: 'center' })
  }
  if (cut) {
    commands.push({ type: 'feed', units: 2 })
    commands.push({ type: 'cut', percentage: 'partial' })
  }
  return print(commands)
}

/**
 * 画像印刷（ローカルファイル）
 */
async function printImageFile(filePath, options = {}) {
  const { width = 400, alignment = 'center', mode = 'mono', cut = true } = options

  // ファイルを読み込んでBase64エンコード
  const buffer = readFileSync(filePath)
  const base64 = buffer.toString('base64')

  // MIMEタイプを判定
  const ext = extname(filePath).toLowerCase().slice(1)
  const mimeTypes = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    bmp: 'image/bmp',
    webp: 'image/webp',
  }
  const mime = mimeTypes[ext] || 'application/octet-stream'

  // Data URL形式で送信
  const dataUrl = `data:${mime};base64,${base64}`

  const commands = [
    { type: 'image', data: dataUrl, width, alignment, mode },
    { type: 'feed', units: 1 },
    { type: 'text', data: basename(filePath), alignment: 'center' },
  ]
  if (cut) {
    commands.push({ type: 'feed', units: 2 })
    commands.push({ type: 'cut', percentage: 'partial' })
  }
  return print(commands)
}

/**
 * QRコード印刷
 */
async function printQRCode(data, options = {}) {
  const { moduleSize = 6, ecLevel = 'M', alignment = 'center', label, cut = true } = options
  const commands = []
  if (label) {
    commands.push({ type: 'text', data: label, alignment: 'center' })
    commands.push({ type: 'feed', units: 1 })
  }
  commands.push({ type: 'qrcode', data, moduleSize, ecLevel, alignment })
  if (cut) {
    commands.push({ type: 'feed', units: 2 })
    commands.push({ type: 'cut', percentage: 'partial' })
  }
  return print(commands)
}

/**
 * プリンタステータス取得
 */
async function getStatus() {
  const response = await fetch(`${API_URL}/api/status`)
  return response.json()
}

// ==========================================
// メイン処理
// ==========================================
async function main() {
  const args = process.argv.slice(2)

  try {
    if (args.length === 0) {
      // 引数なし: デモ印刷
      console.log('=== テキスト印刷 ===')
      const result1 = await printText('Hello, PrintAPI!\nこんにちは！', {
        alignment: 'center',
        textSize: 1,
      })
      console.log(JSON.stringify(result1, null, 2))

      console.log('\n=== QRコード印刷 ===')
      const result2 = await printQRCode('https://example.com', {
        label: 'サンプルQR',
      })
      console.log(JSON.stringify(result2, null, 2))

    } else if (args[0] === '--status') {
      // ステータス確認
      console.log('=== プリンタステータス ===')
      const status = await getStatus()
      console.log(JSON.stringify(status, null, 2))

    } else if (args[0] === '--url') {
      // URL画像印刷
      const url = args[1]
      if (!url) {
        console.error('使用法: node print-cli.mjs --url <image-url>')
        process.exit(1)
      }
      console.log(`=== URL画像印刷: ${url} ===`)
      const result = await printImageUrl(url)
      console.log(JSON.stringify(result, null, 2))

    } else {
      // ファイル画像印刷
      const filePath = args[0]
      console.log(`=== ファイル画像印刷: ${filePath} ===`)
      const result = await printImageFile(filePath)
      console.log(JSON.stringify(result, null, 2))
    }
  } catch (error) {
    console.error('エラー:', error.message)
    process.exit(1)
  }
}

main()
