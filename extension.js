'use strict';

const vscode = require('vscode');
const crypto = require('crypto');
const path = require('path');
const { execFile } = require('child_process');
const { resolveOpenCommand } = require('./lib/open-command');

const VIEW_TYPE = 'pptxOpener.launcher';
const OPEN_LABEL = '$(link-external) 既定のアプリで開く';
// Webview が読み込み完了を知らせてこないときに、タブを閉じるまで待つ上限。
// 普段は読み込み完了の知らせで閉じるので、起動直後の遅いマシンでも読み込みを打ち切らない長さにする
const CLOSE_FALLBACK_MS = 3000;

function activate(context) {
  context.subscriptions.push(
    vscode.window.registerCustomEditorProvider(VIEW_TYPE, new LauncherProvider()),
    vscode.commands.registerCommand('pptxOpener.openExternally', (uri) => {
      if (!(uri instanceof vscode.Uri)) return false;
      return openExternally(uri);
    })
  );
}

function deactivate() {}

/**
 * pptx を開いたときに呼ばれる。タブは残さずに閉じ、画面上部にポップアップを出す。
 * ポップアップの項目は 1 つだけなので、Enter だけで外部アプリが起動する。
 *
 * モーダルダイアログにしないのは、エクスプローラーで二本指クリック（右クリック）しても
 * ファイルが開かれる環境があり、モーダルだと右クリックメニューを塞いでしまうため。
 */
class LauncherProvider {
  openCustomDocument(uri) {
    return { uri, dispose() {} };
  }

  resolveCustomEditor(document, panel) {
    let closed = false;
    const closeThenConfirm = async () => {
      if (closed) return;
      closed = true;
      clearTimeout(fallback);
      listener.dispose();
      await closeTab(document.uri, panel);
      // タブを閉じ終えてから出す。先に出すと、タブを閉じたときにフォーカスが外れて消えうる
      confirmAndOpen(document.uri);
    };

    // 読み込み途中で閉じると Webview の読み込みが中断され、本体側にエラーが残る。
    // 読み込み完了の知らせを受けてから閉じる
    const listener = panel.webview.onDidReceiveMessage(closeThenConfirm);
    const fallback = setTimeout(closeThenConfirm, CLOSE_FALLBACK_MS);
    // 読み込み前にユーザーがタブを閉じたら、ポップアップは出さない
    panel.onDidDispose(() => {
      if (closed) return;
      closed = true;
      clearTimeout(fallback);
      listener.dispose();
    });
    const nonce = crypto.randomBytes(16).toString('hex');
    panel.webview.options = { enableScripts: true };
    panel.webview.html = `<!DOCTYPE html><html><head><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}';"></head><body><script nonce="${nonce}">acquireVsCodeApi().postMessage('loaded');</script></body></html>`;
  }
}

/** 閉じ終わるまで待てるよう、panel.dispose() ではなくタブ API で閉じる */
async function closeTab(uri, panel) {
  const tab = vscode.window.tabGroups.all
    .flatMap((group) => group.tabs)
    .find((t) => t.input instanceof vscode.TabInputCustom
      && t.input.viewType === VIEW_TYPE
      && t.input.uri.toString() === uri.toString());
  if (tab) {
    await vscode.window.tabGroups.close(tab);
  } else {
    panel.dispose();
  }
}

async function confirmAndOpen(uri) {
  if (!vscode.workspace.getConfiguration('pptxOpener').get('autoOpen')) {
    const name = path.basename(uri.fsPath);
    const picked = await vscode.window.showQuickPick([{ label: OPEN_LABEL }], {
      placeHolder: `${name} を既定のアプリで開きますか？（Enter で開く / Esc でやめる）`,
    });
    if (!picked) return false;
  }
  return openExternally(uri);
}

/** 既定のアプリでファイルを開く。成功したら true を返す */
function openExternally(uri) {
  if (uri.scheme !== 'file') {
    vscode.window.showErrorMessage(`ローカルのファイルだけ開けます: ${uri.toString()}`);
    return Promise.resolve(false);
  }

  const cmd = resolveOpenCommand(process.platform, uri.fsPath);
  if (!cmd) {
    return Promise.resolve(vscode.env.openExternal(uri));
  }

  return new Promise((resolve) => {
    execFile(cmd.command, cmd.args, (err, _stdout, stderr) => {
      if (err) {
        const detail = (stderr || err.message).trim();
        vscode.window.showErrorMessage(`${path.basename(uri.fsPath)} を開けませんでした: ${detail}`);
        resolve(false);
        return;
      }
      resolve(true);
    });
  });
}

module.exports = { activate, deactivate };
