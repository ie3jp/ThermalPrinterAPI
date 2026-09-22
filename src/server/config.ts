/**
 * アプリケーション設定
 */

export const config = {
  printerUrl: process.env.PRINTER_URL || 'http://127.0.0.1:8080/',
  port: parseInt(process.env.PORT || '3456', 10),
  oscPort: parseInt(process.env.OSC_PORT || '9350', 10),
}
