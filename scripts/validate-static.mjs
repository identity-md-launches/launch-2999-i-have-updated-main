// Production-export smoke tests. No game instrumentation, backend mocks or writes to dist/.
// Install Playwright separately and pass its index.mjs as the first argument.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, stat, writeFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve('dist');
const output = resolve('test/scratch/validation');
await mkdir(`${output}/shots`, { recursive: true });
const html = await readFile(`${root}/index.html`, 'utf8');
assert.match(html, /<title>Squeek Life/);
assert.match(html, /name="description"/);
assert.match(html, /property="og:title"/);
assert.match(html, /property="og:image"/);
assert.match(html, /name="squeekchain-project" content="e8f5e568-69c8-4f8f-af6c-fcc13af273c0"/);
for (const [, url] of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
  if (/^(https?:|data:)/.test(url)) continue;
  assert(!url.startsWith('/'), `Non-portable HTML asset: ${url}`);
  assert((await stat(resolve(root, url))).isFile(), `Missing HTML asset: ${url}`);
}
const social = html.match(/property="og:image" content="([^"]+)"/)[1];
assert((await stat(resolve(root, social))).isFile(), 'Missing social image');
console.log('Static metadata and HTML asset references: PASS');

if (!process.argv[2]) {
  console.log('Browser checks not run. Pass the path to a separately installed playwright/index.mjs.');
  process.exit(0);
}
const { chromium, webkit } = await import(pathToFileURL(resolve(process.argv[2])).href);
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff': 'font/woff', '.woff2': 'font/woff2' };
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://preview.local').pathname);
    if (!pathname.startsWith('/preview/')) { res.writeHead(404).end(); return; }
    if (pathname.startsWith('/preview/api/')) { res.writeHead(404, { 'content-type': 'application/json' }).end('{"error":"Optional backend is offline"}'); return; }
    const file = resolve(root, pathname.slice('/preview/'.length) || 'index.html');
    if (!file.startsWith(root + sep)) { res.writeHead(403).end(); return; }
    const data = await readFile(file);
    res.writeHead(200, { 'content-type': mime[extname(file)] || 'application/octet-stream' }).end(data);
  } catch { res.writeHead(404).end(); }
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const origin = `http://127.0.0.1:${server.address().port}`;
const results = [];
const check = async (name, fn) => {
  try { const detail = await fn(); results.push({ name, passed: true, detail }); console.log(`PASS ${name}`, detail ?? ''); }
  catch (error) { results.push({ name, passed: false, detail: error.message }); console.log(`FAIL ${name}: ${error.message}`); }
};

try {
  for (const [engine, type] of [['chromium', chromium], ['webkit', webkit]]) {
    let browser;
    try { browser = await type.launch({ headless: true }); }
    catch (error) { results.push({ name: `${engine} availability`, skipped: true, detail: error.message }); console.log(`UNAVAILABLE ${engine}: ${error.message.slice(0, 250)}`); continue; }
    try {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      if (engine === 'chromium') await context.grantPermissions(['clipboard-read', 'clipboard-write']);
      const page = await context.newPage();
      page.setDefaultTimeout(5000);
      const errors = [], resourceFailures = [], apiResponses = [], external = new Set(), saves = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('response', response => {
        if (response.url().includes('/preview/api/')) apiResponses.push({ path: new URL(response.url()).pathname, status: response.status() });
        else if (response.url().startsWith(origin) && response.status() >= 400) resourceFailures.push(`${response.status()} ${response.url()}`);
      });
      page.on('request', request => {
        if (request.url().endsWith('/api/progress/save')) saves.push(request.postDataJSON());
      });
      await page.route('**/*', route => {
        const url = route.request().url();
        if (url.startsWith(origin) || /^(data:|blob:)/.test(url)) return route.continue();
        external.add(new URL(url).host);
        return route.abort(); // Verify the game with no external services.
      });
      await page.goto(`${origin}/preview/`, { waitUntil: 'load' });
      await page.getByRole('button', { name: 'New game', exact: true }).waitFor();
      await page.evaluate(() => document.fonts.ready);

      for (const [width, height] of [[320, 700], [390, 844], [768, 900], [1440, 900]]) {
        await page.setViewportSize({ width, height });
        await check(`${engine} first screen at ${width}`, async () => {
          const box = await page.getByRole('button', { name: 'New game', exact: true }).boundingBox();
          const heading = await page.getByRole('heading', { name: 'SQUEEK LIFE', exact: true }).boundingBox();
          const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
          assert(heading && heading.y >= 0 && heading.y + heading.height <= height);
          assert(box && box.x >= 0 && box.x + box.width <= width && box.y + box.height <= height, 'Primary action outside first screen');
          assert(overflow <= 1, `Horizontal overflow: ${overflow}`);
          await page.screenshot({ path: `${output}/shots/${engine}-menu-${width}.png` });
          return { heading, action: box, horizontalOverflow: overflow };
        });
      }
      await check(`${engine} font files`, async () => {
        const fonts = await page.evaluate(() => ({ pixel: document.fonts.check('26px "Press Start 2P"'), body: document.fonts.check('13px "Be Vietnam Pro"') }));
        assert(fonts.pixel && fonts.body); return fonts;
      });
      await check(`${engine} optional wallet fallback`, async () => {
        await page.getByRole('button', { name: 'Connect wallet', exact: true }).click();
        await page.getByText('No EVM wallet found in this browser.', { exact: false }).waitFor();
      });
      await check(`${engine} share panel and thread`, async () => {
        await page.getByRole('button', { name: 'Share this game on X', exact: true }).click();
        await page.getByRole('button', { name: 'Thread · 5 posts', exact: true }).click();
        assert.equal(await page.getByRole('button', { name: 'Copy', exact: true }).count(), 5);
        if (engine === 'chromium') {
          await page.getByRole('button', { name: 'Copy link', exact: true }).click();
          await page.getByRole('button', { name: 'Link copied', exact: true }).waitFor();
          assert.match(await page.evaluate(() => navigator.clipboard.readText()), /^https:\/\//);
        }
        await page.getByRole('button', { name: 'Close', exact: true }).click();
      });
      await check(`${engine} keyboard starts a named game`, async () => {
        await page.getByRole('textbox', { name: 'Character name' }).fill('Browser check');
        const start = page.getByRole('button', { name: 'New game', exact: true });
        await start.focus();
        await page.screenshot({ path: `${output}/shots/${engine}-keyboard-focus.png` });
        await start.press('Enter');
        await page.getByText('Squeek wakes up in the slums.', { exact: false }).waitFor();
        await page.keyboard.press('e');
        await page.getByText('A rich rat strolls past', { exact: false }).waitFor();
        await page.keyboard.press('e');
        await page.getByText('Squeek grits his teeth.', { exact: false }).waitFor();
        await page.keyboard.press('e');
        await page.getByText('Squeek grits his teeth.', { exact: false }).waitFor({ state: 'hidden' });
        assert.equal(await page.evaluate(() => localStorage.getItem('squeek.name')), 'Browser check');
        assert.equal(await page.locator('canvas').count(), 1);
      });
      const snapshot = async () => {
        const n = saves.length;
        await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
        for (let i = 0; i < 20 && saves.length === n; i++) await page.waitForTimeout(25);
        assert(saves.length > n, 'No real save request observed');
        return saves.at(-1).state;
      };
      await check(`${engine} keyboard movement`, async () => {
        const before = await snapshot();
        await page.keyboard.down('ArrowRight');
        await page.waitForTimeout(450);
        await page.keyboard.up('ArrowRight');
        const after = await snapshot();
        assert(after.pos.x > before.pos.x, 'ArrowRight did not move the character');
        return { before: before.pos, after: after.pos };
      });
      await check(`${engine} mute toggle`, async () => {
        await page.locator('button[title="Sound on — click to mute"]').click();
        await page.locator('button[title="Sound off — click for music"]').waitFor();
        assert.equal(await page.evaluate(() => localStorage.getItem('squeek.muted')), '1');
      });
      for (const [icon, heading] of [['list-ordered', 'QUESTS & ACHIEVEMENTS'], ['house', "SQUEEK'S FLAT"], ['trophy', 'LEADERBOARD'], ['radio', 'SQUEEKCHAIN · LIVE']]) {
        await check(`${engine} ${heading} panel`, async () => {
          await page.locator(`button:has(svg.lucide-${icon})`).first().click();
          await page.getByRole('heading', { name: heading, exact: true }).waitFor();
          if (icon === 'radio') await page.getByText('Could not reach the Squeekchain API.', { exact: false }).waitFor();
          if (icon === 'trophy') await page.getByText('Nobody on the board yet', { exact: false }).waitFor({ timeout: 15000 });
          await page.screenshot({ path: `${output}/shots/${engine}-${icon}-panel.png` });
          await page.keyboard.press('Escape');
          await page.getByRole('heading', { name: heading, exact: true }).waitFor({ state: 'hidden' });
        });
      }
      await page.setViewportSize({ width: 390, height: 844 });
      await check(`${engine} touch movement`, async () => {
        const before = await snapshot();
        const target = page.getByRole('button', { name: '▶', exact: true });
        const box = await target.boundingBox();
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.waitForTimeout(450);
        await page.mouse.up();
        const after = await snapshot();
        assert(after.pos.x > before.pos.x, 'Pointer control did not move the character');
        await page.screenshot({ path: `${output}/shots/${engine}-game-390.png` });
        return { before: before.pos, after: after.pos };
      });
      await page.setViewportSize({ width: 1200, height: 630 });
      await page.screenshot({ path: `${output}/shots/${engine}-social.png` });
      await check(`${engine} Menu pointer target`, async () => {
        await page.getByRole('button', { name: 'Menu', exact: true }).click();
      });
      await check(`${engine} keyboard exit without backend`, async () => {
        const menu = page.getByRole('button', { name: 'Menu', exact: true });
        if (await menu.isVisible()) {
          await menu.focus();
          await menu.press('Enter');
        }
        await page.getByRole('button', { name: 'New game', exact: true }).waitFor();
        await page.getByText('Checking saved progress…').waitFor({ state: 'hidden' });
        assert.equal(await page.getByRole('button', { name: /^Continue · Ch/ }).count(), 0);
      });
      await check(`${engine} script and local asset errors`, async () => {
        assert.deepEqual(errors, []); assert.deepEqual(resourceFailures, []);
        return { pageErrors: errors, missingAssets: resourceFailures, externalBlocked: [...external], optionalBackendResponses: apiResponses };
      });
      await context.close();
    } finally { await browser.close(); }
  }
} finally {
  server.closeAllConnections();
  await new Promise(done => server.close(done));
  await writeFile(`${output}/results.json`, JSON.stringify(results, null, 2) + '\n');
}
console.log(`${results.filter(x => x.passed).length} passed, ${results.filter(x => x.passed === false).length} failed, ${results.filter(x => x.skipped).length} unavailable`);
if (results.some(x => x.passed === false)) process.exitCode = 1;
