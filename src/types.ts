export type Language = 'it' | 'en';
export type CopyFormat = 'hex' | 'rgb';
export type Localized = Record<Language, string>;
export interface ColorSample {
  hex: string;
  rgb: [number, number, number];
  name: Localized;
  description: Localized;
}
export interface Settings {
  language: Language;
  format: CopyFormat;
  alwaysOnTop: boolean;
  historyOpen: boolean;
}
export interface HistoryColor {
  id: number;
  color: ColorSample;
  capturedAt: number;
}
export interface Snapshot {
  settings: Settings;
  history: HistoryColor[];
}
export interface CaptureOutcome {
  color: ColorSample;
  snapshot: Snapshot;
  copied: boolean;
  copyError: string | null;
}

export const initialColor: ColorSample = {
  hex: '#EB4064', rgb: [235, 64, 100],
  name: { it: 'Rosso vivo', en: 'Bright red' },
  description: { it: 'Leggermente attenuato', en: 'Slightly faded' },
};

export const defaultSnapshot: Snapshot = {
  settings: { language: 'it', format: 'hex', alwaysOnTop: false, historyOpen: false },
  history: [],
};

export function formatColor(color: ColorSample, format: CopyFormat): string {
  return format === 'hex' ? color.hex : `rgb(${color.rgb.join(', ')})`;
}
