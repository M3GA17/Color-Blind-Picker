import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import assert from 'node:assert/strict';

if (process.platform !== 'win32') throw Error('Documentation screenshots require the Windows desktop app.');

const assets = resolve('docs/assets');
const work = resolve('test-results/docs');
const profile = join(work, `profile-${Date.now()}`);
await mkdir(assets, { recursive: true });
await mkdir(profile, { recursive: true });
const seed = {
  settings: { language: 'en', format: 'hex', alwaysOnTop: false, historyOpen: false },
  history: ['#EB4064', '#0252A9', '#FCC31D', '#41DBD9'].map((hex, index) => ({ id: 1001 + index, hex, capturedAt: 1792058400000 - index * 60000 })),
};
await writeFile(join(profile, 'state.json'), JSON.stringify(seed));

let processHandle;
let browser;
let main;
let showcase;
const pageErrors = [];
const port = 9228;
const generated = [];

try {
  processHandle = spawn(resolve('src-tauri/target/debug/color-blind-picker.exe'), [], {
    windowsHide: true,
    env: { ...process.env, CBP_TEST_DATA_DIR: profile, WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: `--remote-debugging-port=${port}` },
    stdio: ['ignore', 'ignore', 'pipe'],
  });
  processHandle.on('error', error => pageErrors.push(error.message));
  const deadline = Date.now() + 20000;
  while (true) {
    try { if ((await fetch(`http://127.0.0.1:${port}/json/version`)).ok) break; } catch {}
    if (Date.now() > deadline) throw Error('Could not start the screenshot app. Close any running picker and retry.');
    await new Promise(done => setTimeout(done, 200));
  }
  browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`);
  const context = browser.contexts()[0];
  main = context.pages()[0] ?? await context.waitForEvent('page');
  main.on('pageerror', error => pageErrors.push(error.message));
  await main.getByRole('button', { name: 'Pick a color', exact: true }).waitFor();
  const nativeState = await main.evaluate(() => window.__TAURI_INTERNALS__.invoke('load_state'));
  const example = nativeState.history[0].color;
  const displayLabel = color => color.description.en ? `${color.name.en} · ${color.description.en}` : color.name.en;
  assert.equal(example.hex, '#EB4064');
  // Freeze only live sampling for consistent documentation. All UI, color names,
  // settings, clipboard, history and actions remain the real desktop app.
  async function freezeSample(page, sample) {
    await page.evaluate(sample => {
      const original = window.fetch.bind(window);
      window.fetch = (input, options) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
        if (url === 'http://ipc.localhost/sample_color') {
          return Promise.resolve(new Response(JSON.stringify(sample), {
            headers: { 'Content-Type': 'application/json', 'Tauri-Response': 'ok' },
          }));
        }
        return original(input, options);
      };
    }, sample);
  }
  await freezeSample(main, example);
  await main.getByRole('heading', { name: example.name.en, exact: true }).waitFor();

  async function shot(name) {
    await main.mouse.move(2, 2);
    await main.evaluate(() => document.activeElement instanceof HTMLElement && document.activeElement.blur());
    await main.waitForFunction(() => !document.querySelector('.button.primary')?.disabled);
    const cdp = await context.newCDPSession(main);
    const height = await main.locator('.picker').evaluate(element => Math.ceil(element.getBoundingClientRect().height));
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 380, height, deviceScaleFactor: 2, mobile: false });
    await main.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))));
    await main.locator('.picker').screenshot({ path: join(assets, `${name}.png`), omitBackground: true });
    await cdp.send('Emulation.clearDeviceMetricsOverride');
    await cdp.detach();
    generated.push(`${name}.png`);
  }

  await shot('compact');
  await main.getByRole('button', { name: 'History', exact: true }).click();
  await main.locator('.history-row').nth(3).waitFor();
  await shot('history');

  await main.getByRole('button', { name: `More actions: ${displayLabel(example)}`, exact: true }).click();
  await main.getByRole('button', { name: 'Delete color', exact: true }).waitFor();
  await shot('history-actions');
  await main.getByRole('button', { name: 'Delete color', exact: true }).click();
  await main.getByRole('button', { name: 'Undo', exact: true }).waitFor();
  await shot('undo');
  await main.getByRole('button', { name: 'Undo', exact: true }).click();
  await main.locator('.history-row').nth(3).waitFor();
  await main.getByRole('status').waitFor({ state: 'hidden' });
  await main.getByRole('button', { name: 'History', exact: true }).click();
  await main.getByRole('button', { name: 'Settings', exact: true }).click();
  await main.getByRole('combobox', { name: 'Copy format', exact: true }).selectOption('rgb');
  await main.getByRole('combobox', { name: 'Copy format', exact: true }).waitFor();
  await shot('settings');
  await main.getByRole('button', { name: 'Settings', exact: true }).click();
  await main.getByRole('button', { name: 'Always on top', exact: true }).click();
  await main.getByRole('status').filter({ hasText: 'Always on top enabled' }).waitFor();
  await shot('pinned');
  await main.getByRole('button', { name: 'Copy rgb(235, 64, 100)', exact: true }).click();
  await main.getByRole('status').filter({ hasText: 'Copied' }).waitFor();
  await shot('copy-rgb');

  const newPage = context.waitForEvent('page');
  await main.getByRole('button', { name: 'Pick a color', exact: true }).click();
  const overlay = await newPage;
  overlay.on('pageerror', error => pageErrors.push(error.message));
  await overlay.locator('.capture-surface').waitFor();
  const cyan = nativeState.history.find(entry => entry.color.hex === '#41DBD9').color;
  await freezeSample(overlay, cyan);
  const overlayCdp = await context.newCDPSession(overlay);
  await overlayCdp.send('Emulation.setDeviceMetricsOverride', { width: 1200, height: 600, deviceScaleFactor: 1.5, mobile: false });
  // A documentation-only palette behind the unchanged transparent overlay keeps
  // screenshots private and makes the real capture tooltip easy to understand.
  await overlay.evaluate(colors => {
    document.documentElement.style.background = '#111315';
    const palette = document.createElement('div');
    palette.setAttribute('aria-hidden', 'true');
    palette.style.cssText = 'position:fixed;inset:90px 80px 90px;display:grid;grid-template-columns:repeat(4,1fr);gap:16px;pointer-events:none';
    for (const [hex, name] of colors) {
      const cell = document.createElement('div');
      cell.style.cssText = 'border-radius:16px;overflow:hidden;background:#202326;display:flex;flex-direction:column';
      const color = document.createElement('div');
      color.style.cssText = `background:${hex};flex:1`;
      const label = document.createElement('div');
      label.style.cssText = 'padding:18px;color:#f5f6f7;font:14px Segoe UI,sans-serif;display:grid;gap:5px';
      const title = document.createElement('span'); title.textContent = name;
      const code = document.createElement('span'); code.textContent = hex; code.style.cssText = 'font:12px Consolas,monospace;color:#b4bbc2';
      label.append(title, code); cell.append(color, label); palette.append(cell);
    }
    document.body.prepend(palette);
  }, nativeState.history.map(entry => [entry.color.hex, displayLabel(entry.color)]));
  await overlay.mouse.move(960, 260);
  await overlay.locator('.capture-tooltip strong').filter({ hasText: displayLabel(cyan) }).waitFor();
  await overlay.screenshot({ path: join(assets, 'capture.png'), fullPage: false });
  generated.push('capture.png');
  await overlay.keyboard.press('Escape');
  await main.getByRole('button', { name: 'Pick a color', exact: true }).waitFor();

  const logo = `data:image/png;base64,${(await readFile(resolve('public/icon.png'))).toString('base64')}`;
  const compact = `data:image/png;base64,${(await readFile(join(assets, 'compact.png'))).toString('base64')}`;
  const history = `data:image/png;base64,${(await readFile(join(assets, 'history.png'))).toString('base64')}`;
  showcase = await chromium.launch({ headless: true });
  const hero = await showcase.newPage({ viewport: { width: 1440, height: 820 }, deviceScaleFactor: 1 });
  await hero.setContent(`<!doctype html><html><head><style>
    *{box-sizing:border-box}body{margin:0;background:#111315;color:#f5f6f7;font-family:'Segoe UI',Arial,sans-serif;width:1440px;height:820px;overflow:hidden}
    .brand{position:absolute;top:52px;left:64px;display:flex;align-items:center;gap:14px;font-size:18px;font-weight:600}.brand img{width:44px;height:44px}
    .intro{position:absolute;top:220px;left:64px;width:550px}.eyebrow{color:#b4bbc2;letter-spacing:2px;font-size:12px;font-weight:600}h1{font-size:68px;line-height:1.05;letter-spacing:-3px;font-weight:600;margin:22px 0 24px}p{font-size:20px;line-height:1.6;color:#b4bbc2;max-width:470px;margin:0}
    .details{position:absolute;left:64px;bottom:58px;font-size:13px;color:#b4bbc2;display:flex;gap:26px}.details span{padding-top:12px;border-top:1px solid #454b51}
    .stage{position:absolute;left:690px;top:90px;width:695px;height:660px;background:#181b1e;border:1px solid #2b2f33;border-radius:32px}
    .history{position:absolute;width:380px;left:955px;top:140px;filter:drop-shadow(0 16px 24px #0005)}.compact{position:absolute;width:380px;left:704px;top:550px;filter:drop-shadow(0 20px 28px #0007)}
    .swatches{position:absolute;top:122px;left:730px;display:flex;gap:8px}.swatches b{width:28px;height:28px;border-radius:8px}.caption{position:absolute;bottom:52px;right:64px;color:#949da6;font:11px Consolas,monospace;letter-spacing:1px}
    </style></head><body><div class="brand"><img src="${logo}" alt="Original Color Blind Picker logo"><span>Color Blind Picker</span></div><div class="intro"><div class="eyebrow">A SMALL TOOL. A CLEARER VIEW.</div><h1>Give every<br>color a name.</h1><p>Point anywhere on your screen.<br>Read the color. Save it. Keep creating.</p></div><div class="details"><span>Made for color accessibility</span><span>Windows desktop</span><span>Italiano / English</span></div><div class="stage"></div><div class="swatches"><b style="background:#eb4064"></b><b style="background:#0252a9"></b><b style="background:#fcc31d"></b><b style="background:#41dbd9"></b></div><img class="history" src="${history}" alt="Expanded color history"><img class="compact" src="${compact}" alt="Compact floating picker"><div class="caption">RUST + TAURI / GRAPHITE</div></body></html>`);
  await hero.locator('img').first().waitFor();
  await hero.evaluate(async () => { await Promise.all([...document.images].map(image => image.decode())); await document.fonts.ready; });
  await hero.screenshot({ path: join(assets, 'hero.png') });
  generated.push('hero.png');
  await writeFile(join(work, 'capture-result.json'), JSON.stringify({ generated, source: 'Native Windows debug build with an isolated example palette; only live sampling frozen for consistency.', captureBackground: 'Documentation-only color palette behind the real transparent overlay.', productionCodeChanged: false }, null, 2));
  assert.deepEqual(pageErrors, []);
  console.log(`Captured ${generated.length} documentation images from the native Windows UI into ${assets}`);
} finally {
  if (main && !main.isClosed()) await main.evaluate(() => window.__TAURI_INTERNALS__.invoke('plugin:window|close', { label: 'main' })).catch(() => {});
  await browser?.close().catch(() => {});
  await showcase?.close().catch(() => {});
  if (processHandle && processHandle.exitCode === null) processHandle.kill();
}
