'use strict';

// Cursor を拡張テストモードで起動し、pptx を開いたときの挙動を実機で確かめる。
// 実行は test/e2e/run.sh から。
const vscode = require('vscode');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** predicate が true になるまで待ち、かかった時間 (ms) を返す。timeoutMs を過ぎたら -1 */
async function waitFor(predicate, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (predicate()) return Date.now() - start;
    await sleep(50);
  }
  return -1;
}

const pptxTabs = () =>
  vscode.window.tabGroups.all.flatMap((group) => group.tabs).filter((tab) => tab.label.endsWith('.pptx'));

async function run() {
  // モーダルは右クリックメニューを塞ぐので使わない。呼ばれたら記録して失敗させる
  const modals = [];
  vscode.window.showInformationMessage = async (...args) => {
    modals.push(args);
    return undefined;
  };
  const picks = [];
  vscode.window.showQuickPick = async (items, options) => {
    picks.push({ items: await items, options, pptxTabsAtShow: pptxTabs().length });
    return undefined; // Esc と同じ扱い。外部アプリは起動させない
  };

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pptx-opener-e2e-'));
  const file = path.join(dir, 'サンプル資料.pptx');
  fs.writeFileSync(file, 'PK\u0003\u0004dummy');

  await vscode.commands.executeCommand('vscode.open', vscode.Uri.file(file));

  const pickMs = await waitFor(() => picks.length > 0, 10000);
  const closedMs = await waitFor(() => pptxTabs().length === 0, 5000);
  // 閉じたあとに復活しないことも見る
  await sleep(1000);
  console.log('[e2e] ポップアップまで:', pickMs, 'ms / タブが消えるまで:', closedMs, 'ms');
  console.log('[e2e] 残っている pptx タブ:', JSON.stringify(pptxTabs().map((tab) => ({
    label: tab.label,
    input: tab.input?.constructor?.name,
    viewType: tab.input?.viewType,
  }))));
  console.log('[e2e] ポップアップ:', JSON.stringify(picks));
  assert.deepEqual(pptxTabs(), [], 'pptx のタブが残っている');
  assert.deepEqual(modals, [], 'モーダルダイアログを出している');

  assert.equal(picks.length, 1, 'ポップアップは 1 回だけ出る');
  const [{ items, options, pptxTabsAtShow }] = picks;
  assert.equal(pptxTabsAtShow, 0, 'タブを閉じる前にポップアップを出すと、タブを閉じたときにフォーカスが外れて消えうる');
  assert.equal(options.placeHolder, 'サンプル資料.pptx を既定のアプリで開きますか？（Enter で開く / Esc でやめる）');
  assert.equal(items.length, 1);
  assert.match(items[0].label, /既定のアプリで開く/);
}

module.exports = { run };
