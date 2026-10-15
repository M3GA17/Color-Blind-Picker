import { chromium } from '@playwright/test';
import { spawn, execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';

if (process.platform !== 'win32') throw Error('This smoke test exercises the Windows native backend.');
const output = resolve('test-results/native');
const profile = resolve(output, `run-${Date.now()}`);
await mkdir(profile, { recursive: true });
const port = 9227;
let child;
let browser;
let main;
const errors = [];
try {
  child = spawn(resolve('src-tauri/target/debug/color-blind-picker.exe'), [], {
    windowsHide: true,
    env: { ...process.env, CBP_TEST_DATA_DIR: profile, WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: `--remote-debugging-port=${port}` },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.on('error', error => errors.push(error.message));
  child.stderr.on('data', data => errors.push(data.toString()));
  const deadline = Date.now() + 20000;
  while (true) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (response.ok) break;
    } catch {}
    if (Date.now() > deadline) throw Error(`Desktop inspector did not start. ${errors.join('\n')}`);
    await new Promise(done => setTimeout(done, 250));
  }
  browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`);
  const context = browser.contexts()[0];
  main = context.pages()[0] ?? await context.waitForEvent('page');
  main.on('pageerror', error => errors.push(error.message));
  await main.getByRole('button', { name: 'Cattura colore', exact: true }).waitFor({ state: 'visible' });
  await main.getByRole('button', { name: 'Impostazioni', exact: true }).click();
  await main.getByRole('combobox', { name: 'Formato copia' }).selectOption('rgb');
  await main.getByRole('button', { name: 'Sempre in primo piano', exact: true }).click();
  await main.getByRole('button', { name: 'Impostazioni', exact: true }).click();
  await main.screenshot({ path: resolve(output, 'desktop-compact.png') });

  const cancelledPage = context.waitForEvent('page');
  await main.getByRole('button', { name: 'Cattura colore', exact: true }).click();
  const cancelled = await cancelledPage;
  await cancelled.locator('.capture-surface').waitFor();
  await cancelled.keyboard.press('Escape');
  await main.getByRole('button', { name: 'Cattura colore', exact: true }).waitFor({ state: 'visible' });
  assert.equal((await main.evaluate(() => window.__TAURI_INTERNALS__.invoke('load_state'))).history.length, 0);

  const overlayPage = context.waitForEvent('page');
  await main.getByRole('button', { name: 'Cattura colore', exact: true }).click();
  const overlay = await overlayPage;
  overlay.on('pageerror', error => errors.push(error.message));
  await overlay.locator('.capture-surface').waitFor();
  // A known color on the actual native capture window verifies the GDI screen read.
  // The fixture is injected only here; the shipped overlay stays transparent.
  await overlay.evaluate(() => {
    document.querySelector('.capture-surface').style.background = '#0252a9';
    document.querySelector('.capture-instructions').style.display = 'none';
  });
  let sampled;
  const sampleDeadline = Date.now() + 5000;
  do {
    await new Promise(done => setTimeout(done, 100));
    sampled = await overlay.evaluate(() => window.__TAURI_INTERNALS__.invoke('sample_color'));
  } while (sampled?.hex !== '#0252A9' && Date.now() < sampleDeadline);
  assert.equal(sampled?.hex, '#0252A9', 'Native GetPixel did not see the known desktop color');
  await overlay.evaluate(() => window.__TAURI_INTERNALS__.invoke('finish_capture'));
  await main.getByRole('status').filter({ hasText: 'RGB copiato' }).waitFor();
  const saved = await main.evaluate(() => window.__TAURI_INTERNALS__.invoke('load_state'));
  assert.equal(saved.history.length, 1);
  assert.equal(saved.history[0].color.hex, '#0252A9');
  const clipboard = execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', 'Get-Clipboard -Raw'], { encoding: 'utf8', windowsHide: true }).trim();
  assert.equal(clipboard, 'rgb(2, 82, 169)', 'Native clipboard did not receive the chosen RGB color');
  await main.getByRole('button', { name: 'Cronologia', exact: true }).click();
  await main.locator('.history-row').waitFor();
  await main.screenshot({ path: resolve(output, 'desktop-history.png') });
  await main.getByRole('button', { name: 'Altre azioni: Blu scuro', exact: true }).click();
  await main.getByRole('button', { name: 'Elimina colore', exact: true }).click();
  await main.getByRole('button', { name: 'Annulla', exact: true }).click();
  await main.locator('.history-row').waitFor();
  await main.getByRole('button', { name: 'Impostazioni', exact: true }).click();
  await main.getByRole('combobox', { name: 'Lingua', exact: true }).selectOption('en');
  await main.getByRole('button', { name: 'Always on top', exact: true }).waitFor();
  const disk = JSON.parse(await readFile(resolve(profile, 'state.json'), 'utf8'));
  assert.equal(disk.settings.language, 'en');
  assert.equal(disk.settings.format, 'rgb');
  assert.equal(disk.settings.alwaysOnTop, true);
  assert.equal(disk.history.length, 1);
  assert.equal(disk.history[0].hex, '#0252A9');
  assert.deepEqual(errors, [], 'Native WebView errors');
  await writeFile(resolve(output, 'smoke-result.json'), JSON.stringify({ passed: true, checked: ['native live pixel sampling', 'capture overlay', 'Esc cancellation', 'RGB clipboard', 'always on top', 'delete and undo', 'IT/EN', 'disk persistence'], profile }, null, 2));
  console.log('Native Windows smoke passed: capture, cancel, real GDI pixel, RGB clipboard, pin, history, undo, language and persistence.');
} finally {
  if (main && !main.isClosed()) {
    await main.evaluate(() => window.__TAURI_INTERNALS__.invoke('plugin:window|close', { label: 'main' })).catch(() => {});
  }
  await browser?.close().catch(() => {});
  if (child && child.exitCode === null) child.kill();
}
