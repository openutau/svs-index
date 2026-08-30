import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileUrlWebHost } from './file-url-validation.js';

test('file-host web pages are flagged with their hostname', () => {
  assert.equal(fileUrlWebHost('https://drive.google.com/file/d/abc/view'), 'drive.google.com');
  assert.equal(
    fileUrlWebHost('https://www.bowlroll.net/file/12345'),
    'bowlroll.net'
  );
  assert.equal(fileUrlWebHost('https://mega.nz/file/abc#xyz'), 'mega.nz');
  assert.equal(fileUrlWebHost('https://1drv.ms/u/s!abc'), '1drv.ms');
  assert.equal(
    fileUrlWebHost('https://onedrive.live.com/?id=abc'),
    'onedrive.live.com'
  );
});

test('dropbox is flagged unless dl=1', () => {
  assert.equal(
    fileUrlWebHost('https://www.dropbox.com/scl/fi/abc/f.zip?dl=0'),
    'dropbox.com'
  );
  assert.equal(fileUrlWebHost('https://www.dropbox.com/scl/fi/abc/f.zip'), 'dropbox.com');
  assert.equal(fileUrlWebHost('https://www.dropbox.com/scl/fi/abc/f.zip?dl=1'), null);
  // The CDN host that dl=1 redirects to is a direct file and must pass.
  assert.equal(
    fileUrlWebHost('https://dl.dropboxusercontent.com/cd/0/xyz/file'),
    null
  );
});

test('document extensions are flagged regardless of host', () => {
  assert.equal(fileUrlWebHost('https://example.com/page.html'), 'example.com');
  assert.equal(fileUrlWebHost('https://example.com/a/b.htm?x=1'), 'example.com');
  assert.equal(fileUrlWebHost('https://example.com/page.php'), 'example.com');
});

test('direct download links pass', () => {
  assert.equal(fileUrlWebHost('https://example.com/v1.zip'), null);
  assert.equal(
    fileUrlWebHost('https://github.com/u/r/releases/download/v1/f.zip'),
    null
  );
  assert.equal(
    fileUrlWebHost('https://www.mediafire.com/file/abc/name.zip/file'),
    null
  );
});

test('absent or unparseable urls are not this rule\'s concern', () => {
  assert.equal(fileUrlWebHost(null), null);
  assert.equal(fileUrlWebHost(''), null);
  assert.equal(fileUrlWebHost('not a url'), null);
});
