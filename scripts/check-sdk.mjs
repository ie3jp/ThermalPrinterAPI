import { existsSync, mkdirSync, copyFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
const source = fileURLToPath(new URL('../src/server/lib/cxmlp-api.js', import.meta.url))
if (!existsSync(source)) {
  console.error('CITIZEN SDK is missing. Run pnpm sdk:install /path/to/cxmlp-api.js. See README.md.')
  process.exit(1)
}
if (process.argv.includes('--copy')) {
  const dir = fileURLToPath(new URL('../dist/server/lib/', import.meta.url))
  mkdirSync(dir, { recursive: true })
  copyFileSync(source, dir + '/cxmlp-api.js')
}
