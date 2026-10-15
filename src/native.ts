import { invoke, isTauri } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { getCurrentWindow, LogicalSize } from '@tauri-apps/api/window';
import type { CaptureOutcome, ColorSample, HistoryColor, Settings, Snapshot } from './types';
import { defaultSnapshot } from './types';

export const desktop = isTauri();
export const captureWindow = desktop && getCurrentWindow().label === 'capture';

export const native = {
  load: () => desktop ? invoke<Snapshot>('load_state') : Promise.resolve(structuredClone(defaultSnapshot)),
  sample: () => desktop ? invoke<ColorSample | null>('sample_color') : Promise.resolve(null),
  settings: (settings: Settings) => desktop ? invoke<Snapshot>('set_settings', { settings }) : Promise.reject(new Error('Desktop app required')),
  copy: (hex: string) => invoke<void>('copy_color', { hex }),
  beginCapture: () => invoke<void>('begin_capture'),
  finishCapture: () => invoke<void>('finish_capture'),
  cancelCapture: () => invoke<void>('cancel_capture'),
  remove: (id: number) => invoke<Snapshot>('delete_color', { id }),
  restore: (entry: HistoryColor, index: number) => invoke<Snapshot>('restore_color', {
    saved: { id: entry.id, hex: entry.color.hex, capturedAt: entry.capturedAt }, index,
  }),
  close: () => desktop ? getCurrentWindow().close() : Promise.resolve(),
  drag: () => desktop ? getCurrentWindow().startDragging() : Promise.resolve(),
  resize: async (width: number, height: number) => {
    if (!desktop) return;
    await getCurrentWindow().setSize(new LogicalSize(width, height));
    await getCurrentWindow().show();
  },
  subscribe: async (handlers: {
    captured: (outcome: CaptureOutcome) => void;
    closed: () => void;
    error: (error: string) => void;
  }) => {
    if (!desktop) return () => {};
    const disposers = await Promise.all([
      listen<CaptureOutcome>('color-captured', event => handlers.captured(event.payload)),
      listen('capture-closed', handlers.closed),
      listen<string>('capture-error', event => handlers.error(event.payload)),
    ]);
    return () => disposers.forEach(dispose => dispose());
  },
};
