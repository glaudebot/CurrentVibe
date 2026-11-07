# CurrentVibe MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A Naver Whale sidebar extension that lists GitHub Trending (Daily/Weekly/Monthly) and copies an analyze-first AI prompt per repo. The extension is packaged for the Whale store.

**Architecture:** A Manifest V3 extension with `sidebar_action`. It uses plain ES modules and has no build step. `src/trending.js` fetches and parses `https://github.com/trending?since=<period>` through an injected `DOMParser`, so Node tests can pass linkedom's parser. `src/prompt.js` and `src/i18n.js` are pure modules. `src/sidebar.js` wires the UI together.

**Tech Stack:** HTML/CSS/JS (ES modules), Chrome extension APIs (`chrome.storage`, `chrome.tabs`), `navigator.clipboard`. Dev only: Node `node:test` and `linkedom`.

**Spec:** `docs/superpowers/specs/2026-11-07-currentvibe-design.md`

## Global Constraints

- Manifest V3 plus Whale `sidebar_action`. The shipped extension has no framework, no build step, no backend, no login, and no API key.
- `host_permissions`: `https://github.com/*` only. `permissions`: `storage` only.
- All fetch and parse code lives in `src/trending.js` (to be swapped for a backend later).
- Dark theme always: black background with purple accents, regardless of the Whale theme.
- The KOR/ENG toggle switches both the UI text and the copied prompt. The default is KOR if the browser UI language starts with `ko`, otherwise ENG. The last choice is saved in `chrome.storage.local` under the key `lang`.
- Prompt placeholders are exactly `{{name}}`, `{{url}}`, and `{{description}}`. The Korean prompt text is copied verbatim from the spec (Task 2).
- Cache: results are kept per period for 10 minutes (in memory, for the life of the sidebar page).
- Store package is a ZIP with only extension files (no `tests/`, `node_modules/`, `package.json`, `docs/`, `scripts/`). Icon is 128×128 PNG. Screenshots are 1–4 images at 1280×800, JPG or PNG.

## Review Focus

1. **A repo with no description:** the item has no description line, and the prompt has no `설명:`/`Description:` line. The words "undefined" and "null" never appear. Tests are in Task 1 and Task 2.
2. **A description with `$&`, `{{url}}`, or `&amp;`:** it appears literally (entities decoded once) and is never re-substituted. Tests are in Task 1 and Task 2.
3. **Numbers with commas** (`46,367`, `8,726 stars this week`) parse to integers. Display: `999`, `1.2k`, `12.4k`, `1.2m`. Test is in Task 1.
4. **GitHub changes its markup or returns an empty page:** `parseTrending` returns `[]`, and the sidebar shows the error state with "다시 시도", never a blank list. The test is in Task 1. Check it manually in Task 4.
5. **Network failure, non-200, or 429:** `fetchTrending` throws, and the sidebar shows the error state. Retry works. If the user switches tabs quickly, a late response must not overwrite the current tab. Check manually in Task 4.

---

### Task 1: Project setup + Trending parser

**Files:**
- Create: `package.json`, `.gitignore`, `src/trending.js`, `tests/trending.test.js`, `tests/fixtures/trending-daily.html`

**Interfaces:**
- Produces:
  - `parseTrending(html: string, domParser: { parseFromString(s, type) }): Repo[]`
  - `Repo = { rank: number, name: string /* "owner/repo" */, url: string, description: string /* "" if none */, stars: number, gain: number }`
  - `formatCount(n: number): string`
  - `fetchTrending(period: 'daily'|'weekly'|'monthly'): Promise<Repo[]>`. It uses the global `fetch` and `new DOMParser()`, plus a 10-minute in-memory cache. It throws `Error` on a non-OK response or when the parser returns `[]`.

- [ ] **Step 1: Set up the project.** `package.json`: `{"name":"currentvibe","private":true,"type":"module","scripts":{"test":"node --test tests/"}}`. Run `npm i -D linkedom`. In `.gitignore`, add `node_modules/`, `dist/`, `.superpowers/`. Save the fixture: `curl -sL "https://github.com/trending?since=daily" -o tests/fixtures/trending-daily.html`.

- [ ] **Step 2: Write failing tests** in `tests/trending.test.js` (`import { DOMParser } from 'linkedom'`).
  - `parses real fixture`: result length between 1 and 25. `rank` is 1..n in order. Every `name` matches `/^[^/\s]+\/[^/\s]+$/`. `url === 'https://github.com/' + name`. `stars` is an integer > 0. `gain` is an integer ≥ 0.
  - `parses handmade row`: inline HTML with one `<article class="Box-row">` whose `h2 a[href="/a-b/c.d"]`, `p` = `  Tools &amp; $& {{url}}  `, stargazers link text `46,367`, and the last span containing `8,726 stars this week`. Expect `{rank:1, name:'a-b/c.d', url:'https://github.com/a-b/c.d', description:'Tools & $& {{url}}', stars:46367, gain:8726}`.
  - `missing description`: the same row without `<p>` gives `description === ''`.
  - `unknown markup`: `parseTrending('<html><body>hi</body></html>', parser)` gives `[]`.
  - `formatCount`: `999→'999'`, `1200→'1.2k'`, `12400→'12.4k'`, `1000→'1k'`, `1234567→'1.2m'`.

- [ ] **Step 3: Run** `npm test`. Expected: FAIL (module not found).

- [ ] **Step 4: Implement `src/trending.js`.** Selectors, verified on 2026-11-07 markup:
  - Rows: `article.Box-row`.
  - Name: the `href` of `h2 a`, without the leading `/`.
  - Description: `p` text, trimmed.
  - Stars: text of `a[href$="/stargazers"]`.
  - Gain: the first `/([\d,]+) stars/` match in the row text.
  - Use `textContent` (not `innerHTML`) so entities decode once.
  - `fetchTrending` gets `https://github.com/trending?since=${period}`.

- [ ] **Step 5: Run** `npm test`. Expected: all PASS.

- [ ] **Step 6: Commit** `feat: trending parser and fetch`.

### Task 2: Prompt templates

**Files:**
- Create: `src/prompt.js`, `tests/prompt.test.js`

**Interfaces:**
- Consumes: `Repo` from Task 1.
- Produces: `PROMPTS: { ko: string, en: string }`, `buildPrompt(lang: 'ko'|'en', repo: Repo): string`

- [ ] **Step 1: Write failing tests.**
  - `ko fills placeholders`: the output contains `저장소: a/b`, `주소: https://github.com/a/b`, and `설명: hi`, and has no `{{`.
  - `en fills placeholders`: the same check with `Repository:`, `URL:`, and `Description:`.
  - `no description drops line`: with `description: ''`, the output has no line starting with `설명:` (ko) or `Description:` (en).
  - `special chars literal`: with `description: '$& {{url}}'`, the output contains `설명: $& {{url}}`, and `https://github.com/a/b` appears exactly once.
  - `analyze-first`: `ko` contains `아직 코드나 설정을 수정하지 마`. `en` contains `Do not modify any code or settings yet`.

- [ ] **Step 2: Run** `npm test`. Expected: FAIL.

- [ ] **Step 3: Implement.** Fill all placeholders in a single pass, `tpl.replace(/\{\{(name|url|description)\}\}/g, (_, k) => values[k])`. A single pass means values are never re-scanned and `$` patterns are never interpreted. When the description is empty, first remove the whole line that contains `{{description}}`.

  `PROMPTS.ko` is the spec's §4 Korean prompt, verbatim (including the README line). `PROMPTS.en` is the following:
  ```
  Analyze the GitHub repository below. Do not modify any code or settings yet.

  Repository: {{name}}
  URL: {{url}}
  Description: {{description}}

  Report in this order:
  1. Summary: what this repository is and how it works
  2. Applicability: whether it can be applied to my current project and environment, and why
  3. Supported environments: which AI tools or environments it works with (e.g. Claude Code CLI, Claude desktop app, claude.ai web, Cursor, ChatGPT, Codex), and its install form (skill, plugin, MCP server, library, etc.)
  4. Benefits: what I gain by applying it
  5. How to apply: outline of steps and expected scope of changes, plus downsides and cautions

  If you cannot open the URL above, do not guess. Ask me to paste the README instead.
  If you cannot see my project or environment, ask about my environment (AI tools, languages, frameworks) before answering item 2.

  When the analysis is done, ask me whether to apply it, and change nothing until I approve.
  ```

- [ ] **Step 4: Run** `npm test`. Expected: PASS.

- [ ] **Step 5: Commit** `feat: analyze-first prompt templates`.

### Task 3: UI strings + default language

**Files:**
- Create: `src/i18n.js`, `tests/i18n.test.js`

**Interfaces:**
- Produces:
  - `STRINGS: { ko: Record<Key,string>, en: Record<Key,string> }`
  - `defaultLang(uiLang: string): 'ko'|'en'`

  Keys and their ko / en values:
  - `daily`: `Daily` / `Daily`
  - `weekly`: `Weekly` / `Weekly`
  - `monthly`: `Monthly` / `Monthly`
  - `copyPrompt`: `프롬프트 복사` / `Copy prompt`
  - `copied`: `복사됨 ✓` / `Copied ✓`
  - `open`: `열기` / `Open`
  - `copyUrl`: `주소 복사` / `Copy URL`
  - `loading`: `불러오는 중…` / `Loading…`
  - `error`: `순위를 불러오지 못했어요.` / `Couldn't load trending repos.`
  - `retry`: `다시 시도` / `Retry`

- [ ] **Step 1: Write failing tests.**
  - `defaultLang('ko')`, `defaultLang('ko-KR')` → `'ko'`.
  - `defaultLang('en-US')`, `defaultLang('')` → `'en'`.
  - `ko` and `en` have identical key sets.

- [ ] **Step 2: Run** `npm test`. Expected: FAIL.

- [ ] **Step 3: Implement.**

- [ ] **Step 4: Run** `npm test`. Expected: PASS.

- [ ] **Step 5: Commit** `feat: ui strings and default language`.

### Task 4: Manifest + sidebar UI

**Files:**
- Create: `manifest.json`, `sidebar.html`, `sidebar.css`, `src/sidebar.js`, `icons/icon16.png`, `icons/icon48.png`, `icons/icon128.png`, `icons/icon.svg`

**Interfaces:**
- Consumes: `fetchTrending`, `formatCount` (Task 1), `buildPrompt` (Task 2), `STRINGS`, `defaultLang` (Task 3).

- [ ] **Step 1: Write `manifest.json`.**
  - `manifest_version: 3`, `name: "CurrentVibe"`, `version: "1.0.0"`.
  - Description: `"GitHub Trending in your Whale sidebar, with analyze-first AI prompts."`
  - `icons` 16/48/128.
  - `permissions: ["storage"]`, `host_permissions: ["https://github.com/*"]`.
  - `sidebar_action: { default_page: "sidebar.html", default_title: "CurrentVibe", default_icon: { "16": "icons/icon16.png", "48": "icons/icon48.png" } }`.

- [ ] **Step 2: Make the icons.** Make `icons/icon.svg`: a simple purple mark on black. Export PNGs at 16, 48, and 128px by drawing the SVG to a canvas in the browser pane and saving `toDataURL('image/png')`. Check that the PNG headers report the right sizes.

- [ ] **Step 3: Build the sidebar.**
  - `sidebar.html` loads `sidebar.css` and `<script type="module" src="src/sidebar.js">`.
  - Layout A: tabs at the top, and a KOR/ENG toggle at the top right.
  - Each row shows the rank, `owner/repo`, `⭐ formatCount(stars)`, and `+formatCount(gain)` in purple.
  - The description is one line with an ellipsis (`white-space:nowrap; overflow:hidden; text-overflow:ellipsis`). It is omitted when the description is empty.
  - Row actions:
    - 🔗 runs `chrome.tabs.create({url})`.
    - 📋 copies the URL.
    - The highlighted `copyPrompt` button runs `navigator.clipboard.writeText(buildPrompt(lang, repo))`.
    - After a copy, the button text shows `copied` for 1.5s.
  - Loading and error states use the strings from Task 3. The retry button calls `load(period)` again.
  - An empty array or a thrown error both show the error state.
  - Ignore a response whose period is no longer the active tab (request token).
  - Language changes write `chrome.storage.local.set({lang})` and re-render in place, without refetching.
  - Build all row content with `textContent`, never with `innerHTML`.

- [ ] **Step 4: Check it in real Whale (user, manual).** Go to `whale://extensions`, turn on developer mode, and use "Load unpacked" on the project folder. Open the sidebar and confirm:
  - All three tabs load.
  - Rows match github.com/trending.
  - Open, copy URL, and copy prompt each work. Paste to check.
  - KOR/ENG switches both the labels and the pasted prompt, and the choice persists after closing and reopening the sidebar.
  - With the network disconnected, the error state and retry appear.
  - Clicking tabs quickly never shows the wrong period.

- [ ] **Step 5: Commit** `feat: whale sidebar ui`.

### Task 5: Store package + submission assets

**Files:**
- Create: `scripts/pack.ps1`, `docs/store/listing.md`, `docs/store/screenshot-1.png`, `docs/store/screenshot-2.png`
- Modify: `package.json` (add `"pack": "powershell -File scripts/pack.ps1"`)

- [ ] **Step 1: Write `scripts/pack.ps1`.** It copies `manifest.json`, `sidebar.html`, `sidebar.css`, `src/`, and `icons/` (excluding `icons/icon.svg`) to a temp folder. Then it runs `Compress-Archive` to `dist/currentvibe-<version>.zip`, reading the version from the manifest.

- [ ] **Step 2: Verify the package.** Run `npm run pack`, then list the ZIP entries. Expected: `manifest.json` at the ZIP root, and no `tests/`, `node_modules/`, `package.json`, or `docs/`. Load the unzipped folder in Whale once more and confirm the sidebar works.

- [ ] **Step 3: Make the screenshots.** Make two 1280×800 PNGs: the list (Daily, KOR), and the copy-prompt moment showing `복사됨 ✓`. Use captures of the real Whale sidebar on a dark canvas. Confirm the sizes from the PNG headers.

- [ ] **Step 4: Write `docs/store/listing.md`.** It holds the ko/en store name, a short description, and a long description. State that the extension reads only github.com/trending and stores only the language choice.

- [ ] **Step 5: Verify the prompt.** Paste the ko and en prompts for one real repo into two AI tools (for example Claude Code and ChatGPT). Pass means each tool gives sections 1–5 and then asks before changing anything. If a tool fails, fix the wording in Task 2 and re-run `npm test`. The user gives the final sign-off.

- [ ] **Step 6: Commit** `chore: store package and listing assets`. The user creates the store account and submits.
