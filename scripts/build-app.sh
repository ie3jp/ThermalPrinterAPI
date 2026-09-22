#!/bin/bash
set -e

# macOS .app バンドル作成スクリプト
# Node.jsランタイムを同梱したスタンドアロンアプリを生成

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
RELEASE_DIR="$PROJECT_DIR/release"
APP_NAME="PrintAPI"
APP_BUNDLE="$RELEASE_DIR/$APP_NAME.app"

# Node.jsバージョン（arm64 macOS用）
NODE_VERSION="22.13.1"
NODE_ARCH="darwin-arm64"
NODE_TARBALL="node-v${NODE_VERSION}-${NODE_ARCH}.tar.gz"
NODE_URL="https://nodejs.org/dist/v${NODE_VERSION}/${NODE_TARBALL}"

echo "=== PrintAPI macOS .app Bundle Builder ==="
echo ""

# クリーンアップ
echo "1. Cleaning up previous build..."
rm -rf "$APP_BUNDLE"
mkdir -p "$RELEASE_DIR"

# サーバーとクライアントをビルド
echo "2. Building server and client..."
cd "$PROJECT_DIR"
pnpm build:server
pnpm build:client

# .app構造を作成
echo "3. Creating .app bundle structure..."
mkdir -p "$APP_BUNDLE/Contents/MacOS"
mkdir -p "$APP_BUNDLE/Contents/Resources/app"
mkdir -p "$APP_BUNDLE/Contents/Resources/runtime"

# Info.plist作成
echo "4. Creating Info.plist..."
cat > "$APP_BUNDLE/Contents/Info.plist" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>start</string>
    <key>CFBundleIdentifier</key>
    <string>com.tokyonode.printapi</string>
    <key>CFBundleName</key>
    <string>PrintAPI</string>
    <key>CFBundleDisplayName</key>
    <string>Thermal Printer API</string>
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
    <true/>
</dict>
</plist>
EOF

# 起動スクリプト作成（Terminal.appで開くラッパー）
echo "5. Creating launch scripts..."

# メインの実行スクリプト（サーバー起動）
cat > "$APP_BUNDLE/Contents/Resources/run-server.sh" << 'EOF'
#!/bin/bash

# .appバンドル内のResourcesディレクトリ
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# 既存のサーバーが動いていたら停止
pkill -f "node.*app/dist/server/index.js" 2>/dev/null || true
sleep 0.3

# サーバーをフォアグラウンドで起動（ログ表示、Ctrl+Cで停止可能）
# サーバー側でURLとバナーを表示する
exec ./runtime/bin/node app/dist/server/index.js
EOF
chmod +x "$APP_BUNDLE/Contents/Resources/run-server.sh"

# .app起動時にTerminal.appでrun-server.shを開くAppleScript
cat > "$APP_BUNDLE/Contents/MacOS/start" << 'EOF'
#!/bin/bash

RESOURCES_DIR="$(dirname "$0")/../Resources"
SCRIPT_PATH="$RESOURCES_DIR/run-server.sh"

# Terminal.appで新しいウィンドウを開いてスクリプトを実行
osascript <<APPLESCRIPT
tell application "Terminal"
    activate
    do script "exec '$SCRIPT_PATH'"
end tell
APPLESCRIPT
EOF
chmod +x "$APP_BUNDLE/Contents/MacOS/start"

# アプリコードをコピー
echo "6. Copying application files..."
cp -r "$PROJECT_DIR/dist" "$APP_BUNDLE/Contents/Resources/app/"
cp "$PROJECT_DIR/package.json" "$APP_BUNDLE/Contents/Resources/app/"

# 本番用node_modulesをインストール
echo "7. Installing production dependencies..."
cd "$APP_BUNDLE/Contents/Resources/app"
# 本番用の最小package.jsonを作成（scripts不要）
cat > package.json << 'PKGJSON'
{
  "name": "print-api",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "@hono/node-server": "^1.19.9",
    "hono": "^4.11.5",
    "node-osc": "^9.1.3",
    "sharp": "^0.34.5"
  }
}
PKGJSON
npm install --omit=dev --ignore-scripts=false
cd "$PROJECT_DIR"

# Node.jsランタイムをダウンロード・配置
echo "8. Downloading Node.js runtime (v${NODE_VERSION})..."
TEMP_DIR=$(mktemp -d)
curl -sL "$NODE_URL" -o "$TEMP_DIR/$NODE_TARBALL"
tar -xzf "$TEMP_DIR/$NODE_TARBALL" -C "$TEMP_DIR"

# 必要なバイナリのみコピー
echo "9. Installing Node.js runtime..."
mkdir -p "$APP_BUNDLE/Contents/Resources/runtime/bin"
mkdir -p "$APP_BUNDLE/Contents/Resources/runtime/lib"
cp "$TEMP_DIR/node-v${NODE_VERSION}-${NODE_ARCH}/bin/node" "$APP_BUNDLE/Contents/Resources/runtime/bin/"
chmod +x "$APP_BUNDLE/Contents/Resources/runtime/bin/node"

# クリーンアップ
rm -rf "$TEMP_DIR"

# 完成
echo ""
echo "=== Build Complete ==="
echo "App bundle: $APP_BUNDLE"
echo ""

# サイズ確認
SIZE=$(du -sh "$APP_BUNDLE" | cut -f1)
echo "Bundle size: $SIZE"
echo ""
echo "To run: open $APP_BUNDLE"
echo "To stop server: pkill -f 'node.*app/dist/server/index.js'"
