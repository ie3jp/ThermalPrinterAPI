#!/usr/bin/env node
/**
 * Node.js同梱版パッケージングスクリプト
 * Node.jsバイナリとアプリをまとめて配布パッケージを作成
 */

import { existsSync, mkdirSync, cpSync, writeFileSync, chmodSync, rmSync, createWriteStream } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import https from 'https'
import { execFileSync } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..')

// Node.jsバージョン
const NODE_VERSION = '20.18.1'

// コマンドライン引数を解析
const args = process.argv.slice(2)
const targetArg = args.includes('--target') ? args[args.indexOf('--target') + 1] : null

// ターゲットプラットフォームを決定
let platform, arch, nodeFileName
if (targetArg === 'win') {
  platform = 'win'
  arch = 'x64'
  nodeFileName = `node-v${NODE_VERSION}-win-x64`
} else if (targetArg === 'linux') {
  platform = 'linux'
  arch = 'x64'
  nodeFileName = `node-v${NODE_VERSION}-linux-x64`
} else {
  // デフォルト: macOS ARM64
  platform = 'darwin'
  arch = 'arm64'
  nodeFileName = `node-v${NODE_VERSION}-darwin-arm64`
}

const appName = 'PrintAPI'
const releaseDir = join(projectRoot, 'release', appName)

console.log(`\n📦 Node.js同梱版パッケージを作成します`)
console.log(`   Platform: ${platform}-${arch}`)
console.log(`   Node.js: v${NODE_VERSION}\n`)

// 既存のreleaseディレクトリを削除
if (existsSync(releaseDir)) {
  console.log('🗑️  既存のreleaseディレクトリを削除中...')
  rmSync(releaseDir, { recursive: true })
}
mkdirSync(releaseDir, { recursive: true })

// dist があることを確認
const serverDist = join(projectRoot, 'dist', 'server')
const clientDist = join(projectRoot, 'dist', 'client')
if (!existsSync(serverDist) || !existsSync(clientDist)) {
  console.error('❌ dist が見つかりません。先に pnpm build を実行してください。')
  process.exit(1)
}

// Node.jsバイナリをダウンロード
const nodeExt = platform === 'win' ? 'zip' : 'tar.gz'
const nodeUrl = `https://nodejs.org/dist/v${NODE_VERSION}/${nodeFileName}.${nodeExt}`

const nodeCacheDir = join(projectRoot, '.node-cache')
const nodeCachePath = join(nodeCacheDir, `${nodeFileName}.${nodeExt}`)

async function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(dest)

    const request = (url) => {
      https.get(url, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          // リダイレクトをフォロー
          request(response.headers.location)
        } else if (response.statusCode === 200) {
          response.pipe(file)
          file.on('finish', () => {
            file.close()
            resolve()
          })
        } else {
          reject(new Error(`HTTP ${response.statusCode}`))
        }
      }).on('error', reject)
    }

    request(url)
  })
}

async function downloadNode() {
  if (existsSync(nodeCachePath)) {
    console.log('📦 キャッシュされたNode.jsを使用します')
    return
  }

  console.log(`⬇️  Node.js v${NODE_VERSION} をダウンロード中...`)
  console.log(`   ${nodeUrl}`)
  mkdirSync(nodeCacheDir, { recursive: true })

  await downloadFile(nodeUrl, nodeCachePath)
  console.log('   ダウンロード完了')
}

function extractNode() {
  console.log('📂 Node.jsを展開中...')
  const runtimeDir = join(releaseDir, 'runtime')
  mkdirSync(runtimeDir, { recursive: true })

  if (platform === 'win') {
    // Windows: zipを展開
    execFileSync('unzip', ['-q', nodeCachePath, '-d', runtimeDir])
    // フォルダ内容を移動
    const extractedDir = join(runtimeDir, nodeFileName)
    cpSync(extractedDir, runtimeDir, { recursive: true })
    rmSync(extractedDir, { recursive: true })
  } else {
    // macOS/Linux: tar.gzを展開（tarコマンド使用）
    execFileSync('tar', ['-xzf', nodeCachePath, '-C', runtimeDir, '--strip-components=1'])
  }

  // 不要なファイルを削除してサイズを削減
  console.log('🗑️  不要なファイルを削除中...')
  const unnecessaryPaths = [
    'include',           // ヘッダーファイル
    'share',             // ドキュメント
    'lib/node_modules',  // npm（不要）
    'bin/npm',
    'bin/npx',
    'bin/corepack',
    'CHANGELOG.md',
    'LICENSE',
    'README.md',
  ]

  for (const p of unnecessaryPaths) {
    const fullPath = join(runtimeDir, p)
    if (existsSync(fullPath)) {
      rmSync(fullPath, { recursive: true, force: true })
    }
  }
}

function copyAppFiles() {
  console.log('📂 アプリファイルをコピー中...')

  const appDir = join(releaseDir, 'app')
  mkdirSync(appDir, { recursive: true })

  // distをコピー
  cpSync(join(projectRoot, 'dist'), join(appDir, 'dist'), { recursive: true })

  // 必要なnode_modulesをコピー（本番依存のみ）
  console.log('📂 依存モジュールをコピー中...')
  const modulesDir = join(appDir, 'node_modules')
  mkdirSync(modulesDir, { recursive: true })

  // 本番依存をコピー
  const prodDeps = [
    '@hono',
    'hono',
    'sharp',
    '@img',
  ]

  for (const dep of prodDeps) {
    const srcPath = join(projectRoot, 'node_modules', dep)
    if (existsSync(srcPath)) {
      cpSync(srcPath, join(modulesDir, dep), { recursive: true })
    }
  }

  // package.jsonをコピー（typeフィールドが必要）
  const pkgJson = {
    name: 'print-api',
    type: 'module',
    main: 'dist/server/index.js'
  }
  writeFileSync(join(appDir, 'package.json'), JSON.stringify(pkgJson, null, 2))
}

function createLaunchScripts() {
  console.log('📝 起動スクリプトを作成中...')

  if (platform === 'darwin') {
    // macOS: .appバンドルを作成
    createMacAppBundle()
  } else {
    // Windows/Linux用のスクリプト
    const batScript = `@echo off
cd /d "%~dp0"
runtime\\node.exe app\\dist\\server\\index.js
pause
`
    const shScript = `#!/bin/bash
cd "$(dirname "$0")"
./runtime/bin/node app/dist/server/index.js
`
    writeFileSync(join(releaseDir, 'start.bat'), batScript)
    writeFileSync(join(releaseDir, 'start.sh'), shScript)
    chmodSync(join(releaseDir, 'start.sh'), 0o755)
  }
}

function createMacAppBundle() {
  console.log('🍎 macOS .appバンドルを作成中...')

  const appBundle = join(projectRoot, 'release', `${appName}.app`)
  const contentsDir = join(appBundle, 'Contents')
  const macOSDir = join(contentsDir, 'MacOS')
  const resourcesDir = join(contentsDir, 'Resources')

  // 既存の.appを削除
  if (existsSync(appBundle)) {
    rmSync(appBundle, { recursive: true })
  }

  // ディレクトリ構造を作成
  mkdirSync(macOSDir, { recursive: true })
  mkdirSync(resourcesDir, { recursive: true })

  // Info.plistを作成
  const infoPlist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>start</string>
    <key>CFBundleIdentifier</key>
    <string>com.printapi.app</string>
    <key>CFBundleName</key>
    <string>${appName}</string>
    <key>CFBundleDisplayName</key>
    <string>${appName}</string>
    <key>CFBundleVersion</key>
    <string>1.0.0</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0.0</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleIconFile</key>
    <string>AppIcon</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.15</string>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>LSUIElement</key>
    <false/>
</dict>
</plist>
`
  writeFileSync(join(contentsDir, 'Info.plist'), infoPlist)

  // 起動スクリプト（MacOS/start）を作成
  // サーバーをバックグラウンドで起動し、アプリ自体は終了する
  const startScript = `#!/bin/bash

# .appバンドル内のResourcesディレクトリに移動
RESOURCES_DIR="$(dirname "$0")/../Resources"
cd "$RESOURCES_DIR"

# ログファイル
LOG_FILE="$RESOURCES_DIR/server.log"

# 既存のサーバーが動いていたら停止
pkill -f "node.*app/dist/server/index.js" 2>/dev/null || true
sleep 0.5

# サーバーをバックグラウンドで起動
nohup ./runtime/bin/node app/dist/server/index.js > "$LOG_FILE" 2>&1 &

# ブラウザで開く
sleep 1
open "http://localhost:3000"

# アプリ自体は終了（サーバーはバックグラウンドで動き続ける）
exit 0
`
  writeFileSync(join(macOSDir, 'start'), startScript)
  chmodSync(join(macOSDir, 'start'), 0o755)

  // runtime と app を Resources にコピー（移動）
  console.log('📂 リソースを.appにコピー中...')
  cpSync(join(releaseDir, 'runtime'), join(resourcesDir, 'runtime'), { recursive: true })
  cpSync(join(releaseDir, 'app'), join(resourcesDir, 'app'), { recursive: true })

  // 元のディレクトリを削除
  rmSync(releaseDir, { recursive: true })

  console.log(`✅ .appバンドル作成完了: ${appBundle}`)
}

async function main() {
  try {
    await downloadNode()
    extractNode()
    copyAppFiles()
    createLaunchScripts()

    // サイズを計算
    const getDirSize = (dir) => {
      let size = 0
      try {
        const output = execFileSync('du', ['-sk', dir]).toString()
        size = parseInt(output.split('\t')[0]) * 1024
      } catch {
        size = 0
      }
      return size
    }

    if (platform === 'darwin') {
      const appBundle = join(projectRoot, 'release', `${appName}.app`)
      const totalSize = getDirSize(appBundle)
      const sizeMB = (totalSize / 1024 / 1024).toFixed(1)

      console.log(`\n✅ パッケージング完了！`)
      console.log(`   出力先: ${appBundle}`)
      console.log(`   サイズ: ${sizeMB} MB`)
      console.log(`\n💡 使い方:`)
      console.log(`   Finderで ${appName}.app をダブルクリック`)
      console.log(`   または: open release/${appName}.app\n`)
    } else {
      const totalSize = getDirSize(releaseDir)
      const sizeMB = (totalSize / 1024 / 1024).toFixed(1)

      console.log(`\n✅ パッケージング完了！`)
      console.log(`   出力先: ${releaseDir}`)
      console.log(`   サイズ: ${sizeMB} MB`)
      console.log(`\n📁 構成:`)
      console.log(`   ${appName}/`)
      console.log(`   ├── runtime/          # Node.js v${NODE_VERSION}`)
      console.log(`   ├── app/              # アプリケーション`)
      console.log(`   │   ├── dist/`)
      console.log(`   │   └── node_modules/`)
      console.log(`   ├── start.sh          # Linux用`)
      console.log(`   └── start.bat         # Windows用`)
      console.log(`\n💡 使い方:`)
      console.log(`   cd release/${appName} && ./start.sh\n`)
    }

  } catch (error) {
    console.error('❌ エラー:', error)
    process.exit(1)
  }
}

main()
