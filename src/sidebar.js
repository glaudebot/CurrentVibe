import { fetchTrending, formatCount } from './trending.js';
import { buildPrompt } from './prompt.js';
import { STRINGS, defaultLang } from './i18n.js';

const $list = document.getElementById('list');
const $tabs = [...document.querySelectorAll('#tabs button')];
const $langs = [...document.querySelectorAll('#lang button')];

let lang = defaultLang(chrome.i18n?.getUILanguage?.() ?? navigator.language);
let period = 'daily';
let view = { status: 'loading' }; // { status: 'loading' | 'error' | 'ok', repos? }
let token = 0;
const MAIN = 10; // top 10 shown first, the rest behind "show more"
let expanded = false;

const t = (k) => STRINGS[lang][k];

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

function img(name) {
  const i = el('img');
  i.src = `icons/${name}`;
  i.alt = '';
  return i;
}

const $toast = el('div', 'toast');
document.body.append($toast);
let toastTimer;
function toast(msg) {
  $toast.textContent = msg;
  $toast.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $toast.classList.remove('on'), 1600);
}

// content/done: text or node shown before and after copying.
function copyButton(cls, content, done, tip, toastKey, getText) {
  const b = el('button', cls);
  b.append(content);
  if (tip) b.dataset.tip = b.ariaLabel = tip;
  b.addEventListener('click', async () => {
    await navigator.clipboard.writeText(getText());
    toast(t(toastKey));
    b.replaceChildren(done);
    setTimeout(() => b.replaceChildren(content), 1500);
  });
  return b;
}

function renderItem(r) {
  const item = el('div', 'item');
  const top = el('div', 'row');
  const title = el('div', 'title');
  title.append(el('span', 'rank', r.rank), el('span', 'name', r.name));
  title.title = r.name;
  const stars = el('span', 'stars');
  stars.append(img('star.png'), formatCount(r.stars), el('span', 'gain', '+' + formatCount(r.gain)));
  top.append(title, stars);
  item.append(top);
  if (r.description) {
    const d = el('div', 'desc', r.description);
    d.title = r.description;
    item.append(d);
  }
  const actions = el('div', 'actions');
  const open = el('button', 'icon');
  open.append(img('link.png'));
  open.dataset.tip = open.ariaLabel = t('open');
  open.addEventListener('click', () => chrome.tabs.create({ url: r.url }));
  actions.append(
    open,
    copyButton('icon', img('copy.png'), img('check.svg'), t('copyUrl'), 'toastUrl', () => r.url),
    copyButton('primary', t('copyPrompt'), t('copied'), null, 'toastPrompt', () => buildPrompt(lang, r)),
  );
  item.append(actions);
  return item;
}

function render() {
  document.documentElement.lang = lang;
  for (const b of $langs) b.classList.toggle('on', b.dataset.lang === lang);
  for (const b of $tabs) {
    b.textContent = t(b.dataset.period);
    b.classList.toggle('on', b.dataset.period === period);
  }
  $list.replaceChildren();
  if (view.status === 'loading') {
    $list.append(el('div', 'state', t('loading')));
  } else if (view.status === 'error') {
    const s = el('div', 'state', t('error'));
    const retry = el('button', null, t('retry'));
    retry.addEventListener('click', () => load(period));
    s.append(el('br'), retry);
    $list.append(s);
  } else {
    const { repos } = view;
    $list.append(...(expanded ? repos : repos.slice(0, MAIN)).map(renderItem));
    if (!expanded && repos.length > MAIN) {
      const more = el('button', 'more', `${t('showMore')} (${repos.length - MAIN})`);
      more.addEventListener('click', () => { expanded = true; render(); });
      $list.append(more);
    }
  }
}

async function load(p) {
  period = p;
  expanded = false;
  const mine = ++token;
  view = { status: 'loading' };
  render();
  try {
    const repos = await fetchTrending(p);
    if (mine === token) view = { status: 'ok', repos };
  } catch (e) {
    console.error(e);
    if (mine === token) view = { status: 'error' };
  }
  if (mine === token) render();
}

for (const b of $tabs) b.addEventListener('click', () => load(b.dataset.period));
for (const b of $langs) b.addEventListener('click', () => {
  lang = b.dataset.lang;
  chrome.storage.local.set({ lang });
  render();
});

chrome.storage.local.get('lang').then(({ lang: saved }) => {
  if (saved === 'ko' || saved === 'en') lang = saved;
  load(period);
});
