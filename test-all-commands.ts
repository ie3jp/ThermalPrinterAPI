/**
 * 全印刷コマンドパターンテスト
 * 各コマンドタイプを個別にAPIに送信し、エラーの有無を確認する
 *
 * 実行方法: node --experimental-strip-types test-all-commands.ts
 */

const BASE_URL = 'http://localhost:3000'

const testCommands: Array<{ name: string; commands: any[] }> = [
  {
    name: 'text (basic)',
    commands: [
      { type: 'text', data: 'Hello World', alignment: 'center' },
      { type: 'cut', percentage: 'partial' },
    ],
  },
  {
    name: 'text (attribute)',
    commands: [
      {
        type: 'text',
        data: 'Bold Underline',
        attribute: { bold: true, underline: true },
        textSize: { width: 2, height: 2 },
      },
      { type: 'cut', percentage: 'partial' },
    ],
  },
  {
    name: 'paddingText',
    commands: [
      { type: 'paddingText', data: 'Padded', length: 20, side: 'Right' },
      { type: 'cut', percentage: 'partial' },
    ],
  },
  {
    name: 'qrcode',
    commands: [
      { type: 'qrcode', data: 'https://example.com', moduleSize: 4, ecLevel: 'M', alignment: 'center' },
      { type: 'cut', percentage: 'partial' },
    ],
  },
  {
    name: 'barcode (CODE128)',
    commands: [
      { type: 'barcode', data: '12345678', barcodeType: 'CODE128', height: 80, alignment: 'center' },
      { type: 'cut', percentage: 'partial' },
    ],
  },
  {
    name: 'barcode (EAN13)',
    commands: [
      { type: 'barcode', data: '4901234567890', barcodeType: 'EAN13', height: 80, alignment: 'center' },
      { type: 'cut', percentage: 'partial' },
    ],
  },
  {
    name: 'pdf417',
    commands: [
      { type: 'pdf417', data: 'PDF417 Test Data', moduleWidth: 2, stepHeight: 3, ecLevel: 'Level2', alignment: 'center' },
      { type: 'cut', percentage: 'partial' },
    ],
  },
  {
    name: 'gs1DataBarStacked',
    commands: [
      { type: 'gs1DataBarStacked', data: '0123456789012', symbology: 'Stacked', moduleSize: 2, alignment: 'center' },
      { type: 'cut', percentage: 'partial' },
    ],
  },
  {
    name: 'feed',
    commands: [
      { type: 'text', data: 'Before feed' },
      { type: 'feed', units: 50 },
      { type: 'text', data: 'After feed' },
      { type: 'cut', percentage: 'partial' },
    ],
  },
  {
    name: 'cut (full)',
    commands: [
      { type: 'text', data: 'Full cut test' },
      { type: 'cut', percentage: 'full' },
    ],
  },
  {
    name: 'cut (partialPrefeed)',
    commands: [
      { type: 'text', data: 'PartialPrefeed cut' },
      { type: 'cut', percentage: 'partialPrefeed' },
    ],
  },
  {
    name: 'markFeed',
    commands: [
      { type: 'markFeed', feedType: 'Cutter' },
      { type: 'cut', percentage: 'partial' },
    ],
  },
  {
    name: 'pageModePrint',
    commands: [
      { type: 'pageModePrint', control: 'PageMode' },
      { type: 'setPageModePrintArea', x: 0, y: 0, width: 576, height: 200 },
      { type: 'setPageModePrintDirection', direction: 'LeftToRight' },
      { type: 'setPageModeHPos', position: 10 },
      { type: 'setPageModeVPos', position: 10 },
      { type: 'text', data: 'Page Mode Text' },
      { type: 'pageModePrint', control: 'Normal' },
      { type: 'cut', percentage: 'partial' },
    ],
  },
  {
    name: 'clearPrintArea',
    commands: [
      { type: 'clearPrintArea' },
      { type: 'text', data: 'After clear' },
      { type: 'cut', percentage: 'partial' },
    ],
  },
  {
    name: 'setEncoding',
    commands: [
      { type: 'setEncoding', encoding: 'UTF-8' },
      { type: 'text', data: 'エンコーディングテスト' },
      { type: 'cut', percentage: 'partial' },
    ],
  },
  {
    name: 'setCodePage',
    commands: [
      { type: 'setCodePage', codePage: 0 },
      { type: 'text', data: 'CodePage test' },
      { type: 'cut', percentage: 'partial' },
    ],
  },
  {
    name: 'setCharacterset',
    commands: [
      { type: 'setCharacterset', characterset: 0 },
      { type: 'text', data: 'Charset test' },
      { type: 'cut', percentage: 'partial' },
    ],
  },
  {
    name: 'setLineSpacing',
    commands: [
      { type: 'setLineSpacing', spacing: 40 },
      { type: 'text', data: 'Line spacing test' },
      { type: 'cut', percentage: 'partial' },
    ],
  },
  {
    name: 'setMapMode',
    commands: [
      { type: 'setMapMode', mapMode: 'Dots' },
      { type: 'text', data: 'MapMode test' },
      { type: 'cut', percentage: 'partial' },
    ],
  },
  {
    name: 'openDrawer',
    commands: [
      { type: 'openDrawer', drawer: 'Drawer1', pulseLength: 200 },
      { type: 'cut', percentage: 'partial' },
    ],
  },
  {
    name: 'rotatePrint',
    commands: [
      { type: 'rotatePrint', rotation: 'Rotate180' },
      { type: 'text', data: 'Rotated' },
      { type: 'rotatePrint', rotation: 'Normal' },
      { type: 'cut', percentage: 'partial' },
    ],
  },
  {
    name: 'clearOutput',
    commands: [
      { type: 'clearOutput' },
      { type: 'text', data: 'After clearOutput' },
      { type: 'cut', percentage: 'partial' },
    ],
  },
  {
    name: 'image (small PNG base64)',
    commands: [
      {
        type: 'image',
        // 1x1 white PNG
        data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
        width: 100,
        alignment: 'center',
        mode: 'mono',
      },
      { type: 'cut', percentage: 'partial' },
    ],
  },
  {
    name: 'raw',
    commands: [
      {
        type: 'raw',
        xml: '<PrintText><Data>Raw XML test</Data><Alignment>Center</Alignment><Attribute>0</Attribute><TextSize>0</TextSize></PrintText>',
      },
      { type: 'cut', percentage: 'partial' },
    ],
  },
]

async function testCommand(test: { name: string; commands: any[] }): Promise<{
  name: string
  success: boolean
  error?: string
  elapsed: number
}> {
  const start = performance.now()
  try {
    const res = await fetch(`${BASE_URL}/api/export/xml`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commands: test.commands }),
    })
    const data = await res.json() as any
    const elapsed = performance.now() - start
    if (!data.success) {
      return { name: test.name, success: false, error: data.error || data.message, elapsed }
    }
    return { name: test.name, success: true, elapsed }
  } catch (err: any) {
    return { name: test.name, success: false, error: err.message, elapsed: performance.now() - start }
  }
}

async function main() {
  console.log('=== All Command Types Test ===')
  console.log(`Target: ${BASE_URL}/api/export/xml`)
  console.log(`Testing ${testCommands.length} command patterns...\n`)

  const results = []
  for (const test of testCommands) {
    const result = await testCommand(test)
    const status = result.success ? 'OK' : 'FAIL'
    const icon = result.success ? '  ' : '>>'
    console.log(`${icon} [${status}] ${result.name}${result.error ? ` - ${result.error}` : ''}`)
    results.push(result)
  }

  const passed = results.filter((r) => r.success).length
  const failed = results.filter((r) => !r.success).length

  console.log(`\n--- Summary ---`)
  console.log(`  Passed: ${passed}/${results.length}`)
  console.log(`  Failed: ${failed}/${results.length}`)

  if (failed > 0) {
    console.log(`\n--- Failed Commands ---`)
    for (const r of results.filter((r) => !r.success)) {
      console.log(`  ${r.name}: ${r.error}`)
    }
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('Test failed:', err.message || err)
  process.exit(1)
})
