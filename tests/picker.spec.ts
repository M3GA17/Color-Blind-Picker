import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import type { ColorSample, Snapshot } from '../src/types';
import { initialColor } from '../src/types';

interface TestBridge {
  calls: { command: string; args: Record<string, unknown> }[];
  copied: string[];
  fail: string | null;
}
declare global { interface Window { __cbpTest: TestBridge } }

const blue: ColorSample = { hex: '#0252A9', rgb: [2, 82, 169], name: { it: 'Blu scuro', en: 'Blue dark' }, description: { it: 'Intenso', en: 'Vivid' } };
const cyan: ColorSample = { hex: '#41DBD9', rgb: [65, 219, 217], name: { it: 'Ciano', en: 'Cyan' }, description: { it: 'Leggermente attenuato', en: 'Slightly faded' } };
const fixture: Snapshot = {
  settings: { language: 'it', format: 'hex', alwaysOnTop: false, historyOpen: true },
  history: [initialColor, blue, cyan].map((color, index) => ({ id: index + 1, color, capturedAt: 1000 + index })),
};

async function mockDesktop(page: Page, label = 'main') {
  await page.addInitScript(({ snapshot, red, blue, cyan, label }) => {
    const callbacks = new Map<number, (value: unknown) => void>();
    const events = new Map<string, number[]>();
    let nextCallback = 1;
    let data = JSON.parse(sessionStorage.getItem('cbp-test-state') ?? JSON.stringify(snapshot));
    let current = red;
    const bridge: TestBridge = { calls: [], copied: [], fail: null };
    window.__cbpTest = bridge;
    Reflect.set(window, 'isTauri', true);
    const emit = (event: string, payload: unknown) => {
      for (const id of events.get(event) ?? []) callbacks.get(id)?.({ event, id, payload });
    };
    const persist = () => { sessionStorage.setItem('cbp-test-state', JSON.stringify(data)); return structuredClone(data); };
    const copy = (hex: string) => {
      if (bridge.fail === 'copy_color') throw Error('Clipboard is busy');
      const color = [red, blue, cyan].find(c => c.hex === hex);
      bridge.copied.push(data.settings.format === 'hex' ? hex : `rgb(${color?.rgb.join(', ')})`);
    };
    Reflect.set(window, '__TAURI_INTERNALS__', {
      metadata: { currentWindow: { label }, currentWebview: { label, windowLabel: label } },
      transformCallback: (callback: (value: unknown) => void) => { const id = nextCallback++; callbacks.set(id, callback); return id; },
      invoke: async (command: string, args: Record<string, unknown> = {}) => {
        bridge.calls.push({ command, args });
        if (bridge.fail === command) throw Error('Simulated disk or clipboard failure');
        switch (command) {
          case 'plugin:event|listen': {
            const name = String(args.event);
            const handlers = events.get(name) ?? [];
            handlers.push(Number(args.handler)); events.set(name, handlers); return args.handler;
          }
          case 'plugin:event|unlisten': return;
          case 'load_state': return structuredClone(data);
          case 'sample_color': return current;
          case 'set_settings': data.settings = args.settings; return persist();
          case 'copy_color': copy(String(args.hex)); return;
          case 'delete_color': data.history = data.history.filter((entry: { id: number }) => entry.id !== args.id); return persist();
          case 'restore_color': {
            const saved = args.saved;
            if (typeof saved !== 'object' || saved === null) throw Error('Missing saved color');
            const hex = Reflect.get(saved, 'hex');
            const color = [red, blue, cyan].find(c => c.hex === hex);
            data.history.splice(Number(args.index), 0, { id: Reflect.get(saved, 'id'), color, capturedAt: Reflect.get(saved, 'capturedAt') }); return persist();
          }
          case 'begin_capture':
            setTimeout(() => {
              current = blue;
              data.history.unshift({ id: 9999, color: blue, capturedAt: 9999 });
              const result = persist(); copy(blue.hex);
              emit('color-captured', { color: blue, snapshot: result, copied: true, copyError: null });
              emit('capture-closed', null);
            }, 20);
            return;
          case 'finish_capture': case 'cancel_capture': return;
          default:
            if (command.startsWith('plugin:window|')) return;
            throw Error(`Unexpected command ${command}`);
        }
      },
    });
    Reflect.set(window, '__TAURI_EVENT_PLUGIN_INTERNALS__', { unregisterListener: () => {} });
  }, { snapshot: fixture, red: initialColor, blue, cyan, label });
}

test('capture, copy format, pin, delete, undo and language persist through reload', async ({ page }) => {
  await mockDesktop(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Rosso vivo' })).toBeVisible();
  await expect(page.locator('.history-row')).toHaveCount(3);
  await page.getByRole('button', { name: 'Cattura colore', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Blu scuro' })).toBeVisible();
  await expect(page.locator('.history-row')).toHaveCount(4);
  await expect(page.getByRole('status')).toContainText('HEX copiato');
  await page.getByRole('button', { name: 'Impostazioni', exact: true }).click();
  await page.getByLabel('Formato copia').selectOption('rgb');
  await expect(page.locator('.color-code')).toContainText('rgb(2, 82, 169)');
  await page.getByRole('button', { name: 'Sempre in primo piano', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Sempre in primo piano', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Copia rgb(2, 82, 169)', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__cbpTest.copied.at(-1))).toBe('rgb(2, 82, 169)');
  await page.getByRole('button', { name: 'Altre azioni: Blu scuro', exact: true }).first().click();
  await page.getByRole('button', { name: 'Elimina colore', exact: true }).click();
  await expect(page.locator('.history-row')).toHaveCount(3);
  await page.getByRole('button', { name: 'Annulla', exact: true }).click();
  await expect(page.locator('.history-row')).toHaveCount(4);
  await page.getByRole('combobox', { name: 'Lingua', exact: true }).selectOption('en');
  await expect(page.getByRole('heading', { name: 'Blue dark' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Always on top', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.history-row')).toHaveCount(4);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('disk and clipboard errors remain visible and do not pretend an operation succeeded', async ({ page }) => {
  await mockDesktop(page);
  await page.goto('/');
  await page.evaluate(() => { window.__cbpTest.fail = 'set_settings'; });
  await page.getByRole('button', { name: 'Sempre in primo piano', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Operazione non riuscita');
  await expect(page.getByRole('button', { name: 'Sempre in primo piano', exact: true })).toHaveAttribute('aria-pressed', 'false');
  await page.evaluate(() => { window.__cbpTest.fail = 'copy_color'; });
  await page.getByRole('button', { name: 'Copia #EB4064', exact: true }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  expect(await page.evaluate(() => window.__cbpTest.copied)).toEqual([]);
  await page.evaluate(() => { window.__cbpTest.fail = 'delete_color'; });
  await page.getByRole('button', { name: 'Altre azioni: Ciano', exact: true }).click();
  await page.getByRole('button', { name: 'Elimina colore', exact: true }).click();
  await expect(page.locator('.history-row')).toHaveCount(3);
});

test('compact insets, red close control and keyboard operation work at 320 px', async ({ page }) => {
  await mockDesktop(page);
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/');
  await expect(page.locator('.readout')).toHaveCSS('padding-left', '8px');
  await expect(page.getByRole('button', { name: 'Chiudi', exact: true })).toHaveCSS('color', 'rgb(255, 107, 107)');
  expect(await page.locator('.picker').evaluate(e => e.scrollWidth <= e.clientWidth + 1)).toBe(true);
  await page.getByRole('button', { name: 'Impostazioni', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('Formato copia')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByLabel('Formato copia')).toHaveCount(0);
  await page.getByRole('button', { name: 'Chiudi', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__cbpTest.calls.some(c => c.command === 'plugin:window|close'))).toBe(true);
});

test('capture overlay flips its tooltip away from the pixel and Esc cancels', async ({ page }) => {
  await mockDesktop(page, 'capture');
  await page.goto('/');
  await page.mouse.move(280, 750);
  await expect(page.locator('.capture-tooltip')).toBeVisible();
  const box = await page.locator('.capture-tooltip').boundingBox();
  expect(box).not.toBeNull();
  expect(box && (280 < box.x || 280 > box.x + box.width || 750 < box.y || 750 > box.y + box.height)).toBe(true);
  await page.keyboard.press('Escape');
  await expect.poll(() => page.evaluate(() => window.__cbpTest.calls.some(c => c.command === 'cancel_capture'))).toBe(true);
  expect(await page.evaluate(() => window.__cbpTest.calls.some(c => c.command === 'finish_capture'))).toBe(false);
});

test('browser preview explicitly requires desktop capture', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Anteprima web · il campionamento richiede l’app desktop')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cattura colore', exact: true })).toBeDisabled();
});
