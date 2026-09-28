# PPTX Opener

[English](#english) | [日本語](#日本語)

## English

VS Code and its forks (Cursor, VSCodium, ...) cannot display PowerPoint files. Clicking one leaves you with a "binary file" tab and nothing else.

PPTX Opener replaces that tab with a small popup at the top of the window. Press **Enter** and the file opens in your default app (PowerPoint, Keynote, ...). Press **Esc** to cancel. No tab is left behind either way.

### Supported files

`.pptx` / `.ppt` / `.pptm` / `.potx` / `.ppsx`

### Usage

- Click a PowerPoint file in the Explorer, then press **Enter** in the popup.
- Or right-click the file and choose **既定のアプリで開く** ("Open with default app"). This opens it right away, without the popup.

### Settings

- `pptxOpener.autoOpen` (default: `false`): skip the popup and open the file in the default app as soon as you click it.

### Notes

- The popup and menu labels are in Japanese.
- Only local files are supported. Files in remote workspaces (Remote-SSH, WSL, containers) cannot be opened in a local app.
- The file is opened with `open` on macOS and `xdg-open` on Linux. On Windows, VS Code's `openExternal` is used.
- To view the file as text anyway, right-click it and choose **Open With...** → **Text Editor**.

## 日本語

VS Code や Cursor などの派生エディタは、PowerPoint のファイルを表示できません。クリックしても「バイナリファイルのため表示できません」というタブが開くだけです。

PPTX Opener を入れると、そのタブの代わりに画面上部に小さなポップアップが出ます。**Enter** を押すと既定のアプリ（PowerPoint や Keynote など）でファイルが開き、**Esc** でやめられます。どちらを選んでもタブは残りません。

### 対象ファイル

`.pptx` / `.ppt` / `.pptm` / `.potx` / `.ppsx`

### 使い方

- エクスプローラーで PowerPoint のファイルをクリックし、ポップアップで **Enter** を押す
- ファイルを右クリックして「既定のアプリで開く」を選ぶと、ポップアップを出さずにすぐ開く

### 設定

- `pptxOpener.autoOpen`（既定値 `false`）: `true` にすると、ポップアップを出さずにクリックした時点で既定のアプリで開く

### 注意

- 外部アプリで開けるのはローカルのファイルだけです。リモート（Remote-SSH、WSL、コンテナ）上のファイルは開けません
- 使うコマンドは、macOS が `open`、Linux が `xdg-open` です。Windows では VS Code の `openExternal` を使います
- テキストとして中身を見たいときは、右クリックの「Open With...」から「Text Editor」を選んでください

## Development

```bash
npm test            # unit tests
./test/e2e/run.sh   # end-to-end test in a throwaway Cursor profile (macOS)
npm run package     # build pptx-opener.vsix
```

## License

MIT
