/**
 * 同時リクエスト送信テスト
 * 5つの印刷リクエストを Promise.all で同時送信し、レスポンスの順序と結果を確認する
 *
 * 実行方法: node --experimental-strip-types test-concurrent.ts
 */

const BASE_URL = 'http://localhost:3000'

interface PrintRequest {
  commands: Array<{
    type: string
    data?: string
    alignment?: string
    percentage?: string
  }>
}

interface PrintResponse {
  success: boolean
  message?: string
  xml?: string
  error?: string
}

/**
 * 印刷リクエストを送信する
 */
async function sendPrintRequest(id: number): Promise<{ id: number; response: PrintResponse; elapsed: number }> {
  const startTime = performance.now()

  const request: PrintRequest = {
    commands: [
      {
        type: 'text',
        data: `=== Concurrent Test Request #${id} ===`,
        alignment: 'center',
      },
      {
        type: 'text',
        data: `Timestamp: ${new Date().toISOString()}`,
        alignment: 'left',
      },
      {
        type: 'text',
        data: `Request ID: ${id}`,
        alignment: 'left',
      },
      {
        type: 'feed',
        units: 30,
      } as any,
      {
        type: 'cut',
        percentage: 'partial',
      },
    ],
  }

  const res = await fetch(`${BASE_URL}/api/print`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  const data: PrintResponse = await res.json()
  const elapsed = performance.now() - startTime

  return { id, response: data, elapsed }
}

async function main() {
  console.log('=== Concurrent Request Test ===')
  console.log(`Target: ${BASE_URL}/api/export/xml`)
  console.log(`Sending 5 requests simultaneously...\n`)

  const overallStart = performance.now()

  // 5つのリクエストを同時送信
  const promises = [1, 2, 3, 4, 5].map((id) => sendPrintRequest(id))
  const results = await Promise.all(promises)

  const overallElapsed = performance.now() - overallStart

  // 結果表示
  console.log('--- Results (in completion order) ---\n')

  // 完了時間順にソート
  const sorted = [...results].sort((a, b) => a.elapsed - b.elapsed)

  for (const result of sorted) {
    const status = result.response.success ? 'OK' : 'FAIL'
    const xmlPreview = result.response.xml
      ? result.response.xml.substring(0, 80) + '...'
      : 'N/A'
    console.log(`  Request #${result.id}: [${status}] ${result.elapsed.toFixed(1)}ms`)
    if (!result.response.success) {
      console.log(`    Error: ${result.response.error || result.response.message}`)
    }
    console.log(`    XML preview: ${xmlPreview}`)
    console.log()
  }

  // サマリー
  console.log('--- Summary ---\n')
  const successCount = results.filter((r) => r.response.success).length
  const failCount = results.length - successCount
  const avgTime = results.reduce((sum, r) => sum + r.elapsed, 0) / results.length
  const maxTime = Math.max(...results.map((r) => r.elapsed))
  const minTime = Math.min(...results.map((r) => r.elapsed))

  console.log(`  Total requests:   5`)
  console.log(`  Success:          ${successCount}`)
  console.log(`  Failed:           ${failCount}`)
  console.log(`  Total elapsed:    ${overallElapsed.toFixed(1)}ms`)
  console.log(`  Avg per request:  ${avgTime.toFixed(1)}ms`)
  console.log(`  Min:              ${minTime.toFixed(1)}ms`)
  console.log(`  Max:              ${maxTime.toFixed(1)}ms`)
  console.log()

  // レスポンス順序確認
  console.log('--- Response Order ---\n')
  console.log(`  Send order:     ${results.map((r) => `#${r.id}`).join(', ')}`)
  console.log(`  Complete order:  ${sorted.map((r) => `#${r.id}`).join(', ')}`)
  console.log()

  // XMLにリクエストIDが正しく含まれているか確認
  console.log('--- Content Verification ---\n')
  for (const result of results) {
    const containsId = result.response.xml?.includes(`Concurrent Test Request #${result.id}`)
    console.log(`  Request #${result.id}: ID in XML = ${containsId ? 'YES' : 'NO'}`)
  }
  console.log()

  if (failCount > 0) {
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('Test failed:', err.message || err)
  process.exit(1)
})
