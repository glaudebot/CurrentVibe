import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DOMParser } from 'linkedom';
import { parseTrending, formatCount } from '../src/trending.js';

const parser = new DOMParser();
const fixture = readFileSync(new URL('./fixtures/trending-daily.html', import.meta.url), 'utf8');

const row = (desc) => `<html><body><article class="Box-row">
  <h2 class="h3 lh-condensed"><a href="/a-b/c.d" class="Link"><span class="text-normal">a-b /</span> c.d</a></h2>
  ${desc}
  <div class="f6 color-fg-muted mt-2">
    <a href="/a-b/c.d/stargazers" class="Link">  46,367</a>
    <a href="/a-b/c.d/forks" class="Link">  3,180</a>
    <span class="d-inline-block float-sm-right">  8,726 stars this week</span>
  </div>
</article></body></html>`;

test('parses real fixture', () => {
  const repos = parseTrending(fixture, parser);
  assert.ok(repos.length >= 1 && repos.length <= 25, `length ${repos.length}`);
  repos.forEach((r, i) => {
    assert.equal(r.rank, i + 1);
    assert.match(r.name, /^[^/\s]+\/[^/\s]+$/);
    assert.equal(r.url, 'https://github.com/' + r.name);
    assert.ok(Number.isInteger(r.stars) && r.stars > 0, `stars ${r.stars}`);
    assert.ok(Number.isInteger(r.gain) && r.gain >= 0, `gain ${r.gain}`);
  });
});

test('parses handmade row', () => {
  const [r] = parseTrending(row('<p class="col-9">  Tools &amp; $& {{url}}  </p>'), parser);
  assert.deepEqual(r, {
    rank: 1, name: 'a-b/c.d', url: 'https://github.com/a-b/c.d',
    description: 'Tools & $& {{url}}', stars: 46367, gain: 8726,
  });
});

test('gain ignores star counts in description', () => {
  const html = row('<p class="col-9">Repos with 10,000 stars or more</p>');
  const [r] = parseTrending(html, parser);
  assert.equal(r.gain, 8726);
});

test('singular star gain', () => {
  const html = row('').replace('8,726 stars this week', '1 star today');
  const [r] = parseTrending(html, parser);
  assert.equal(r.gain, 1);
});

test('description ignores other paragraphs in row', () => {
  const html = row('<p class="col-9">Real description</p>')
    .replace('<h2', '<div class="float-right"><p class="mb-2">Lists</p></div><h2');
  const [r] = parseTrending(html, parser);
  assert.equal(r.description, 'Real description');
});

test('missing description', () => {
  const [r] = parseTrending(row(''), parser);
  assert.equal(r.description, '');
});

test('unknown markup', () => {
  assert.deepEqual(parseTrending('<html><body>hi</body></html>', parser), []);
});

test('formatCount', () => {
  assert.equal(formatCount(999), '999');
  assert.equal(formatCount(1200), '1.2k');
  assert.equal(formatCount(12400), '12.4k');
  assert.equal(formatCount(1000), '1k');
  assert.equal(formatCount(1234567), '1.2m');
});
