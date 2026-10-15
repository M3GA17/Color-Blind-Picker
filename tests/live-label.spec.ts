import { test, expect } from '@playwright/test';
import boundary from './data/naming-boundary.json' with { type: 'json' };
import { LiveLabel } from '../src/live-label';
import { previewColors } from '../src/types';
import type { ColorSample } from '../src/types';

const [orange, pink]: ColorSample[] = boundary.map(color => ({
  ...color, rgb: [color.rgb[0], color.rgb[1], color.rgb[2]],
}));

test('nearby boundary oscillation holds both translations, then a sustained identical sample settles', () => {
  const label = new LiveLabel();
  expect(label.update(orange, 0)).toBe(orange);
  expect(label.update(pink, 80)).toBe(orange);
  expect(label.update(orange, 160)).toBe(orange);
  expect(label.update(pink, 240)).toBe(orange);
  expect(label.update(pink, 360)).toBe(orange);
  const settled = label.update(pink, 480);
  expect(settled.name).toEqual({ it: 'Rosa giallastro', en: 'Yellowish pink' });
  expect(settled.naming.id).toBe(27);
  expect(pink.hex).toBe('#EB403C');
  expect(pink.rgb).toEqual([235, 64, 60]);
});

test('large pointer moves, unambiguous results, resumed sampling and capture resets bypass debounce', () => {
  const label = new LiveLabel();
  label.update(orange, 0);
  expect(label.update(previewColors[1], 80)).toBe(previewColors[1]);
  label.reset(orange);
  label.update(orange, 100);
  const clearResult = { ...pink, naming: { ...pink.naming, alternative: { ...pink.naming.alternative, deltaE: pink.naming.deltaE + 1.1 } } };
  expect(label.update(clearResult, 180)).toBe(clearResult);
  label.reset(orange);
  label.update(orange, 200);
  expect(label.update(pink, 1000)).toBe(pink);
  label.reset(pink);
  expect(label.update(pink, 1100)).toBe(pink);
});
