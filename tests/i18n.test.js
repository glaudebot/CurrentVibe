import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STRINGS, defaultLang } from '../src/i18n.js';

test('defaultLang picks ko for Korean UI', () => {
  assert.equal(defaultLang('ko'), 'ko');
  assert.equal(defaultLang('ko-KR'), 'ko');
});

test('defaultLang picks en otherwise', () => {
  assert.equal(defaultLang('en-US'), 'en');
  assert.equal(defaultLang(''), 'en');
});

test('ko and en have identical keys', () => {
  assert.deepEqual(Object.keys(STRINGS.ko).sort(), Object.keys(STRINGS.en).sort());
  assert.equal(STRINGS.ko.copied, '복사됨');
  assert.equal(STRINGS.ko.retry, '다시 시도');
});
