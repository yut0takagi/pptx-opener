'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { resolveOpenCommand } = require('../lib/open-command');

test('macOS では open にパスを 1 引数で渡す', () => {
  assert.deepEqual(resolveOpenCommand('darwin', '/Users/me/My Deck (final).pptx'), {
    command: 'open',
    args: ['/Users/me/My Deck (final).pptx'],
  });
});

test('Linux では xdg-open を使う', () => {
  assert.deepEqual(resolveOpenCommand('linux', '/tmp/a.pptx'), {
    command: 'xdg-open',
    args: ['/tmp/a.pptx'],
  });
});

test('対応外の OS では null を返す', () => {
  assert.equal(resolveOpenCommand('win32', 'C:\\a.pptx'), null);
});
