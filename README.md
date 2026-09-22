# ThermalPrinterAPI

English | [日本語](README.ja.md)

A small tool for controlling a thermal printer through a browser GUI, HTTP API, or OSC.

Developed by IE3 for **Proto-rait**, exhibited at TOKYO PROTOTYPE. It lets an artwork's software trigger printing while providing a GUI for experimenting with paper width, image tones, and command sequences.

Designed for a **network setup with access to the CITIZEN CT-S255 XML Print service**. USB-only models and printers from other manufacturers have not been tested. This is not an official CITIZEN product.

## Features

- Print text, images, QR codes, and barcodes
- Combine printing, paper feed, and cutting commands
- Edit commands, preview JSON/XML, and save templates in the GUI
- Connect TouchDesigner, Max/MSP, or custom software through HTTP or OSC
- Resize images, apply Floyd–Steinberg dithering, and convert to monochrome or 16-level grayscale BMP
- Process print requests sequentially through a queue

## Architecture

```text
GUI / HTTP / OSC
       ↓
Node.js + Hono
       ↓
Image processing (Sharp) → XML generation (CITIZEN SDK)
       ↓
Printer's XML Print service
```

The GUI uses Vue 3 and Vite. The server is written in TypeScript.

## Requirements

- Node.js 22 or later and pnpm 9.15.0
- A CITIZEN printer with an accessible XML Print service, and a computer on the same LAN
- `cxmlp-api.js` from the CITIZEN POS Print SDK for JavaScript

The SDK has its own license. See the [official download page](https://www.citizen-systems.co.jp/printer/download/sdk/) and [third-party notices](THIRD_PARTY_NOTICES.md). **The SDK is not included in this repository.** Review and accept the vendor's terms, obtain the official distribution, and install its `Library/cxmlp-api.js` file as shown below.

## Getting started

```bash
git clone https://github.com/ie3jp/ThermalPrinterAPI.git
cd ThermalPrinterAPI
pnpm install --frozen-lockfile
pnpm sdk:install /path/to/CSJJavaScriptPOSSDK/Library/cxmlp-api.js
PRINTER_URL=http://192.168.1.100:8080/ pnpm dev
```

- GUI: `http://localhost:5173`
- HTTP API: `http://localhost:3456`
- OSC: UDP `9350` (the current default)

Enter `http://<printer-ip>:8080/` in the GUI's printer URL field. When the field is empty, and for OSC printing, the server uses the `PRINTER_URL` environment variable set at startup. Its default is `http://127.0.0.1:8080/`. `.env` files are not loaded automatically.

Use the `PORT` and `OSC_PORT` environment variables to change the listening ports.

```bash
PRINTER_URL=http://192.168.1.100:8080/ OSC_PORT=9000 pnpm dev
```

The Max/MSP examples shown in the GUI use port 9000. To use them unchanged, set the OSC port as above. If you change the HTTP API port, also update the proxy in `vite.config.ts` and any client connection settings. If the API port is already in use, the server tries the next available port; check the startup log for the actual port.

This tool is intended for development and exhibitions and allows printing over the LAN without authentication. Use it on a trusted network and do not expose the server directly to the internet.

## HTTP API examples

### Text and cutting

Replace `printerUrl` with your printer's address.

```bash
curl http://localhost:3456/api/print \
  -H 'Content-Type: application/json' \
  -d '{
    "printerUrl": "http://192.168.1.100:8080/",
    "commands": [
      {"type": "text", "data": "Hello from IE3!", "alignment": "center"},
      {"type": "feed", "units": 2},
      {"type": "cut", "percentage": "partial"}
    ]
  }'
```

### Images

Add an image command to the same `commands` array. `data` accepts an image URL or a Base64 string.

```json
{
  "type": "image",
  "data": "https://example.com/image.png",
  "width": 576,
  "alignment": "center",
  "mode": "mono"
}
```

`mono` produces 1-bit monochrome images; `gray` produces 4-bit, 16-level grayscale images. The reference width of 576 dots assumes 80 mm paper. Adjust it to your paper width and printer capabilities. BMP input bypasses conversion, so prepare it in a suitable format and size beforehand.

### Connection checks and XML preview

- `GET /health`: check whether the API server is running
- `GET /api/status?printerUrl=...`: check communication with the printer
- `POST /api/export/xml`: generate XML from the same command format used for printing

`/api/status` does not report every hardware condition, such as the amount of paper remaining.

## OSC

Send OSC messages to the IP address of the computer running the API server. The default port is UDP 9350.

| Address | Main arguments |
| --- | --- |
| `/print/text` | Text, alignment, attribute, horizontal scale, vertical scale |
| `/print/image` | Base64 image, width, alignment, mode |
| `/print/qrcode` | Text, module size, error correction level, alignment |
| `/print/barcode` | Text, type, height, width, alignment, text position |
| `/print/feed` | Feed amount |
| `/print/cut` | Cut method |
| `/print/json` | Command array as a JSON string |
| `/print/file` | Path to a JSON file on the server |

In TouchDesigner, strings such as text or JSON can be sent using OSC Out DAT. For Max/MSP, see [examples/PrintAPI-example.maxpat](examples/PrintAPI-example.maxpat) and match the destination port to your server.

## Examples and documentation

- [API reference](API_REFERENCE.md)
- [CLI examples](examples/)
- [Command list](docs/COMMANDS.md)
- [Original design specification](docs/SPECIFICATION.md)

Supporting documentation is primarily in Japanese. `docs/TASKS.md`, `docs/QA.md`, and `docs/XML_FLOW.md` are development records. Their task statuses, port numbers, or file layouts may differ from the current implementation. Refer to this README and the source code first.

## Building and checks

```bash
pnpm test
pnpm typecheck
pnpm build
pnpm start
```

After building, the server serves both the GUI and API at `http://localhost:3456`.

To build a macOS application locally:

```bash
pnpm package:mac
```

The output is `release/PrintAPI.app`. The current script bundles Node.js for Apple Silicon, starts the server in Terminal, and opens a browser. The app is not signed or notarized. **The generated application contains the CITIZEN SDK; do not redistribute it as-is.**

Verify print quality and behavior with your actual printer, paper, and network environment.

## License

Code written by IE3 is released under the [ISC License](LICENSE). This repository excludes the CITIZEN SDK, vendor reference samples, the previous repository history, and previously distributed application builds.

SDKs installed separately and third-party dependencies remain subject to their respective licenses. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for details.

Created by [IE3](https://ie3.jp/).
