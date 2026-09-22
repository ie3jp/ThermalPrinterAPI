#!/bin/bash
#
# PrintAPI CLIサンプル
# 使い方: ./print-cli.sh
#

API_URL="http://localhost:3456"

# ==========================================
# 1. テキストのみ印刷
# ==========================================
echo "=== テキスト印刷 ==="
curl -s -X POST "$API_URL/api/print" \
  -H "Content-Type: application/json" \
  -d '{
    "commands": [
      {"type": "text", "data": "こんにちは！", "alignment": "center", "textSize": 1},
      {"type": "text", "data": "PrintAPI テスト", "alignment": "center"},
      {"type": "feed", "units": 3},
      {"type": "cut", "percentage": "partial"}
    ]
  }'
echo ""

# ==========================================
# 2. 画像URL + テキスト印刷
# ==========================================
echo "=== 画像（URL）+ テキスト印刷 ==="
curl -s -X POST "$API_URL/api/print" \
  -H "Content-Type: application/json" \
  -d '{
    "commands": [
      {"type": "image", "data": "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png", "width": 400, "alignment": "center", "mode": "mono"},
      {"type": "feed", "units": 2},
      {"type": "text", "data": "Google ロゴ", "alignment": "center"},
      {"type": "cut", "percentage": "partial"}
    ]
  }'
echo ""

# ==========================================
# 3. ローカル画像ファイルを送信（Base64エンコード）
# ==========================================
print_local_image() {
  local IMAGE_PATH="$1"
  local CAPTION="$2"

  if [ ! -f "$IMAGE_PATH" ]; then
    echo "ファイルが見つかりません: $IMAGE_PATH"
    return 1
  fi

  # 画像をBase64エンコード
  BASE64_DATA=$(base64 < "$IMAGE_PATH" | tr -d '\n')

  # 拡張子からMIMEタイプを判定
  EXT="${IMAGE_PATH##*.}"
  case "$EXT" in
    png)  MIME="image/png" ;;
    jpg|jpeg) MIME="image/jpeg" ;;
    gif)  MIME="image/gif" ;;
    bmp)  MIME="image/bmp" ;;
    *)    MIME="application/octet-stream" ;;
  esac

  # Data URL形式で送信
  DATA_URL="data:$MIME;base64,$BASE64_DATA"

  echo "=== ローカル画像印刷: $IMAGE_PATH ==="
  curl -s -X POST "$API_URL/api/print" \
    -H "Content-Type: application/json" \
    -d "{
      \"commands\": [
        {\"type\": \"image\", \"data\": \"$DATA_URL\", \"width\": 400, \"alignment\": \"center\", \"mode\": \"mono\"},
        {\"type\": \"feed\", \"units\": 2},
        {\"type\": \"text\", \"data\": \"$CAPTION\", \"alignment\": \"center\"},
        {\"type\": \"cut\", \"percentage\": \"partial\"}
      ]
    }"
  echo ""
}

# 使用例（コメントアウト解除して使用）
# print_local_image "/path/to/your/image.png" "ローカル画像"

# ==========================================
# 4. QRコード印刷
# ==========================================
echo "=== QRコード印刷 ==="
curl -s -X POST "$API_URL/api/print" \
  -H "Content-Type: application/json" \
  -d '{
    "commands": [
      {"type": "text", "data": "サイトにアクセス", "alignment": "center"},
      {"type": "feed", "units": 1},
      {"type": "qrcode", "data": "https://example.com", "moduleSize": 8, "ecLevel": "M", "alignment": "center"},
      {"type": "feed", "units": 2},
      {"type": "cut", "percentage": "partial"}
    ]
  }'
echo ""

# ==========================================
# 5. ステータス確認
# ==========================================
echo "=== プリンタステータス ==="
curl -s "$API_URL/api/status"
echo ""
