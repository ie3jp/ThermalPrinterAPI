/**
 * Citizen CXMLPrint SDK Node.jsラッパー
 * ブラウザ用SDKをNode.js環境で動作させるためのアダプタ
 */

import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import vm from 'vm'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const sdkPath = join(__dirname, 'cxmlp-api.js')
if (!existsSync(sdkPath)) {
  throw new Error('CITIZEN SDK is not installed. See README.md and run pnpm sdk:install /path/to/cxmlp-api.js, then rebuild if using pnpm start.')
}
const sdkSource = readFileSync(sdkPath, 'utf-8')

// SDKは (function(aa){ ... })(window) 形式
// window の代わりにfakeWindowを渡す
const fakeWindow: Record<string, unknown> = {}

// SDKのIIFEの引数を差し替えて実行
// 最後の (window) を (fakeWindow) に置き換え
const modifiedSource = sdkSource.replace(
  /\}\)\(window\)\s*;?\s*$/,
  '})(fakeWindow);'
)

const script = new vm.Script(modifiedSource)
const context = vm.createContext({ fakeWindow })
script.runInContext(context)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CXMLPrint = (context.fakeWindow as any).citizen?.CXMLPrint

if (!CXMLPrint) {
  throw new Error('Failed to load CXMLPrint SDK')
}

export { CXMLPrint }

/**
 * CXMLPrintインスタンスを生成するファクトリ
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createPrinter(): any {
  return new CXMLPrint()
}
