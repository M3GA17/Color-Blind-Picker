import examples from './preview-colors.json' with { type: 'json' };

export type Language = 'it' | 'en';
export type CopyFormat = 'hex' | 'rgb';
export type Localized = Record<Language, string>;
export interface ReferenceMatch {
  id: number;
  referenceName: string;
  deltaE: number;
}
export interface ColorNaming extends ReferenceMatch {
  method: string;
  alternative: ReferenceMatch;
}
export interface ColorSample {
  hex: string;
  rgb: [number, number, number];
  name: Localized;
  description: Localized;
  naming: ColorNaming;
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

// Generated from the same references; Rust tests verify names, IDs and distances.
export const previewColors: ColorSample[] = examples.map(color => ({
  ...color, rgb: [color.rgb[0], color.rgb[1], color.rgb[2]],
}));
export const initialColor = previewColors[0];

export function colorLabel(color: ColorSample, language: Language): string {
  const qualifier = color.description[language];
  return qualifier ? `${color.name[language]} · ${qualifier}` : color.name[language];
}

export function referenceTitle(color: Pick<ColorSample, 'naming'>): string {
  return `ISCC–NBS ${color.naming.id}: ${color.naming.referenceName}`;
}

export const defaultSnapshot: Snapshot = {
  settings: { language: 'it', format: 'hex', alwaysOnTop: false, historyOpen: false },
  history: [],
};

export function formatColor(color: ColorSample, format: CopyFormat): string {
  return format === 'hex' ? color.hex : `rgb(${color.rgb.join(', ')})`;
}
