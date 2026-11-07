import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPrompt } from '../src/prompt.js';

const repo = (description = 'hi') => ({
  rank: 1, name: 'a/b', url: 'https://github.com/a/b', description, stars: 1, gain: 1,
});

test('ko fills placeholders', () => {
  const p = buildPrompt('ko', repo());
  assert.ok(p.includes('저장소: a/b'));
  assert.ok(p.includes('주소: https://github.com/a/b'));
  assert.ok(p.includes('설명: hi'));
  assert.ok(!p.includes('{{'));
});

test('en fills placeholders', () => {
  const p = buildPrompt('en', repo());
  assert.ok(p.includes('Repository: a/b'));
  assert.ok(p.includes('URL: https://github.com/a/b'));
  assert.ok(p.includes('Description: hi'));
  assert.ok(!p.includes('{{'));
});

test('no description drops line', () => {
  assert.ok(!/^설명:/m.test(buildPrompt('ko', repo(''))));
  assert.ok(!/^Description:/m.test(buildPrompt('en', repo(''))));
});

test('special chars literal', () => {
  const p = buildPrompt('ko', repo('$& {{url}}'));
  assert.ok(p.includes('설명: $& {{url}}'));
  assert.equal(p.split('https://github.com/a/b').length - 1, 1);
});

test('analyze-first', () => {
  assert.ok(buildPrompt('ko', repo()).includes('아직 코드나 설정을 수정하지 마'));
  assert.ok(buildPrompt('en', repo()).includes('Do not modify any code or settings yet'));
});
