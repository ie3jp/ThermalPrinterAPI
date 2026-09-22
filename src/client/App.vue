<script setup lang="ts">
import { ref, computed, nextTick, type Component } from 'vue'
import {
  Type, WrapText, Image, QrCode, Barcode, ScanBarcode, Scissors,
  ArrowDown, Target, LayoutGrid, SquareDashedBottom, RotateCw,
  MoveHorizontal, MoveVertical, Eraser, FileCode, FileText, Languages,
  AlignVerticalSpaceBetween, Ruler, Archive, Hash, RotateCcw, Trash2, Code,
  GripVertical, ChevronUp, ChevronDown, Copy, X,
  AlignLeft, AlignCenter, AlignRight, Info
} from 'lucide-vue-next'

const ICON_MAP: Record<string, Component> = {
  Type, WrapText, Image, QrCode, Barcode, ScanBarcode, Scissors,
  ArrowDown, Target, LayoutGrid, SquareDashedBottom, RotateCw,
  MoveHorizontal, MoveVertical, Eraser, FileCode, FileText, Languages,
  AlignVerticalSpaceBetween, Ruler, Archive, Hash, RotateCcw, Trash2, Code
}

// --- 型定義 ---
type Alignment = 'left' | 'center' | 'right'
type ImageMode = 'mono' | 'gray'
type QRCodeECLevel = 'L' | 'M' | 'Q' | 'H'
type CutPercentage = 'full' | 'partial' | 'fullPrefeed' | 'partialPrefeed'

type CommandType =
  | 'text' | 'paddingText'
  | 'image' | 'qrcode' | 'barcode' | 'pdf417' | 'gs1DataBarStacked'
  | 'cut' | 'feed' | 'markFeed'
  | 'pageModePrint' | 'setPageModePrintArea' | 'setPageModePrintDirection' | 'setPageModeHPos' | 'setPageModeVPos' | 'clearPrintArea'
  | 'setEncoding' | 'setCodePage' | 'setCharacterset' | 'setLineSpacing' | 'setMapMode'
  | 'openDrawer' | 'messageId' | 'rotatePrint' | 'clearOutput' | 'raw'

interface CommandMeta { label: string; icon: string; category: string; desc: string }

const COMMAND_META: Record<CommandType, CommandMeta> = {
  text: { label: 'テキスト', icon: 'Type', category: 'text', desc: 'テキストを印刷（配置・サイズ・装飾指定可）' },
  paddingText: { label: 'パディングテキスト', icon: 'WrapText', category: 'text', desc: '固定幅でパディング付きテキストを印刷' },
  image: { label: '画像', icon: 'Image', category: 'graphics', desc: 'Base64画像を印刷（モノクロ/グレースケール）' },
  qrcode: { label: 'QRコード', icon: 'QrCode', category: 'graphics', desc: 'QRコードを生成して印刷' },
  barcode: { label: 'バーコード', icon: 'Barcode', category: 'graphics', desc: '1Dバーコード（Code128等）を印刷' },
  pdf417: { label: 'PDF417', icon: 'ScanBarcode', category: 'graphics', desc: 'PDF417 2Dバーコードを印刷' },
  gs1DataBarStacked: { label: 'GS1 DataBar', icon: 'ScanBarcode', category: 'graphics', desc: 'GS1 DataBar Stacked系バーコードを印刷' },
  cut: { label: 'カット', icon: 'Scissors', category: 'paper', desc: '用紙をカット（フル/パーシャル）' },
  feed: { label: '紙送り', icon: 'ArrowDown', category: 'paper', desc: '指定ドット数だけ紙送り' },
  markFeed: { label: 'マーク送り', icon: 'Target', category: 'paper', desc: 'マーク位置まで紙送り' },
  pageModePrint: { label: 'ページモード', icon: 'LayoutGrid', category: 'pagemode', desc: 'ページモードの開始/終了/キャンセル' },
  setPageModePrintArea: { label: '印刷エリア', icon: 'SquareDashedBottom', category: 'pagemode', desc: 'ページモードの印刷領域を設定' },
  setPageModePrintDirection: { label: '印刷方向', icon: 'RotateCw', category: 'pagemode', desc: 'ページモードの印刷方向を設定' },
  setPageModeHPos: { label: '水平位置', icon: 'MoveHorizontal', category: 'pagemode', desc: 'ページモードの水平オフセットを設定' },
  setPageModeVPos: { label: '垂直位置', icon: 'MoveVertical', category: 'pagemode', desc: 'ページモードの垂直オフセットを設定' },
  clearPrintArea: { label: 'エリアクリア', icon: 'Eraser', category: 'pagemode', desc: 'ページモードの印刷エリアをクリア' },
  setEncoding: { label: 'エンコーディング', icon: 'FileCode', category: 'settings', desc: '文字エンコーディングを変更（UTF-8/Japanese等）' },
  setCodePage: { label: 'コードページ', icon: 'FileText', category: 'settings', desc: 'シングルバイト文字のコードページを設定' },
  setCharacterset: { label: '文字セット', icon: 'Languages', category: 'settings', desc: '国際文字セットを設定' },
  setLineSpacing: { label: '行間', icon: 'AlignVerticalSpaceBetween', category: 'settings', desc: '行間隔をドット単位で設定' },
  setMapMode: { label: '単位系', icon: 'Ruler', category: 'settings', desc: '座標単位系を設定（Dots/Twips/English/Metric）' },
  openDrawer: { label: 'ドロワー', icon: 'Archive', category: 'other', desc: 'キャッシュドロワーを開く' },
  messageId: { label: 'メッセージID', icon: 'Hash', category: 'other', desc: 'メッセージIDを設定（トラッキング用）' },
  rotatePrint: { label: '回転印刷', icon: 'RotateCcw', category: 'other', desc: '印刷方向を180度回転' },
  clearOutput: { label: 'バッファクリア', icon: 'Trash2', category: 'other', desc: '出力バッファをクリア' },
  raw: { label: 'Raw XML', icon: 'Code', category: 'other', desc: '生XMLを直接挿入' },
}

const CATEGORIES = [
  { id: 'text', label: 'テキスト' },
  { id: 'graphics', label: 'グラフィック' },
  { id: 'paper', label: '用紙制御' },
  { id: 'pagemode', label: 'ページモード' },
  { id: 'settings', label: '設定' },
  { id: 'other', label: 'その他' },
]

// StackItem: 全コマンドのデータを内包
interface StackItem {
  id: string
  type: CommandType
  // 各コマンド用データ
  data: Record<string, unknown>
}

interface SavedTemplate {
  name: string
  createdAt: string
  stack: StackItem[]
}

// --- デフォルト値 ---
function getDefaultData(type: CommandType): Record<string, unknown> {
  switch (type) {
    case 'text': return { data: '', alignment: 'left', attribute: { fontB: false, fontC: false, bold: false, reverse: false, underline: false }, textSize: { width: 1, height: 1 }, encoding: 'Japanese', newline: true }
    case 'paddingText': return { data: '', attribute: { fontB: false, fontC: false, bold: false, reverse: false, underline: false }, textSize: { width: 1, height: 1 }, length: 20, side: 'Right' }
    case 'image': return { data: '', preview: '', processedPreview: '', alignment: 'center', mode: 'mono', width: 576 }
    case 'qrcode': return { data: '', moduleSize: 4, ecLevel: 'M', alignment: 'center' }
    case 'barcode': return { data: '', barcodeType: 'CODE128', height: 50, width: 2, alignment: 'center', hriPosition: 'below' }
    case 'pdf417': return { data: '', digits: 1, steps: 3, moduleWidth: 3, stepHeight: 3, ecLevel: 'Level2', alignment: 'center' }
    case 'gs1DataBarStacked': return { data: '', symbology: 'Stacked', moduleSize: 4, maxSize: 300, alignment: 'center' }
    case 'cut': return { percentage: 'partialPrefeed' }
    case 'feed': return { units: 34, unitType: 'Dots' }
    case 'markFeed': return { feedType: 'Cutter' }
    case 'pageModePrint': return { control: 'PageMode' }
    case 'setPageModePrintArea': return { x: 0, y: 0, width: 300, height: 300 }
    case 'setPageModePrintDirection': return { direction: 'LeftToRight' }
    case 'setPageModeHPos': return { position: 0 }
    case 'setPageModeVPos': return { position: 0 }
    case 'clearPrintArea': return {}
    case 'setEncoding': return { encoding: 'UTF-8' }
    case 'setCodePage': return { codePage: 1 }
    case 'setCharacterset': return { characterset: 8 }
    case 'setLineSpacing': return { spacing: 34 }
    case 'setMapMode': return { mapMode: 'Dots' }
    case 'openDrawer': return { drawer: 'Drawer1', pulseLength: 1 }
    case 'messageId': return { messageId: '' }
    case 'rotatePrint': return { rotation: 'Rotate180', barcode: true, bitmap: true }
    case 'clearOutput': return {}
    case 'raw': return { xml: '' }
  }
}

// --- 状態管理 ---
const printerUrl = ref<string>('')
const stack = ref<StackItem[]>([])
const status = ref<string>('未接続')
const result = ref<string>('')
const xmlPreview = ref<string>('')
const jsonPreview = ref<string>('')
const maxmspPreview = ref<string>('')
const previewTab = ref<'xml' | 'json' | 'maxmsp'>('xml')
const isLoading = ref(false)
const showXmlModal = ref(false)
const showTemplateModal = ref(false)
const templateName = ref('')
const savedTemplates = ref<SavedTemplate[]>(loadTemplatesFromStorage())
const dragIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)
const showErrorModal = ref(false)
const errorMessage = ref('')

function showError(title: string, err: unknown, responseText?: string) {
  let msg = `【${title}】\n\n`
  if (responseText) {
    msg += `サーバーからの応答がJSONではありません。\nAPIサーバーが起動していない可能性があります。\n\n応答内容（先頭200文字）:\n${responseText.slice(0, 200)}\n\n`
  }
  if (err instanceof TypeError && (err.message.includes('fetch') || err.message.includes('network'))) {
    msg += `ネットワークエラー: サーバーに接続できません。\npnpm dev でサーバーとクライアントを同時に起動してください。`
  } else if (err instanceof SyntaxError) {
    msg += `JSONパースエラー: ${err.message}\nAPIサーバーが正しく応答していません。`
  } else {
    msg += `${err}`
  }
  errorMessage.value = msg
  showErrorModal.value = true
}

// --- ユーティリティ ---
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

// --- コマンド追加 ---
function addCommand(type: CommandType) {
  const item: StackItem = {
    id: generateId(),
    type,
    data: getDefaultData(type),
  }
  stack.value.push(item)
  nextTick(() => {
    const el = document.getElementById(`cmd-${item.id}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  })
}

// --- フォント排他選択 ---
function setFont(item: StackItem, font: 'A' | 'B' | 'C') {
  const attr = item.data.attribute as Record<string, boolean>
  attr.fontB = font === 'B'
  attr.fontC = font === 'C'
}

// --- スタック操作 ---
function removeCommand(index: number) { stack.value.splice(index, 1) }
function moveUp(index: number) {
  if (index <= 0) return
  const items = stack.value;
  [items[index - 1], items[index]] = [items[index], items[index - 1]]
}
function moveDown(index: number) {
  if (index >= stack.value.length - 1) return
  const items = stack.value;
  [items[index], items[index + 1]] = [items[index + 1], items[index]]
}
function clearStack() { stack.value = []; result.value = '' }
function duplicateCommand(index: number) {
  const clone: StackItem = JSON.parse(JSON.stringify(stack.value[index]))
  clone.id = generateId()
  stack.value.splice(index + 1, 0, clone)
}

// --- ドラッグ&ドロップ ---
function onDragStart(index: number) { dragIndex.value = index }
function onDragOver(event: DragEvent, index: number) { event.preventDefault(); dragOverIndex.value = index }
function onDragLeave() { dragOverIndex.value = null }
function onDrop(index: number) {
  if (dragIndex.value === null || dragIndex.value === index) { dragIndex.value = null; dragOverIndex.value = null; return }
  const items = stack.value
  const [moved] = items.splice(dragIndex.value, 1)
  items.splice(index > dragIndex.value ? index - 1 : index, 0, moved)
  dragIndex.value = null; dragOverIndex.value = null
}
function onDragEnd() { dragIndex.value = null; dragOverIndex.value = null }

// --- 画像処理 ---
function processImagePreview(item: StackItem) {
  const d = item.data as Record<string, unknown>
  if (!d.data) return
  const img = new Image()
  img.onload = () => {
    const canvas = document.createElement('canvas')
    const targetWidth = d.width === 'asis' ? img.width : Number(d.width)
    const scale = targetWidth / img.width
    canvas.width = targetWidth
    canvas.height = Math.round(img.height * scale)
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const pixels = imageData.data
    if (d.mode === 'gray') {
      for (let i = 0; i < pixels.length; i += 4) {
        const gray = Math.round(pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114)
        const quantized = Math.round(gray / 17) * 17
        pixels[i] = pixels[i + 1] = pixels[i + 2] = quantized
      }
    } else {
      const width = canvas.width, height = canvas.height
      const grayArr = new Float32Array(width * height)
      for (let i = 0; i < grayArr.length; i++) {
        grayArr[i] = pixels[i * 4] * 0.299 + pixels[i * 4 + 1] * 0.587 + pixels[i * 4 + 2] * 0.114
      }
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = y * width + x
          const oldVal = grayArr[idx]
          const newVal = oldVal < 128 ? 0 : 255
          grayArr[idx] = newVal
          const err = oldVal - newVal
          if (x + 1 < width) grayArr[idx + 1] += err * 7 / 16
          if (y + 1 < height) {
            if (x > 0) grayArr[(y + 1) * width + x - 1] += err * 3 / 16
            grayArr[(y + 1) * width + x] += err * 5 / 16
            if (x + 1 < width) grayArr[(y + 1) * width + x + 1] += err * 1 / 16
          }
        }
      }
      for (let i = 0; i < grayArr.length; i++) {
        const v = grayArr[i] < 128 ? 0 : 255
        pixels[i * 4] = pixels[i * 4 + 1] = pixels[i * 4 + 2] = v
      }
    }
    ctx.putImageData(imageData, 0, 0)
    d.processedPreview = canvas.toDataURL('image/png')
  }
  img.src = d.data as string
}

function onImageSelect(event: Event, item: StackItem) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    const dataUrl = e.target?.result as string
    item.data.data = dataUrl
    item.data.preview = dataUrl
    processImagePreview(item)
  }
  reader.readAsDataURL(file)
}

function clearImage(item: StackItem) {
  item.data.data = ''
  item.data.preview = ''
  item.data.processedPreview = ''
}

function onImageSettingChange(item: StackItem) {
  if (item.data.data) {
    item.data.processedPreview = ''
    processImagePreview(item)
  }
}

// --- テンプレート ---
const TEMPLATES_KEY = 'cts255-templates'
function loadTemplatesFromStorage(): SavedTemplate[] {
  try { const raw = localStorage.getItem(TEMPLATES_KEY); return raw ? JSON.parse(raw) : [] } catch { return [] }
}
function persistTemplates() { localStorage.setItem(TEMPLATES_KEY, JSON.stringify(savedTemplates.value)) }
function saveTemplate() {
  const name = templateName.value.trim()
  if (!name) return
  const template: SavedTemplate = { name, createdAt: new Date().toISOString(), stack: JSON.parse(JSON.stringify(stack.value)) }
  template.stack.forEach(item => { if (item.type === 'image') item.data.processedPreview = '' })
  savedTemplates.value.push(template)
  persistTemplates()
  templateName.value = ''
}
function loadTemplate(index: number) {
  const tpl = savedTemplates.value[index]
  if (!tpl) return
  stack.value = JSON.parse(JSON.stringify(tpl.stack))
  stack.value.forEach(item => { if (item.type === 'image' && item.data.data) processImagePreview(item) })
  showTemplateModal.value = false
}
function deleteTemplate(index: number) { savedTemplates.value.splice(index, 1); persistTemplates() }
function exportTemplatesJson() {
  const blob = new Blob([JSON.stringify(savedTemplates.value, null, 2)], { type: 'application/json' })
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `cts255-templates-${Date.now()}.json`; a.click()
}
function importTemplatesJson(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => { try { const imported = JSON.parse(e.target?.result as string); if (Array.isArray(imported)) { savedTemplates.value.push(...imported); persistTemplates() } } catch { alert('JSONファイルの読み込みに失敗しました') } }
  reader.readAsText(file);
  (event.target as HTMLInputElement).value = ''
}
function exportCurrentAsJson() {
  const blob = new Blob([JSON.stringify({ name: 'export', createdAt: new Date().toISOString(), stack: stack.value }, null, 2)], { type: 'application/json' })
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `cts255-current-${Date.now()}.json`; a.click()
}

// --- API ---
function buildApiCommands() {
  const commands: unknown[] = []
  for (const item of stack.value) {
    const d = item.data
    const cmd = buildSingleCommand(item)
    if (cmd === null) continue
    // 紙送りで単位がDots以外の場合、setMapModeを自動挿入
    if (item.type === 'feed' && d.unitType && d.unitType !== 'Dots') {
      commands.push({ type: 'setMapMode', mapMode: d.unitType })
    }
    if (Array.isArray(cmd)) commands.push(...cmd)
    else commands.push(cmd)
    // 紙送り後に単位をDotsに戻す
    if (item.type === 'feed' && d.unitType && d.unitType !== 'Dots') {
      commands.push({ type: 'setMapMode', mapMode: 'Dots' })
    }
  }
  return commands
}

function buildSingleCommand(item: StackItem) {
    const d = item.data
    switch (item.type) {
      case 'text': {
        if (!d.data) return null
        const cmds: unknown[] = []
        if (d.encoding) cmds.push({ type: 'setEncoding', encoding: d.encoding })
        const textData = d.newline ? (d.data as string) + '\n' : d.data
        cmds.push({ type: 'text', data: textData, alignment: d.alignment, attribute: d.attribute, textSize: d.textSize })
        return cmds.length === 1 ? cmds[0] : cmds
      }
      case 'paddingText':
        if (!d.data) return null
        return { type: 'paddingText', data: d.data, attribute: d.attribute, textSize: d.textSize, length: d.length, side: d.side }
      case 'image':
        if (!d.data) return null
        return { type: 'image', data: d.data, alignment: d.alignment, mode: d.mode, width: d.width }
      case 'qrcode':
        if (!d.data) return null
        return { type: 'qrcode', data: d.data, moduleSize: d.moduleSize, ecLevel: d.ecLevel, alignment: d.alignment }
      case 'barcode':
        if (!d.data) return null
        return { type: 'barcode', data: d.data, barcodeType: d.barcodeType, height: d.height, width: d.width, alignment: d.alignment, hriPosition: d.hriPosition }
      case 'pdf417':
        if (!d.data) return null
        return { type: 'pdf417', data: d.data, digits: d.digits, steps: d.steps, moduleWidth: d.moduleWidth, stepHeight: d.stepHeight, ecLevel: d.ecLevel, alignment: d.alignment }
      case 'gs1DataBarStacked':
        if (!d.data) return null
        return { type: 'gs1DataBarStacked', data: d.data, symbology: d.symbology, moduleSize: d.moduleSize, maxSize: d.maxSize, alignment: d.alignment }
      case 'cut': return { type: 'cut', percentage: d.percentage }
      case 'feed': return { type: 'feed', units: d.units }
      case 'markFeed': return { type: 'markFeed', feedType: d.feedType }
      case 'pageModePrint': return { type: 'pageModePrint', control: d.control }
      case 'setPageModePrintArea': return { type: 'setPageModePrintArea', x: d.x, y: d.y, width: d.width, height: d.height }
      case 'setPageModePrintDirection': return { type: 'setPageModePrintDirection', direction: d.direction }
      case 'setPageModeHPos': return { type: 'setPageModeHPos', position: d.position }
      case 'setPageModeVPos': return { type: 'setPageModeVPos', position: d.position }
      case 'clearPrintArea': return { type: 'clearPrintArea' }
      case 'setEncoding': return { type: 'setEncoding', encoding: d.encoding }
      case 'setCodePage': return { type: 'setCodePage', codePage: d.codePage }
      case 'setCharacterset': return { type: 'setCharacterset', characterset: d.characterset }
      case 'setLineSpacing': return { type: 'setLineSpacing', spacing: d.spacing }
      case 'setMapMode': return { type: 'setMapMode', mapMode: d.mapMode }
      case 'openDrawer': return { type: 'openDrawer', drawer: d.drawer, pulseLength: d.pulseLength }
      case 'messageId':
        if (!d.messageId) return null
        return { type: 'messageId', messageId: d.messageId }
      case 'rotatePrint': return { type: 'rotatePrint', rotation: d.rotation, barcode: d.barcode, bitmap: d.bitmap }
      case 'clearOutput': return { type: 'clearOutput' }
      case 'raw':
        if (!d.xml) return null
        return { type: 'raw', xml: d.xml }
      default: return null
    }
}

async function checkStatus() {
  try {
    const url = printerUrl.value ? `/api/status?printerUrl=${encodeURIComponent(printerUrl.value)}` : '/api/status'
    const res = await fetch(url)
    const text = await res.text()
    let data: any
    try { data = JSON.parse(text) } catch (e) { showError('ステータス確認', e, text); status.value = 'エラー'; return }
    status.value = data.connected ? '接続中' : '未接続'
    if (data.error) status.value += ` (${data.error})`
  } catch (err) { showError('ステータス確認', err); status.value = 'エラー' }
}

async function print() {
  const commands = buildApiCommands()
  if (commands.length === 0) { result.value = '有効なコマンドがありません'; return }
  isLoading.value = true
  try {
    const payload: Record<string, unknown> = { commands }
    if (printerUrl.value) payload.printerUrl = printerUrl.value
    const res = await fetch('/api/print', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const text = await res.text()
    let data: any
    try { data = JSON.parse(text) } catch (e) { showError('印刷実行', e, text); result.value = 'エラー（詳細はダイアログ参照）'; return }
    result.value = JSON.stringify(data, null, 2)
  } catch (err) { showError('印刷実行', err); result.value = 'エラー（詳細はダイアログ参照）' } finally { isLoading.value = false }
}

async function getXmlPreview() {
  const commands = buildApiCommands()
  if (commands.length === 0) { xmlPreview.value = '有効なコマンドがありません'; jsonPreview.value = '[]'; maxmspPreview.value = ''; showXmlModal.value = true; return }
  try {
    const payload: Record<string, unknown> = { commands }
    if (printerUrl.value) payload.printerUrl = printerUrl.value
    jsonPreview.value = JSON.stringify(commands, null, 2)
    maxmspPreview.value = generateMaxMspCode(commands as Record<string, unknown>[])
    const res = await fetch('/api/export/xml', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const text = await res.text()
    let resData: any
    try { resData = JSON.parse(text) } catch (e) { showError('XMLプレビュー', e, text); return }
    xmlPreview.value = resData.xml || 'XML生成エラー'
    showXmlModal.value = true
  } catch (err) { showError('XMLプレビュー', err) }
}

function copyPreviewToClipboard() {
  const content = previewTab.value === 'xml' ? xmlPreview.value : previewTab.value === 'json' ? jsonPreview.value : maxmspPreview.value
  navigator.clipboard.writeText(content)
}

/**
 * Max/MSP用のOSCコード生成
 * コマンド配列からMax/MSPで使えるオブジェクト記述を生成
 */
function generateMaxMspCode(commands: Record<string, unknown>[]): string {
  const lines: string[] = [
    '/* Max/MSP OSC Print Commands */',
    '/* udpsend オブジェクトを localhost 9000 に接続してください */',
    '',
    '----------',
    '| udpsend 127.0.0.1 9000 |',
    '----------',
    '',
  ]

  for (const cmd of commands) {
    const type = cmd.type as string
    let oscLine = ''

    switch (type) {
      case 'text': {
        const data = (cmd.data as string || '').replace(/"/g, '\\"')
        const alignment = cmd.alignment || 'left'
        const attr = cmd.attribute as Record<string, boolean> | undefined
        let attrBits = 0
        if (attr) {
          if (attr.fontB) attrBits |= 0x01
          if (attr.fontC) attrBits |= 0x02
          if (attr.bold) attrBits |= 0x08
          if (attr.reverse) attrBits |= 0x40
          if (attr.underline) attrBits |= 0x80
        }
        const size = cmd.textSize as { width?: number; height?: number } | undefined
        const w = size?.width || 1
        const h = size?.height || 1
        oscLine = `/print/text "${data}" ${alignment} ${attrBits} ${w} ${h}`
        break
      }
      case 'image': {
        const data = (cmd.data as string || '').substring(0, 50) + '...'
        const width = cmd.width || 576
        const alignment = cmd.alignment || 'center'
        const mode = cmd.mode || 'mono'
        oscLine = `/print/image [base64data] ${width} ${alignment} ${mode}`
        lines.push('/* 画像はBase64データが長いため省略 */')
        break
      }
      case 'qrcode': {
        const data = (cmd.data as string || '').replace(/"/g, '\\"')
        const moduleSize = cmd.moduleSize || 4
        const ecLevel = cmd.ecLevel || 'M'
        const alignment = cmd.alignment || 'center'
        oscLine = `/print/qrcode "${data}" ${moduleSize} ${ecLevel} ${alignment}`
        break
      }
      case 'barcode': {
        const data = (cmd.data as string || '').replace(/"/g, '\\"')
        const barcodeType = cmd.barcodeType || 'CODE128'
        const height = cmd.height || 50
        const width = cmd.width || 2
        const alignment = cmd.alignment || 'center'
        const hriPosition = cmd.hriPosition || 'below'
        oscLine = `/print/barcode "${data}" ${barcodeType} ${height} ${width} ${alignment} ${hriPosition}`
        break
      }
      case 'cut': {
        const percentage = cmd.percentage || 'partialPrefeed'
        oscLine = `/print/cut ${percentage}`
        break
      }
      case 'feed': {
        const units = cmd.units || 1
        oscLine = `/print/feed ${units}`
        break
      }
      case 'openDrawer': {
        const drawer = cmd.drawer || 'Drawer1'
        const pulseLength = cmd.pulseLength || 1
        oscLine = `/print/drawer ${drawer} ${pulseLength}`
        break
      }
      default:
        oscLine = `/* ${type}: /print/json で送信してください */`
    }

    if (oscLine) {
      lines.push(`| ${oscLine} |`)
    }
  }

  lines.push('')
  lines.push('----------')
  lines.push('/* 複合コマンドを一括送信する場合: */')
  lines.push(`| /print/json ${JSON.stringify(JSON.stringify(commands))} |`)
  lines.push('----------')

  return lines.join('\n')
}

// --- プレビュー ---
// paddingTextはfloatで配置し、隣接するtextもfloatさせて同一行に並べる
const previewItems = computed(() => {
  const items = stack.value.map(item => {
    const d = item.data
    switch (item.type) {
      case 'text': return { type: 'text' as const, data: d.data as string, alignment: (d.alignment as string) || 'left', bold: (d.attribute as any)?.bold, underline: (d.attribute as any)?.underline, reverse: (d.attribute as any)?.reverse, widthScale: (d.textSize as any)?.width || 1, heightScale: (d.textSize as any)?.height || 1, adjacentPadding: false }
      case 'paddingText': return { type: 'paddingText' as const, data: d.data as string || '', side: (d.side as string) || 'Right', bold: (d.attribute as any)?.bold, underline: (d.attribute as any)?.underline, reverse: (d.attribute as any)?.reverse, widthScale: (d.textSize as any)?.width || 1, heightScale: (d.textSize as any)?.height || 1 }
      case 'image': return { type: 'image' as const, preview: (d.processedPreview || d.preview || '') as string, alignment: (d.alignment as string) || 'left' }
      case 'qrcode': return { type: 'qrcode' as const, data: d.data as string, alignment: (d.alignment as string) || 'left' }
      case 'barcode': return { type: 'barcode' as const, data: d.data as string, alignment: (d.alignment as string) || 'left' }
      case 'pdf417': return { type: 'pdf417' as const, data: d.data as string, alignment: (d.alignment as string) || 'left' }
      case 'gs1DataBarStacked': return { type: 'gs1DataBar' as const, data: d.data as string, alignment: (d.alignment as string) || 'left' }
      case 'cut': return { type: 'cut' as const }
      case 'feed': return { type: 'feed' as const, units: d.units as number }
      default: return { type: 'other' as const, label: COMMAND_META[item.type]?.label || item.type }
    }
  })
  // textの前後にpaddingTextがある場合、同じ行にfloatさせるフラグを立てる
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (item.type === 'text') {
      item.adjacentPadding = (i > 0 && items[i - 1].type === 'paddingText') ||
        (i < items.length - 1 && items[i + 1].type === 'paddingText')
    }
  }
  return items
})

function getPreviewTextStyle(item: any) {
  const styles: Record<string, string> = {}
  if (item.bold) styles.fontWeight = 'bold'
  if (item.underline) styles.textDecoration = 'underline'
  if (item.reverse) { styles.backgroundColor = '#000'; styles.color = '#fff'; styles.padding = '0 2px' }
  const w = item.widthScale || 1, h = item.heightScale || 1
  styles.display = 'inline-block'
  styles.transform = `scale(${w}, ${h})`
  styles.transformOrigin = 'left top'
  if (w > 1 || h > 1) {
    styles.marginRight = `${(w - 1) * 100}%`
    styles.marginBottom = `${(h - 1) * 0.75}rem`
  }
  return styles
}

function getAlignClass(a: string) { return a === 'center' ? 'text-center' : a === 'right' ? 'text-right' : 'text-left' }


function getCommandsByCategory(categoryId: string): CommandType[] {
  return (Object.entries(COMMAND_META) as [CommandType, CommandMeta][])
    .filter(([, meta]) => meta.category === categoryId)
    .map(([type]) => type)
}

const hasValidCommands = computed(() => buildApiCommands().length > 0)
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <!-- ヘッダー -->
    <header class="bg-white shadow-sm border-b sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <h1 class="text-lg font-bold text-gray-800">Citizen CTS255 印刷GUI</h1>
        <div class="flex items-center gap-3">
          <input v-model="printerUrl" type="text" placeholder="プリンタURL（空=デフォルト）" class="w-56 border rounded px-2 py-1.5 text-sm text-gray-700 placeholder-gray-400" />
          <span class="text-sm text-gray-600">
            <strong :class="status === '接続中' ? 'text-green-600' : 'text-gray-500'">{{ status }}</strong>
          </span>
          <button @click="checkStatus" class="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded border hover:bg-gray-200">確認</button>
        </div>
      </div>
    </header>

    <div class="max-w-7xl mx-auto px-4 py-6">
      <div class="flex gap-6">
        <!-- メインエリア -->
        <div class="flex-1 min-w-0">
          <!-- コマンドパレット -->
          <div class="bg-white rounded-lg shadow-sm border p-3 mb-4 space-y-2">
            <div v-for="cat in CATEGORIES" :key="cat.id">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-xs font-medium text-gray-400 w-20 shrink-0">{{ cat.label }}</span>
                <button
                  v-for="cmdType in getCommandsByCategory(cat.id)"
                  :key="cmdType"
                  @click="addCommand(cmdType)"
                  v-tooltip="COMMAND_META[cmdType].desc"
                  class="px-2 py-1 text-xs rounded border border-gray-200 bg-gray-50 text-gray-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors"
                >
                  <component :is="ICON_MAP[COMMAND_META[cmdType].icon]" :size="12" class="inline-block mr-0.5 align-[-2px]" />{{ COMMAND_META[cmdType].label }}
                </button>
              </div>
            </div>
          </div>

          <!-- コマンドスタック -->
          <div class="space-y-2 mb-4">
            <div v-if="stack.length === 0" class="bg-white rounded-lg shadow-sm border p-8 text-center text-gray-400">
              上のカテゴリからコマンドを追加してください
            </div>

            <div
              v-for="(item, index) in stack" :key="item.id" :id="`cmd-${item.id}`"
              class="bg-white rounded-lg shadow-sm border transition-all"
              :class="{ 'ring-2 ring-blue-300': dragOverIndex === index, 'opacity-50': dragIndex === index }"
              draggable="true"
              @dragstart="onDragStart(index)" @dragover="onDragOver($event, index)" @dragleave="onDragLeave" @drop="onDrop(index)" @dragend="onDragEnd"
            >
              <!-- ヘッダー -->
              <div class="flex items-center gap-2 px-3 py-2 select-none">
                <span class="text-gray-300 cursor-grab active:cursor-grabbing" title="ドラッグで並び替え"><GripVertical :size="14" /></span>
                <span class="text-xs text-gray-400 w-5 text-right">{{ index + 1 }}</span>
                <span class="text-sm font-medium text-gray-700 inline-flex items-center gap-1"><component :is="ICON_MAP[COMMAND_META[item.type].icon]" :size="14" />{{ COMMAND_META[item.type].label }}</span>
                <span class="flex-1"></span>
                <div class="flex items-center gap-1">
                  <button @click="moveUp(index)" :disabled="index === 0" class="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30" title="上"><ChevronUp :size="14" /></button>
                  <button @click="moveDown(index)" :disabled="index === stack.length - 1" class="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30" title="下"><ChevronDown :size="14" /></button>
                  <button @click="duplicateCommand(index)" class="p-1 text-gray-400 hover:text-blue-600" title="複製"><Copy :size="14" /></button>
                  <button @click="removeCommand(index)" class="p-1 text-gray-400 hover:text-red-600" title="削除"><X :size="14" /></button>
                </div>
              </div>

              <!-- 設定パネル -->
              <div class="px-4 pb-3 border-t pt-3">

                <!-- text -->
                <div v-if="item.type === 'text'" class="flex gap-4">
                  <div class="flex-1 min-w-0">
                    <textarea v-model="(item.data.data as string)" class="w-full border rounded p-2 text-sm" rows="3" placeholder="印刷するテキストを入力..."></textarea>
                  </div>
                  <div class="w-56 shrink-0 space-y-2">
                    <div>
                      <label class="block text-xs text-gray-500 mb-1">配置</label>
                      <div class="flex border rounded overflow-hidden">
                        <button @click="item.data.alignment = 'left'" :class="item.data.alignment === 'left' ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-600 hover:bg-gray-50'" class="flex-1 py-1 text-sm border-r flex items-center justify-center" title="左"><AlignLeft :size="14" /></button>
                        <button @click="item.data.alignment = 'center'" :class="item.data.alignment === 'center' ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-600 hover:bg-gray-50'" class="flex-1 py-1 text-sm border-r flex items-center justify-center" title="中央"><AlignCenter :size="14" /></button>
                        <button @click="item.data.alignment = 'right'" :class="item.data.alignment === 'right' ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-600 hover:bg-gray-50'" class="flex-1 py-1 text-sm flex items-center justify-center" title="右"><AlignRight :size="14" /></button>
                      </div>
                    </div>
                    <div>
                      <label class="block text-xs text-gray-500 mb-1">サイズ <span v-tooltip="'文字の拡大倍率。W=横倍率、H=縦倍率（1〜8倍）。プレビューにも反映されます。'"><Info :size="14" class="inline align-[-2px] text-gray-400 cursor-help" /></span></label>
                      <div class="flex gap-1 items-center"><select v-model.number="(item.data.textSize as any).width" class="flex-1 border rounded p-1 text-sm"><option v-for="n in 8" :key="n" :value="n">W{{n}}</option></select><span class="text-xs text-gray-400">&times;</span><select v-model.number="(item.data.textSize as any).height" class="flex-1 border rounded p-1 text-sm"><option v-for="n in 8" :key="n" :value="n">H{{n}}</option></select></div>
                    </div>
                    <div class="flex flex-wrap gap-x-3 gap-y-1">
                      <label class="flex items-center gap-1 text-xs"><input type="checkbox" v-model="(item.data.attribute as any).bold" class="rounded" />太字</label>
                      <label class="flex items-center gap-1 text-xs"><input type="checkbox" v-model="(item.data.attribute as any).underline" class="rounded" />下線</label>
                      <label class="flex items-center gap-1 text-xs"><input type="checkbox" v-model="(item.data.attribute as any).reverse" class="rounded" />反転</label>
                    </div>
                    <div>
                      <label class="block text-xs text-gray-500 mb-1">フォント</label>
                      <div class="flex border rounded overflow-hidden">
                        <button @click="setFont(item, 'A')" :class="!((item.data.attribute as any).fontB || (item.data.attribute as any).fontC) ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-600 hover:bg-gray-50'" class="flex-1 py-1 text-xs">A</button>
                        <button @click="setFont(item, 'B')" :class="(item.data.attribute as any).fontB ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-600 hover:bg-gray-50'" class="flex-1 py-1 text-xs border-l">B</button>
                        <button @click="setFont(item, 'C')" :class="(item.data.attribute as any).fontC ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-600 hover:bg-gray-50'" class="flex-1 py-1 text-xs border-l">C</button>
                      </div>
                    </div>
                    <div>
                      <label class="block text-xs text-gray-500 mb-1">エンコーディング</label>
                      <select v-model="(item.data.encoding as string)" class="w-full border rounded p-1 text-sm">
                        <option value="">指定なし</option>
                        <option value="UTF-8">UTF-8</option>
                        <option value="Japanese">Japanese</option>
                        <option value="SimplifiedChinese">SimplifiedChinese</option>
                        <option value="Korean">Korean</option>
                        <option value="TraditionalChinese">TraditionalChinese</option>
                        <option value="SingleByteCharacter">SingleByte</option>
                        <option value="None">None</option>
                      </select>
                    </div>
                    <label class="flex items-center gap-1 text-xs"><input type="checkbox" v-model="(item.data.newline as boolean)" class="rounded" />末尾に改行を追加</label>
                  </div>
                </div>

                <!-- paddingText -->
                <div v-if="item.type === 'paddingText'" class="flex gap-4">
                  <div class="flex-1 min-w-0">
                    <textarea v-model="(item.data.data as string)" class="w-full border rounded p-2 text-sm" rows="2" placeholder="テキスト..."></textarea>
                  </div>
                  <div class="w-64 shrink-0 space-y-2">
                    <div class="flex gap-2">
                      <div class="flex-1">
                        <label class="block text-xs text-gray-500 mb-1">パディング長 <span v-tooltip="'テキストの総文字数（半角換算）。テキストがこの長さになるまでスペースでパディングされます。'"><Info :size="14" class="inline align-[-2px] text-gray-400 cursor-help" /></span></label>
                        <input v-model.number="(item.data.length as number)" type="number" min="1" class="w-full border rounded p-1 text-sm" />
                      </div>
                      <div class="flex-1">
                        <label class="block text-xs text-gray-500 mb-1">寄せ方向</label>
                        <div class="flex border rounded overflow-hidden">
                          <button @click="item.data.side = 'Right'" :class="item.data.side === 'Right' ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-600 hover:bg-gray-50'" class="flex-1 py-1 text-sm flex items-center justify-center" v-tooltip="'テキストを右寄せ（左側をパディング）'"><AlignRight :size="14" /></button>
                          <button @click="item.data.side = 'Left'" :class="item.data.side === 'Left' ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-600 hover:bg-gray-50'" class="flex-1 py-1 text-sm border-l flex items-center justify-center" v-tooltip="'テキストを左寄せ（右側をパディング）'"><AlignLeft :size="14" /></button>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label class="block text-xs text-gray-500 mb-1">サイズ</label>
                      <div class="flex gap-1"><select v-model.number="(item.data.textSize as any).width" class="flex-1 border rounded p-1 text-sm"><option v-for="n in 8" :key="n" :value="n">W{{n}}</option></select><span class="text-xs text-gray-400">&times;</span><select v-model.number="(item.data.textSize as any).height" class="flex-1 border rounded p-1 text-sm"><option v-for="n in 8" :key="n" :value="n">H{{n}}</option></select></div>
                    </div>
                    <div class="flex flex-wrap gap-x-3 gap-y-1">
                      <label class="flex items-center gap-1 text-xs"><input type="checkbox" v-model="(item.data.attribute as any).bold" class="rounded" />太字</label>
                      <label class="flex items-center gap-1 text-xs"><input type="checkbox" v-model="(item.data.attribute as any).underline" class="rounded" />下線</label>
                      <label class="flex items-center gap-1 text-xs"><input type="checkbox" v-model="(item.data.attribute as any).reverse" class="rounded" />反転</label>
                    </div>
                    <div>
                      <label class="block text-xs text-gray-500 mb-1">フォント</label>
                      <div class="flex border rounded overflow-hidden">
                        <button @click="setFont(item, 'A')" :class="!((item.data.attribute as any).fontB || (item.data.attribute as any).fontC) ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-600 hover:bg-gray-50'" class="flex-1 py-1 text-xs">A</button>
                        <button @click="setFont(item, 'B')" :class="(item.data.attribute as any).fontB ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-600 hover:bg-gray-50'" class="flex-1 py-1 text-xs border-l">B</button>
                        <button @click="setFont(item, 'C')" :class="(item.data.attribute as any).fontC ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-600 hover:bg-gray-50'" class="flex-1 py-1 text-xs border-l">C</button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- image -->
                <div v-if="item.type === 'image'" class="flex gap-4">
                  <div class="flex-1 min-w-0 space-y-2">
                    <div class="flex gap-2">
                      <input type="file" accept="image/*" @change="onImageSelect($event, item)" class="flex-1 border rounded p-1.5 text-sm" />
                      <button v-if="item.data.data" @click="clearImage(item)" class="px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded border border-red-200 hover:bg-red-100">クリア</button>
                    </div>
                    <div v-if="item.data.preview" class="border rounded p-2 bg-gray-50">
                      <div class="flex gap-3 items-start">
                        <div class="text-center"><div class="text-xs text-gray-400 mb-1">元画像</div><img :src="(item.data.preview as string)" alt="Original" class="max-w-[120px] max-h-24 object-contain" /></div>
                        <div v-if="item.data.processedPreview" class="text-center"><div class="text-xs text-gray-400 mb-1">処理後</div><img :src="(item.data.processedPreview as string)" alt="Processed" class="max-w-[120px] max-h-24 object-contain" style="image-rendering: pixelated;" /></div>
                      </div>
                    </div>
                  </div>
                  <div class="w-40 shrink-0 space-y-2">
                    <div>
                      <label class="block text-xs text-gray-500 mb-1">配置</label>
                      <div class="flex border rounded overflow-hidden">
                        <button @click="item.data.alignment = 'left'" :class="item.data.alignment === 'left' ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-600 hover:bg-gray-50'" class="flex-1 py-1 text-sm border-r flex items-center justify-center" title="左"><AlignLeft :size="14" /></button>
                        <button @click="item.data.alignment = 'center'" :class="item.data.alignment === 'center' ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-600 hover:bg-gray-50'" class="flex-1 py-1 text-sm border-r flex items-center justify-center" title="中央"><AlignCenter :size="14" /></button>
                        <button @click="item.data.alignment = 'right'" :class="item.data.alignment === 'right' ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-600 hover:bg-gray-50'" class="flex-1 py-1 text-sm flex items-center justify-center" title="右"><AlignRight :size="14" /></button>
                      </div>
                    </div>
                    <div>
                      <label class="block text-xs text-gray-500 mb-1">モード <span v-tooltip="'モノクロ(1bpp): ディザリングで白黒2値に変換。文字やロゴに最適。\nグレースケール(4bpp): 16階調の濃淡表現。写真やグラデーションに適しています。'"><Info :size="14" class="inline align-[-2px] text-gray-400 cursor-help" /></span></label>
                      <select v-model="(item.data.mode as string)" @change="onImageSettingChange(item)" class="w-full border rounded p-1 text-sm"><option value="mono">モノクロ (1bpp)</option><option value="gray">グレースケール (4bpp)</option></select>
                    </div>
                    <div>
                      <label class="block text-xs text-gray-500 mb-1">幅 <span v-tooltip="'プリンタに送信する際の画像横幅（ドット単位）。用紙幅80mmの場合、最大576ドット。画像はこの幅にリサイズされます。'"><Info :size="14" class="inline align-[-2px] text-gray-400 cursor-help" /></span></label>
                      <select v-model="(item.data.width as any)" @change="onImageSettingChange(item)" class="w-full border rounded p-1 text-sm"><option :value="576">576px (用紙幅)</option><option :value="384">384px (2/3幅)</option><option :value="288">288px (半幅)</option><option value="asis">元サイズ</option></select>
                    </div>
                  </div>
                </div>

                <!-- qrcode -->
                <div v-if="item.type === 'qrcode'" class="flex gap-4 items-start">
                  <div class="flex-1 min-w-0">
                    <input v-model="(item.data.data as string)" type="text" class="w-full border rounded p-2 text-sm" placeholder="URL、テキスト等..." />
                  </div>
                  <div class="flex gap-2 shrink-0 items-end">
                    <div>
                      <label class="block text-xs text-gray-500 mb-1">配置</label>
                      <div class="flex border rounded overflow-hidden">
                        <button @click="item.data.alignment = 'left'" :class="item.data.alignment === 'left' ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-600 hover:bg-gray-50'" class="px-2 py-1 text-sm border-r flex items-center justify-center" title="左"><AlignLeft :size="14" /></button>
                        <button @click="item.data.alignment = 'center'" :class="item.data.alignment === 'center' ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-600 hover:bg-gray-50'" class="px-2 py-1 text-sm border-r flex items-center justify-center" title="中央"><AlignCenter :size="14" /></button>
                        <button @click="item.data.alignment = 'right'" :class="item.data.alignment === 'right' ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-600 hover:bg-gray-50'" class="px-2 py-1 text-sm flex items-center justify-center" title="右"><AlignRight :size="14" /></button>
                      </div>
                    </div>
                    <div class="w-20"><label class="block text-xs text-gray-500 mb-1">サイズ</label><select v-model.number="(item.data.moduleSize as number)" class="w-full border rounded p-1 text-sm"><option v-for="n in 16" :key="n" :value="n">{{ n }}</option></select></div>
                    <div class="w-16"><label class="block text-xs text-gray-500 mb-1">EC</label><select v-model="(item.data.ecLevel as string)" class="w-full border rounded p-1 text-sm"><option value="L">L</option><option value="M">M</option><option value="Q">Q</option><option value="H">H</option></select></div>
                  </div>
                </div>

                <!-- barcode -->
                <div v-if="item.type === 'barcode'" class="flex gap-4 items-start">
                  <div class="flex-1 min-w-0 space-y-2">
                    <input v-model="(item.data.data as string)" type="text" class="w-full border rounded p-2 text-sm" placeholder="バーコードデータ..." />
                    <div class="flex gap-2">
                      <div class="flex-1"><label class="block text-xs text-gray-500 mb-1">種類</label><select v-model="(item.data.barcodeType as string)" class="w-full border rounded p-1 text-sm"><option value="CODE128">Code128</option><option value="CODE39">Code39</option><option value="EAN13">EAN13</option><option value="EAN8">EAN8</option><option value="UPC_A">UPC-A</option><option value="UPC_E">UPC-E</option><option value="ITF">ITF</option><option value="CODABAR">Codabar</option><option value="CODE93">Code93</option><option value="GS1_DATABAR">GS1 DataBar</option><option value="GS1_DATABAR_EXPANDED">GS1 Expanded</option></select></div>
                    </div>
                  </div>
                  <div class="w-52 shrink-0 space-y-2">
                    <div>
                      <label class="block text-xs text-gray-500 mb-1">配置</label>
                      <div class="flex border rounded overflow-hidden">
                        <button @click="item.data.alignment = 'left'" :class="item.data.alignment === 'left' ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-600 hover:bg-gray-50'" class="flex-1 py-1 text-sm border-r flex items-center justify-center" title="左"><AlignLeft :size="14" /></button>
                        <button @click="item.data.alignment = 'center'" :class="item.data.alignment === 'center' ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-600 hover:bg-gray-50'" class="flex-1 py-1 text-sm border-r flex items-center justify-center" title="中央"><AlignCenter :size="14" /></button>
                        <button @click="item.data.alignment = 'right'" :class="item.data.alignment === 'right' ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-600 hover:bg-gray-50'" class="flex-1 py-1 text-sm flex items-center justify-center" title="右"><AlignRight :size="14" /></button>
                      </div>
                    </div>
                    <div class="flex gap-2">
                      <div class="flex-1"><label class="block text-xs text-gray-500 mb-1">高さ</label><input v-model.number="(item.data.height as number)" type="number" min="1" class="w-full border rounded p-1 text-sm" /></div>
                      <div class="flex-1"><label class="block text-xs text-gray-500 mb-1">バー幅</label><input v-model.number="(item.data.width as number)" type="number" min="1" max="6" class="w-full border rounded p-1 text-sm" /></div>
                      <div class="flex-1"><label class="block text-xs text-gray-500 mb-1">HRI</label><select v-model="(item.data.hriPosition as string)" class="w-full border rounded p-1 text-sm"><option value="none">なし</option><option value="above">上</option><option value="below">下</option></select></div>
                    </div>
                  </div>
                </div>

                <!-- pdf417 -->
                <div v-if="item.type === 'pdf417'" class="flex gap-4 items-start">
                  <div class="flex-1 min-w-0">
                    <input v-model="(item.data.data as string)" type="text" class="w-full border rounded p-2 text-sm" placeholder="PDF417データ..." />
                  </div>
                  <div class="shrink-0 space-y-2">
                    <div>
                      <label class="block text-xs text-gray-500 mb-1">配置</label>
                      <div class="flex border rounded overflow-hidden">
                        <button @click="item.data.alignment = 'left'" :class="item.data.alignment === 'left' ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-600 hover:bg-gray-50'" class="px-2 py-1 text-sm border-r flex items-center justify-center" title="左"><AlignLeft :size="14" /></button>
                        <button @click="item.data.alignment = 'center'" :class="item.data.alignment === 'center' ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-600 hover:bg-gray-50'" class="px-2 py-1 text-sm border-r flex items-center justify-center" title="中央"><AlignCenter :size="14" /></button>
                        <button @click="item.data.alignment = 'right'" :class="item.data.alignment === 'right' ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-600 hover:bg-gray-50'" class="px-2 py-1 text-sm flex items-center justify-center" title="右"><AlignRight :size="14" /></button>
                      </div>
                    </div>
                    <div class="flex gap-2">
                      <div class="w-16"><label class="block text-xs text-gray-500 mb-1">幅</label><input v-model.number="(item.data.moduleWidth as number)" type="number" min="1" class="w-full border rounded p-1 text-sm" /></div>
                      <div class="w-16"><label class="block text-xs text-gray-500 mb-1">S高</label><input v-model.number="(item.data.stepHeight as number)" type="number" min="1" class="w-full border rounded p-1 text-sm" /></div>
                      <div class="w-16"><label class="block text-xs text-gray-500 mb-1">桁</label><input v-model.number="(item.data.digits as number)" type="number" min="0" class="w-full border rounded p-1 text-sm" /></div>
                      <div class="w-16"><label class="block text-xs text-gray-500 mb-1">S数</label><input v-model.number="(item.data.steps as number)" type="number" min="0" class="w-full border rounded p-1 text-sm" /></div>
                      <div class="w-20"><label class="block text-xs text-gray-500 mb-1">EC</label><select v-model="(item.data.ecLevel as string)" class="w-full border rounded p-1 text-sm"><option v-for="n in 9" :key="n" :value="'Level' + (n-1)">L{{ n-1 }}</option></select></div>
                    </div>
                  </div>
                </div>

                <!-- gs1DataBarStacked -->
                <div v-if="item.type === 'gs1DataBarStacked'" class="flex gap-4 items-start">
                  <div class="flex-1 min-w-0">
                    <input v-model="(item.data.data as string)" type="text" class="w-full border rounded p-2 text-sm" placeholder="GS1 DataBarデータ..." />
                  </div>
                  <div class="shrink-0 space-y-2">
                    <div class="flex gap-2 items-end">
                      <div>
                        <label class="block text-xs text-gray-500 mb-1">配置</label>
                        <div class="flex border rounded overflow-hidden">
                          <button @click="item.data.alignment = 'left'" :class="item.data.alignment === 'left' ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-600 hover:bg-gray-50'" class="px-2 py-1 text-sm border-r flex items-center justify-center" title="左"><AlignLeft :size="14" /></button>
                          <button @click="item.data.alignment = 'center'" :class="item.data.alignment === 'center' ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-600 hover:bg-gray-50'" class="px-2 py-1 text-sm border-r flex items-center justify-center" title="中央"><AlignCenter :size="14" /></button>
                          <button @click="item.data.alignment = 'right'" :class="item.data.alignment === 'right' ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-600 hover:bg-gray-50'" class="px-2 py-1 text-sm flex items-center justify-center" title="右"><AlignRight :size="14" /></button>
                        </div>
                      </div>
                      <div class="w-28"><label class="block text-xs text-gray-500 mb-1">種類</label><select v-model="(item.data.symbology as string)" class="w-full border rounded p-1 text-sm"><option value="Stacked">Stacked</option><option value="ExpandedStacked">Expanded</option><option value="StackedOmnidirectional">Omni</option></select></div>
                    </div>
                    <div class="flex gap-2">
                      <div class="w-20"><label class="block text-xs text-gray-500 mb-1">モジュール</label><input v-model.number="(item.data.moduleSize as number)" type="number" min="1" class="w-full border rounded p-1 text-sm" /></div>
                      <div class="w-20"><label class="block text-xs text-gray-500 mb-1">最大</label><input v-model.number="(item.data.maxSize as number)" type="number" min="1" class="w-full border rounded p-1 text-sm" /></div>
                    </div>
                  </div>
                </div>

                <!-- cut -->
                <div v-if="item.type === 'cut'" class="flex items-center gap-3">
                  <label class="text-xs text-gray-500">タイプ <span v-tooltip="'パーシャル: 一部を残してカット（レシートが落ちない）\nフル: 完全にカット\nPrefeed付き: カット後に次の印刷開始位置まで自動的に紙送りします'"><Info :size="14" class="inline align-[-2px] text-gray-400 cursor-help" /></span></label>
                  <select v-model="(item.data.percentage as string)" class="border rounded p-1 text-sm"><option value="partialPrefeed">パーシャル + Prefeed</option><option value="partial">パーシャル</option><option value="fullPrefeed">フル + Prefeed</option><option value="full">フル</option></select>
                </div>

                <!-- feed -->
                <div v-if="item.type === 'feed'" class="flex items-end gap-3">
                  <div class="w-32">
                    <label class="block text-xs text-gray-500 mb-1">送り量</label>
                    <input v-model.number="(item.data.units as number)" type="number" min="1" max="1000" class="w-full border rounded p-1.5 text-sm" />
                  </div>
                  <div class="w-32">
                    <label class="block text-xs text-gray-500 mb-1">単位 <span v-tooltip="'Dots: 1dot ≒ 0.125mm（203dpi時）\nTwips: 1/1440インチ\nEnglish: 1/1000インチ\nMetric: 1/100mm'"><Info :size="14" class="inline align-[-2px] text-gray-400 cursor-help" /></span></label>
                    <select v-model="(item.data.unitType as string)" class="w-full border rounded p-1.5 text-sm"><option value="Dots">Dots</option><option value="Twips">Twips</option><option value="English">English</option><option value="Metric">Metric</option></select>
                  </div>
                </div>

                <!-- markFeed -->
                <div v-if="item.type === 'markFeed'" class="flex items-center gap-3">
                  <label class="text-xs text-gray-500">タイプ</label>
                  <select v-model="(item.data.feedType as string)" class="border rounded p-1 text-sm"><option value="Cutter">Cutter</option><option value="NextTof">NextTof</option></select>
                </div>

                <!-- pageModePrint -->
                <div v-if="item.type === 'pageModePrint'" class="flex items-center gap-3">
                  <label class="text-xs text-gray-500">制御 <span v-tooltip="'ページモードは、用紙上の任意の位置にテキストや画像を配置できるモードです。\n通常モードでは上から下へ順番に印刷されますが、ページモードではX/Y座標を指定して自由にレイアウトできます。\n\nPageMode: ページモード開始\nNormal: 通常モードに戻る（内容を印刷）\nCancel: ページモードを破棄（印刷しない）'"><Info :size="14" class="inline align-[-2px] text-gray-400 cursor-help" /></span></label>
                  <select v-model="(item.data.control as string)" class="border rounded p-1 text-sm"><option value="PageMode">PageMode (開始)</option><option value="Normal">Normal (印刷して終了)</option><option value="Cancel">Cancel (破棄)</option></select>
                </div>

                <!-- setPageModePrintArea -->
                <div v-if="item.type === 'setPageModePrintArea'" class="flex items-end gap-3">
                  <span v-tooltip="'ページモード内で印刷可能な矩形領域を定義します。\nX,Y: 左上の起点座標（ドット単位）\n幅,高さ: 領域のサイズ（ドット単位）\nこの範囲外には印刷されません。'"><Info :size="14" class="text-gray-400 cursor-help" /></span>
                  <div class="w-20"><label class="block text-xs text-gray-500 mb-1">X</label><input v-model.number="(item.data.x as number)" type="number" min="0" class="w-full border rounded p-1 text-sm" /></div>
                  <div class="w-20"><label class="block text-xs text-gray-500 mb-1">Y</label><input v-model.number="(item.data.y as number)" type="number" min="0" class="w-full border rounded p-1 text-sm" /></div>
                  <div class="w-20"><label class="block text-xs text-gray-500 mb-1">幅</label><input v-model.number="(item.data.width as number)" type="number" min="1" class="w-full border rounded p-1 text-sm" /></div>
                  <div class="w-20"><label class="block text-xs text-gray-500 mb-1">高さ</label><input v-model.number="(item.data.height as number)" type="number" min="1" class="w-full border rounded p-1 text-sm" /></div>
                </div>

                <!-- setPageModePrintDirection -->
                <div v-if="item.type === 'setPageModePrintDirection'" class="flex items-center gap-3">
                  <label class="text-xs text-gray-500">方向 <span v-tooltip="'ページモード内でのテキスト・画像の印刷方向を指定します。\nLeftToRight: 左→右（通常）\nBottomToTop: 下→上（90°回転）\nRightToLeft: 右→左（180°回転）\nTopToBottom: 上→下（270°回転）'"><Info :size="14" class="inline align-[-2px] text-gray-400 cursor-help" /></span></label>
                  <select v-model="(item.data.direction as string)" class="border rounded p-1 text-sm"><option value="LeftToRight">LeftToRight (通常)</option><option value="BottomToTop">BottomToTop (90°)</option><option value="RightToLeft">RightToLeft (180°)</option><option value="TopToBottom">TopToBottom (270°)</option></select>
                </div>

                <!-- setPageModeHPos -->
                <div v-if="item.type === 'setPageModeHPos'" class="flex items-center gap-3">
                  <label class="text-xs text-gray-500">水平位置 <span v-tooltip="'ページモード印刷エリア内で、次に印刷する水平方向（X軸）の位置をドット単位で指定します。印刷エリアの左端が0です。'"><Info :size="14" class="inline align-[-2px] text-gray-400 cursor-help" /></span></label>
                  <input v-model.number="(item.data.position as number)" type="number" min="0" class="w-24 border rounded p-1 text-sm" />
                  <span class="text-xs text-gray-400">dots</span>
                </div>

                <!-- setPageModeVPos -->
                <div v-if="item.type === 'setPageModeVPos'" class="flex items-center gap-3">
                  <label class="text-xs text-gray-500">垂直位置 <span v-tooltip="'ページモード印刷エリア内で、次に印刷する垂直方向（Y軸）の位置をドット単位で指定します。印刷エリアの上端が0です。'"><Info :size="14" class="inline align-[-2px] text-gray-400 cursor-help" /></span></label>
                  <input v-model.number="(item.data.position as number)" type="number" min="0" class="w-24 border rounded p-1 text-sm" />
                  <span class="text-xs text-gray-400">dots</span>
                </div>

                <!-- clearPrintArea -->
                <div v-if="item.type === 'clearPrintArea'" class="flex items-center gap-2">
                  <span v-tooltip="'ページモードの印刷エリア内に描画済みの内容をすべて消去します。エリア設定自体は維持されます。'"><Info :size="14" class="text-gray-400 cursor-help" /></span>
                  <span class="text-sm text-gray-500">印刷エリアの内容をクリアします（パラメータなし）</span>
                </div>

                <!-- setEncoding -->
                <div v-if="item.type === 'setEncoding'" class="flex items-center gap-3">
                  <label class="text-xs text-gray-500">エンコーディング</label>
                  <select v-model="(item.data.encoding as string)" class="border rounded p-1 text-sm"><option value="UTF-8">UTF-8</option><option value="Japanese">Japanese</option><option value="SimplifiedChinese">SimplifiedChinese</option><option value="Korean">Korean</option><option value="TraditionalChinese">TraditionalChinese</option><option value="SingleByteCharacter">SingleByte</option><option value="None">None</option></select>
                </div>

                <!-- setCodePage -->
                <div v-if="item.type === 'setCodePage'" class="flex items-center gap-3">
                  <label class="text-xs text-gray-500">コードページ <span v-tooltip="'シングルバイト文字（半角英数・記号）の文字コード表を切り替えます。\n主なコードページ:\n1: PC437 (USA)\n2: Katakana\n3: PC850 (Multilingual)\n4: PC860 (Portuguese)\n19: PC858 (Euro)\n\nエンコーディングがSingleByteCharacterの場合に有効です。'"><Info :size="14" class="inline align-[-2px] text-gray-400 cursor-help" /></span></label>
                  <input v-model.number="(item.data.codePage as number)" type="number" min="0" class="w-24 border rounded p-1 text-sm" />
                </div>

                <!-- setCharacterset -->
                <div v-if="item.type === 'setCharacterset'" class="flex items-center gap-3">
                  <label class="text-xs text-gray-500">文字セット <span v-tooltip="'国際文字セット（記号の字形）を切り替えます。\n通貨記号（$, ¥, £等）や一部の記号が国ごとに変わります。\n\n主なID:\n0: USA\n1: France\n2: Germany\n3: UK\n4: Denmark\n5: Sweden\n8: Japan\n13: Spain'"><Info :size="14" class="inline align-[-2px] text-gray-400 cursor-help" /></span></label>
                  <input v-model.number="(item.data.characterset as number)" type="number" min="0" class="w-24 border rounded p-1 text-sm" />
                </div>

                <!-- setLineSpacing -->
                <div v-if="item.type === 'setLineSpacing'" class="flex items-center gap-3">
                  <label class="text-xs text-gray-500">行間隔</label>
                  <input v-model.number="(item.data.spacing as number)" type="number" min="0" class="w-24 border rounded p-1 text-sm" />
                  <span class="text-xs text-gray-400">dots</span>
                </div>

                <!-- setMapMode -->
                <div v-if="item.type === 'setMapMode'" class="flex items-center gap-3">
                  <label class="text-xs text-gray-500">単位系 <span v-tooltip="'座標や距離の指定に使う単位系を変更します。\n以降のコマンド（紙送り、ページモード座標等）すべてに影響します。\n\nDots: プリンタドット（1dot ≒ 0.125mm）\nTwips: 1/1440インチ（≒ 0.018mm）\nEnglish: 1/1000インチ（≒ 0.025mm）\nMetric: 1/100mm（0.01mm）'"><Info :size="14" class="inline align-[-2px] text-gray-400 cursor-help" /></span></label>
                  <select v-model="(item.data.mapMode as string)" class="border rounded p-1 text-sm"><option value="Dots">Dots (プリンタドット)</option><option value="Twips">Twips (1/1440inch)</option><option value="English">English (1/1000inch)</option><option value="Metric">Metric (1/100mm)</option></select>
                </div>

                <!-- openDrawer -->
                <div v-if="item.type === 'openDrawer'" class="flex items-center gap-3">
                  <label class="text-xs text-gray-500">ドロワー</label>
                  <select v-model="(item.data.drawer as string)" class="border rounded p-1 text-sm"><option value="Drawer1">Drawer1</option><option value="Drawer2">Drawer2</option></select>
                  <label class="text-xs text-gray-500">パルス長</label>
                  <input v-model.number="(item.data.pulseLength as number)" type="number" min="1" class="w-20 border rounded p-1 text-sm" />
                </div>

                <!-- messageId -->
                <div v-if="item.type === 'messageId'" class="flex items-center gap-3">
                  <label class="text-xs text-gray-500">ID <span v-tooltip="'印刷ジョブに任意のIDを付与できます。\nプリンタからの応答にこのIDが含まれるため、\nどのリクエストに対する結果かを識別するのに使います。'"><Info :size="14" class="inline align-[-2px] text-gray-400 cursor-help" /></span></label>
                  <input v-model="(item.data.messageId as string)" type="text" class="w-48 border rounded p-1 text-sm" placeholder="メッセージID..." />
                </div>

                <!-- rotatePrint -->
                <div v-if="item.type === 'rotatePrint'" class="flex items-center gap-4">
                  <span v-tooltip="'以降の印刷内容の回転方向を設定します。\n対象ごとに個別に回転ON/OFFを切り替えられます。\n\nバーコード: 1Dバーコード・QRコード等を回転対象に含める\nビットマップ: 画像を回転対象に含める\n\nテキストは常に回転対象です。'"><Info :size="14" class="text-gray-400 cursor-help" /></span>
                  <select v-model="(item.data.rotation as string)" class="border rounded p-1 text-sm"><option value="Normal">Normal (0°)</option><option value="Rotate180">Rotate180 (180°)</option></select>
                  <label class="flex items-center gap-1 text-xs" v-tooltip="'バーコード・QRコードも回転させる'"><input type="checkbox" v-model="(item.data.barcode as boolean)" class="rounded" />バーコード</label>
                  <label class="flex items-center gap-1 text-xs" v-tooltip="'画像（ビットマップ）も回転させる'"><input type="checkbox" v-model="(item.data.bitmap as boolean)" class="rounded" />ビットマップ</label>
                </div>

                <!-- clearOutput -->
                <div v-if="item.type === 'clearOutput'" class="flex items-center gap-2">
                  <span v-tooltip="'プリンタの送信バッファに蓄積されたデータをすべて破棄します。\nまだ印刷されていないデータが消えるため、\n印刷中断や初期化に使用します。'"><Info :size="14" class="text-gray-400 cursor-help" /></span>
                  <span class="text-sm text-gray-500">未送信の印刷データをすべて破棄します（パラメータなし）</span>
                </div>

                <!-- raw -->
                <div v-if="item.type === 'raw'" class="w-full">
                  <textarea v-model="(item.data.xml as string)" class="w-full border rounded p-2 text-sm font-mono" rows="3" placeholder="<PrintText>...</PrintText>"></textarea>
                </div>
              </div>
            </div>
          </div>

          <!-- アクションバー -->
          <div class="bg-white rounded-lg shadow-sm border p-3">
            <div class="flex items-center justify-between flex-wrap gap-3">
              <div class="flex gap-2">
                <button @click="clearStack" :disabled="stack.length === 0" class="px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed">全クリア</button>
                <button @click="showTemplateModal = true" class="px-3 py-1.5 text-sm text-amber-700 border border-amber-200 rounded hover:bg-amber-50">テンプレート</button>
              </div>
              <div class="flex gap-2">
                <button @click="getXmlPreview" :disabled="!hasValidCommands" class="px-4 py-1.5 text-sm bg-gray-100 text-gray-700 border rounded hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed">XML確認</button>
                <button @click="print" :disabled="isLoading || !hasValidCommands" class="px-6 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium">{{ isLoading ? '送信中...' : '印刷' }}</button>
              </div>
            </div>
          </div>

          <!-- 結果 -->
          <div v-if="result" class="bg-white rounded-lg shadow-sm border p-4 mt-4">
            <div class="flex items-center justify-between mb-2"><h2 class="text-sm font-semibold text-gray-700">結果</h2><button @click="result = ''" class="text-gray-400 hover:text-gray-600"><X :size="14" /></button></div>
            <pre class="bg-gray-50 p-3 rounded text-xs overflow-x-auto max-h-48 border">{{ result }}</pre>
          </div>
        </div>

        <!-- プレビュー -->
        <div class="w-80 shrink-0">
          <div class="sticky top-20">
            <div class="bg-white rounded-lg shadow-sm border">
              <div class="px-3 py-2 border-b bg-gray-50 rounded-t-lg"><h2 class="text-sm font-semibold text-gray-600">印刷プレビュー (参考)</h2></div>
              <div class="p-2">
                <div class="bg-white border border-gray-300 mx-auto overflow-hidden" style="width: 260px; min-height: 100px;">
                  <div v-if="previewItems.length === 0" class="p-4 text-center text-gray-300 text-xs">プレビュー</div>
                  <template v-for="(pItem, pIdx) in previewItems" :key="pIdx">
                    <!-- text: paddingText隣接時はfloat:leftで同一行に並ぶ -->
                    <div v-if="pItem.type === 'text' && pItem.data" class="px-2 py-0.5" :class="pItem.adjacentPadding ? '' : 'clear-both ' + getAlignClass(pItem.alignment)" :style="pItem.adjacentPadding ? { float: 'left' } : {}">
                      <span class="font-mono text-xs whitespace-pre-wrap break-all" :style="getPreviewTextStyle(pItem)">{{ pItem.data }}</span>
                    </div>
                    <!-- paddingText: side に応じて float -->
                    <div v-else-if="pItem.type === 'paddingText' && pItem.data" class="px-2 py-0.5" :style="{ float: pItem.side === 'Right' ? 'right' : 'left' }">
                      <span class="font-mono text-xs" :style="getPreviewTextStyle(pItem)">{{ pItem.data }}</span>
                    </div>
                    <div v-else-if="pItem.type === 'image' && pItem.preview" class="px-2 py-1 clear-both" :class="getAlignClass(pItem.alignment)">
                      <img :src="pItem.preview" alt="" class="max-w-full max-h-24 inline-block" style="image-rendering: pixelated;" />
                    </div>
                    <div v-else-if="pItem.type === 'qrcode' && pItem.data" class="px-2 py-1 clear-both" :class="getAlignClass(pItem.alignment)">
                      <div class="inline-flex flex-col items-center border border-gray-300 p-1.5 bg-white rounded">
                        <QrCode :size="32" class="text-gray-500" />
                      </div>
                    </div>
                    <div v-else-if="pItem.type === 'barcode' && pItem.data" class="px-2 py-1 clear-both" :class="getAlignClass(pItem.alignment)">
                      <div class="inline-flex items-center gap-1 border border-gray-300 px-2 py-1 bg-white rounded">
                        <Barcode :size="24" class="text-gray-500" />
                        <span class="text-[9px] text-gray-400">1D</span>
                      </div>
                    </div>
                    <div v-else-if="pItem.type === 'pdf417' && pItem.data" class="px-2 py-1 clear-both" :class="getAlignClass(pItem.alignment)">
                      <div class="inline-flex items-center gap-1 border border-gray-300 px-2 py-1 bg-white rounded">
                        <ScanBarcode :size="24" class="text-gray-500" />
                        <span class="text-[9px] text-gray-400">PDF417</span>
                      </div>
                    </div>
                    <div v-else-if="pItem.type === 'gs1DataBar' && pItem.data" class="px-2 py-1 clear-both" :class="getAlignClass(pItem.alignment)">
                      <div class="inline-flex items-center gap-1 border border-gray-300 px-2 py-1 bg-white rounded">
                        <ScanBarcode :size="24" class="text-gray-500" />
                        <span class="text-[9px] text-gray-400">GS1</span>
                      </div>
                    </div>
                    <div v-else-if="pItem.type === 'cut'" class="py-1 px-2 clear-both"><div class="border-t-2 border-dashed border-gray-400 relative"><span class="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-white px-0.5"><Scissors :size="12" class="text-gray-400" /></span></div></div>
                    <div v-else-if="pItem.type === 'feed'" class="clear-both" :style="{ height: Math.min((pItem.units || 34) * 0.5, 60) + 'px' }"></div>
                    <div v-else-if="pItem.type === 'other'" class="px-2 py-0.5 text-xs text-gray-400 italic clear-both">[ {{ pItem.label }} ]</div>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- XML/JSONモーダル -->
    <div v-if="showXmlModal" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" @click.self="showXmlModal = false">
      <div class="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] flex flex-col">
        <div class="flex items-center justify-between px-4 py-3 border-b">
          <div class="flex items-center gap-4">
            <h2 class="text-sm font-semibold">プレビュー</h2>
            <div class="flex border rounded overflow-hidden">
              <button @click="previewTab = 'xml'" :class="['px-3 py-1 text-xs', previewTab === 'xml' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200']">XML</button>
              <button @click="previewTab = 'json'" :class="['px-3 py-1 text-xs', previewTab === 'json' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200']">JSON</button>
              <button @click="previewTab = 'maxmsp'" :class="['px-3 py-1 text-xs', previewTab === 'maxmsp' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200']">Max/MSP</button>
            </div>
          </div>
          <button @click="showXmlModal = false" class="text-gray-400 hover:text-gray-600"><X :size="18" /></button>
        </div>
        <div class="p-4 overflow-auto flex-1"><pre class="bg-gray-50 p-4 rounded text-xs whitespace-pre-wrap border font-mono">{{ previewTab === 'xml' ? xmlPreview : previewTab === 'json' ? jsonPreview : maxmspPreview }}</pre></div>
        <div class="px-4 py-3 border-t flex justify-between">
          <button @click="copyPreviewToClipboard" class="px-4 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">コピー</button>
          <button @click="showXmlModal = false" class="px-4 py-1.5 text-sm bg-gray-100 text-gray-700 rounded border hover:bg-gray-200">閉じる</button>
        </div>
      </div>
    </div>

    <!-- テンプレートモーダル -->
    <div v-if="showTemplateModal" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" @click.self="showTemplateModal = false">
      <div class="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col">
        <div class="flex items-center justify-between px-4 py-3 border-b"><h2 class="text-sm font-semibold">テンプレート管理</h2><button @click="showTemplateModal = false" class="text-gray-400 hover:text-gray-600"><X :size="18" /></button></div>
        <div class="p-4 overflow-auto flex-1 space-y-4">
          <div class="border rounded p-3 bg-amber-50">
            <h3 class="text-xs font-semibold text-gray-600 mb-2">現在のスタックを保存</h3>
            <div class="flex gap-2">
              <input v-model="templateName" type="text" class="flex-1 border rounded p-1.5 text-sm" placeholder="テンプレート名..." @keyup.enter="saveTemplate" />
              <button @click="saveTemplate" :disabled="!templateName.trim() || stack.length === 0" class="px-3 py-1.5 text-sm bg-amber-600 text-white rounded hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed">保存</button>
            </div>
            <button @click="exportCurrentAsJson" :disabled="stack.length === 0" class="mt-2 px-3 py-1 text-xs text-gray-600 border rounded hover:bg-gray-50 disabled:opacity-40">JSONエクスポート</button>
          </div>
          <div>
            <h3 class="text-xs font-semibold text-gray-600 mb-2">保存済み ({{ savedTemplates.length }})</h3>
            <div v-if="savedTemplates.length === 0" class="text-sm text-gray-400 py-2">テンプレートなし</div>
            <div class="space-y-1.5">
              <div v-for="(tpl, tIdx) in savedTemplates" :key="tIdx" class="flex items-center gap-2 border rounded px-3 py-2 hover:bg-gray-50">
                <div class="flex-1 min-w-0"><div class="text-sm font-medium truncate">{{ tpl.name }}</div><div class="text-xs text-gray-400">{{ tpl.stack.length }}cmd &middot; {{ new Date(tpl.createdAt).toLocaleDateString('ja-JP') }}</div></div>
                <button @click="loadTemplate(tIdx)" class="px-2 py-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100">読込</button>
                <button @click="deleteTemplate(tIdx)" class="px-2 py-1 text-xs text-red-500 border border-red-200 rounded hover:bg-red-50">削除</button>
              </div>
            </div>
          </div>
          <div class="border-t pt-3">
            <div class="flex gap-2 flex-wrap">
              <button @click="exportTemplatesJson" :disabled="savedTemplates.length === 0" class="px-3 py-1.5 text-xs border rounded hover:bg-gray-50 disabled:opacity-40">全エクスポート</button>
              <label class="px-3 py-1.5 text-xs border rounded hover:bg-gray-50 cursor-pointer">JSONインポート<input type="file" accept=".json" @change="importTemplatesJson" class="hidden" /></label>
            </div>
          </div>
        </div>
        <div class="px-4 py-3 border-t flex justify-end"><button @click="showTemplateModal = false" class="px-4 py-1.5 text-sm bg-gray-100 text-gray-700 rounded border hover:bg-gray-200">閉じる</button></div>
      </div>
    </div>
    <!-- エラーモーダル -->
    <div v-if="showErrorModal" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" @click.self="showErrorModal = false">
      <div class="bg-white rounded-lg shadow-xl max-w-lg w-full flex flex-col">
        <div class="flex items-center justify-between px-4 py-3 border-b bg-red-50">
          <h2 class="text-sm font-semibold text-red-700">接続エラー</h2>
          <button @click="showErrorModal = false" class="text-gray-400 hover:text-gray-600"><X :size="18" /></button>
        </div>
        <div class="p-4">
          <pre class="bg-gray-50 p-3 rounded text-xs whitespace-pre-wrap border text-gray-700">{{ errorMessage }}</pre>
        </div>
        <div class="px-4 py-3 border-t flex justify-end">
          <button @click="showErrorModal = false" class="px-4 py-1.5 text-sm bg-gray-100 text-gray-700 rounded border hover:bg-gray-200">閉じる</button>
        </div>
      </div>
    </div>
  </div>
</template>
