#!/usr/bin/env python3
"""
PrintAPI Python CLIサンプル
使い方: python print-cli.py [image-path]

依存: pip install requests
"""

import sys
import json
import base64
import mimetypes
from pathlib import Path

try:
    import requests
except ImportError:
    print("requestsが必要です: pip install requests")
    sys.exit(1)

API_URL = "http://localhost:3456"


def print_commands(commands: list) -> dict:
    """印刷コマンドを送信"""
    response = requests.post(
        f"{API_URL}/api/print",
        headers={"Content-Type": "application/json"},
        json={"commands": commands},
    )
    return response.json()


def print_text(text: str, alignment: str = "left", text_size: int = 0, cut: bool = True) -> dict:
    """テキスト印刷"""
    commands = [
        {"type": "text", "data": text, "alignment": alignment, "textSize": text_size},
    ]
    if cut:
        commands.append({"type": "feed", "units": 3})
        commands.append({"type": "cut", "percentage": "partial"})
    return print_commands(commands)


def print_image_url(url: str, width: int = 400, alignment: str = "center",
                    mode: str = "mono", caption: str = None, cut: bool = True) -> dict:
    """画像印刷（URL）"""
    commands = [
        {"type": "image", "data": url, "width": width, "alignment": alignment, "mode": mode},
    ]
    if caption:
        commands.append({"type": "feed", "units": 1})
        commands.append({"type": "text", "data": caption, "alignment": "center"})
    if cut:
        commands.append({"type": "feed", "units": 2})
        commands.append({"type": "cut", "percentage": "partial"})
    return print_commands(commands)


def print_image_file(file_path: str, width: int = 400, alignment: str = "center",
                     mode: str = "mono", cut: bool = True) -> dict:
    """画像印刷（ローカルファイル）"""
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"ファイルが見つかりません: {file_path}")

    # Base64エンコード
    with open(path, "rb") as f:
        base64_data = base64.b64encode(f.read()).decode("utf-8")

    # MIMEタイプを判定
    mime_type, _ = mimetypes.guess_type(str(path))
    if not mime_type:
        mime_type = "application/octet-stream"

    # Data URL形式
    data_url = f"data:{mime_type};base64,{base64_data}"

    commands = [
        {"type": "image", "data": data_url, "width": width, "alignment": alignment, "mode": mode},
        {"type": "feed", "units": 1},
        {"type": "text", "data": path.name, "alignment": "center"},
    ]
    if cut:
        commands.append({"type": "feed", "units": 2})
        commands.append({"type": "cut", "percentage": "partial"})
    return print_commands(commands)


def print_qrcode(data: str, module_size: int = 6, ec_level: str = "M",
                 alignment: str = "center", label: str = None, cut: bool = True) -> dict:
    """QRコード印刷"""
    commands = []
    if label:
        commands.append({"type": "text", "data": label, "alignment": "center"})
        commands.append({"type": "feed", "units": 1})
    commands.append({
        "type": "qrcode", "data": data, "moduleSize": module_size,
        "ecLevel": ec_level, "alignment": alignment
    })
    if cut:
        commands.append({"type": "feed", "units": 2})
        commands.append({"type": "cut", "percentage": "partial"})
    return print_commands(commands)


def print_barcode(data: str, barcode_type: str = "CODE128", height: int = 80,
                  width: int = 2, alignment: str = "center", cut: bool = True) -> dict:
    """バーコード印刷"""
    commands = [
        {
            "type": "barcode", "data": data, "barcodeType": barcode_type,
            "height": height, "width": width, "alignment": alignment,
            "textPosition": "below"
        },
    ]
    if cut:
        commands.append({"type": "feed", "units": 2})
        commands.append({"type": "cut", "percentage": "partial"})
    return print_commands(commands)


def get_status() -> dict:
    """プリンタステータス取得"""
    response = requests.get(f"{API_URL}/api/status")
    return response.json()


def main():
    args = sys.argv[1:]

    try:
        if not args:
            # デモ印刷
            print("=== テキスト印刷 ===")
            result = print_text("Hello, PrintAPI!\nこんにちは！", alignment="center", text_size=1)
            print(json.dumps(result, indent=2, ensure_ascii=False))

            print("\n=== QRコード印刷 ===")
            result = print_qrcode("https://example.com", label="サンプルQR")
            print(json.dumps(result, indent=2, ensure_ascii=False))

        elif args[0] == "--status":
            print("=== プリンタステータス ===")
            status = get_status()
            print(json.dumps(status, indent=2, ensure_ascii=False))

        elif args[0] == "--url":
            if len(args) < 2:
                print("使用法: python print-cli.py --url <image-url>")
                sys.exit(1)
            url = args[1]
            print(f"=== URL画像印刷: {url} ===")
            result = print_image_url(url)
            print(json.dumps(result, indent=2, ensure_ascii=False))

        elif args[0] == "--text":
            if len(args) < 2:
                print("使用法: python print-cli.py --text <message>")
                sys.exit(1)
            text = " ".join(args[1:])
            print(f"=== テキスト印刷 ===")
            result = print_text(text, alignment="center")
            print(json.dumps(result, indent=2, ensure_ascii=False))

        elif args[0] == "--qr":
            if len(args) < 2:
                print("使用法: python print-cli.py --qr <data>")
                sys.exit(1)
            data = args[1]
            print(f"=== QRコード印刷: {data} ===")
            result = print_qrcode(data)
            print(json.dumps(result, indent=2, ensure_ascii=False))

        elif args[0] == "--barcode":
            if len(args) < 2:
                print("使用法: python print-cli.py --barcode <data>")
                sys.exit(1)
            data = args[1]
            print(f"=== バーコード印刷: {data} ===")
            result = print_barcode(data)
            print(json.dumps(result, indent=2, ensure_ascii=False))

        else:
            # ファイルパスとして処理
            file_path = args[0]
            print(f"=== ファイル画像印刷: {file_path} ===")
            result = print_image_file(file_path)
            print(json.dumps(result, indent=2, ensure_ascii=False))

    except requests.exceptions.ConnectionError:
        print(f"エラー: PrintAPIサーバーに接続できません ({API_URL})")
        print("サーバーが起動しているか確認してください")
        sys.exit(1)
    except Exception as e:
        print(f"エラー: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
