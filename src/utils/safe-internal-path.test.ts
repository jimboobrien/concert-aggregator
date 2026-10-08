import assert from 'node:assert/strict';
import { test } from 'node:test';
import { safeInternalPath } from './safe-internal-path.ts';

test('allows same-origin relative paths used after login', () => {
  assert.equal(safeInternalPath('/'), '/');
  assert.equal(safeInternalPath('/account'), '/account');
  assert.equal(safeInternalPath('/dashboard/import'), '/dashboard/import');
  assert.equal(safeInternalPath('/account?tab=profile'), '/account?tab=profile');
  assert.equal(safeInternalPath('/update-password'), '/update-password');
});

test('rejects the origin-concatenation userinfo attack', () => {
  assert.equal(safeInternalPath('@evil.example'), '/');
  assert.equal(safeInternalPath('@evil.example/phish'), '/');
});

test('rejects absolute and protocol-relative URLs', () => {
  assert.equal(safeInternalPath('https://evil.example/phish'), '/');
  assert.equal(safeInternalPath('http://evil.example/phish'), '/');
  assert.equal(safeInternalPath('//evil.example/phish'), '/');
  assert.equal(safeInternalPath('https://concert.example/account'), '/');
});

test('rejects backslash and scheme tricks that bypass a leading-slash check', () => {
  assert.equal(safeInternalPath('/\\evil.example'), '/');
  assert.equal(safeInternalPath('/\\\\evil.example'), '/');
  assert.equal(safeInternalPath('/https://evil.example'), '/');
  assert.equal(safeInternalPath('javascript:alert(1)'), '/');
});

test('rejects empty, missing, and control-character values', () => {
  assert.equal(safeInternalPath(null), '/');
  assert.equal(safeInternalPath(undefined), '/');
  assert.equal(safeInternalPath(''), '/');
  assert.equal(safeInternalPath('   '), '/');
  assert.equal(safeInternalPath('/account\nhttps://evil.example'), '/');
});

test('honors an explicit fallback', () => {
  assert.equal(safeInternalPath('https://evil.example', '/account'), '/account');
});
