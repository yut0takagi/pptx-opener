#!/usr/bin/env bash
# 使い捨てのプロファイルで Cursor を起動し、test/e2e/index.js を実行する。
# 普段使いの Cursor の設定・拡張には触れない。
set -euo pipefail

root="$(cd "$(dirname "$0")/../.." && pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

# Cursor 内のターミナルから実行すると Electron を Node として動かす変数が継承されるので外す
env -u ELECTRON_RUN_AS_NODE -u VSCODE_IPC_HOOK_CLI \
  "${CURSOR_BIN:-/Applications/Cursor.app/Contents/MacOS/Cursor}" \
  --user-data-dir="$tmp/user-data" \
  --extensions-dir="$tmp/extensions" \
  --disable-extensions \
  --disable-workspace-trust \
  --extensionDevelopmentPath="$root" \
  --extensionTestsPath="$root/test/e2e/index.js" \
  "$tmp"

# Webview を読み込み途中で閉じると、本体側にこのエラーが残る
if grep -rh 'Blocked vscode-webview request' "$tmp/user-data/logs" 2>/dev/null; then
  echo '[e2e] Webview を読み込み途中で閉じている' >&2
  exit 1
fi
