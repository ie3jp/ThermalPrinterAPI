import { readFileSync, copyFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const source = process.argv[2]
if (!source) {
  console.error('Usage: pnpm sdk:install /path/to/CITIZEN/Library/cxmlp-api.js')
  console.error('Download the SDK from CITIZEN after reviewing its license. See README.md.')
  process.exit(1)
}
const data = readFileSync(source, 'utf8')
if (!data.includes('CXMLPrint') || !data.includes('CITIZEN')) {
  console.error('This does not look like the CITIZEN POS Print SDK (cxmlp-api.js).')
  process.exit(1)
}
const target = fileURLToPath(new URL('../src/server/lib/cxmlp-api.js', import.meta.url))
if (resolve(source) !== target) copyFileSync(source, target)
console.log('SDK installed locally (ignored by Git). Do not redistribute SDK-containing builds without permission.')
