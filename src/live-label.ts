import type { ColorSample } from './types';

/** Display-only boundary debounce. Raw RGB and capture classification never pass through it. */
export class LiveLabel {
  private accepted: ColorSample | null = null;
  private pending: { id: number; since: number } | null = null;
  private lastSeen = -Infinity;

  reset(sample: ColorSample | null = null) {
    this.accepted = sample;
    this.pending = null;
    this.lastSeen = -Infinity;
  }

  update(sample: ColorSample, now: number): ColorSample {
    const gap = sample.naming.alternative.deltaE - sample.naming.deltaE;
    const accepted = this.accepted;
    const nearby = accepted && sample.rgb.every((v, i) => Math.abs(v - accepted.rgb[i]) <= 12);
    const resumed = now - this.lastSeen > 400;
    this.lastSeen = now;
    if (!this.accepted || this.accepted.naming.id === sample.naming.id || !nearby || gap >= 1 || resumed) {
      this.accepted = sample;
      this.pending = null;
    } else {
      if (this.pending?.id !== sample.naming.id) this.pending = { id: sample.naming.id, since: now };
      if (now - this.pending.since >= 240) {
        this.accepted = sample;
        this.pending = null;
      }
    }
    return this.accepted;
  }
}
