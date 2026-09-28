'use strict';

/**
 * OS ごとに「既定のアプリでファイルを開く」コマンドを返す。
 * パスはシェルを通さず 1 引数として渡すので、空白や記号を含んでもよい。
 * 対応外の OS では null を返し、呼び出し側で vscode.env.openExternal に任せる。
 */
function resolveOpenCommand(platform, filePath) {
  switch (platform) {
    case 'darwin':
      return { command: 'open', args: [filePath] };
    case 'linux':
      return { command: 'xdg-open', args: [filePath] };
    default:
      return null;
  }
}

module.exports = { resolveOpenCommand };
