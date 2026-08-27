export type MotionEvent = { startedAt: number; endedAt: number; peakRatio: number };

export class MotionEventTracker {
  private active: { startedAt: number; peakRatio: number } | null = null;
  update(time: number, ratio: number, threshold: number): MotionEvent | null {
    if (ratio >= threshold && !this.active) this.active = { startedAt: time, peakRatio: ratio };
    if (this.active) this.active.peakRatio = Math.max(this.active.peakRatio, ratio);
    if (ratio < threshold && this.active) {
      const event = { startedAt: this.active.startedAt, endedAt: time, peakRatio: this.active.peakRatio };
      this.active = null;
      return event;
    }
    return null;
  }
  reset() { this.active = null; }
}
