// All GitHub Trending fetch/parse code lives here (swap for a backend later).

const toInt = (s) => parseInt(String(s).replace(/[^\d]/g, ''), 10) || 0;

export function parseTrending(html, domParser) {
  const doc = domParser.parseFromString(html, 'text/html');
  const repos = [];
  for (const row of doc.querySelectorAll('article.Box-row')) {
    const href = row.querySelector('h2 a')?.getAttribute('href');
    if (!href) continue;
    const name = href.replace(/^\//, '');
    const gain = (row.textContent.match(/([\d,]+) stars? (today|this week|this month)/) || [])[1];
    repos.push({
      rank: repos.length + 1,
      name,
      url: 'https://github.com/' + name,
      description: row.querySelector('p.col-9')?.textContent.trim() ?? '',
      stars: toInt(row.querySelector('a[href$="/stargazers"]')?.textContent),
      gain: toInt(gain),
    });
  }
  return repos;
}

export function formatCount(n) {
  const fmt = (v, unit) => (Math.round(v * 10) / 10).toString() + unit;
  if (n >= 1e6) return fmt(n / 1e6, 'm');
  if (n >= 1e3) return fmt(n / 1e3, 'k');
  return String(n);
}

const TTL = 10 * 60 * 1000;
const cache = new Map();

export async function fetchTrending(period) {
  const hit = cache.get(period);
  if (hit && Date.now() - hit.at < TTL) return hit.repos;
  // No cookies: logged-in GitHub serves different row markup.
  const res = await fetch(`https://github.com/trending?since=${period}`, { credentials: 'omit' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const repos = parseTrending(await res.text(), new DOMParser());
  if (!repos.length) throw new Error('No repositories found');
  cache.set(period, { at: Date.now(), repos });
  return repos;
}
