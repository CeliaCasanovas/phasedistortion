// SPDX-License-Identifier: GPL-3.0-or-later

function shapeCurve(t, curve) {
  if (curve === 1.0) return t;
  if (curve === 2.0) return t * t;
  if (curve === 0.5) return Math.sqrt(t);
  return Math.pow(t, curve);
}

const SINE_TABLE = new Float32Array(TABLE_SIZE);
for (let i = 0; i < TABLE_SIZE; i++) {
  SINE_TABLE[i] = Math.sin((2 * Math.PI * i) / TABLE_SIZE);
}

function lookupSine(phase) {
  const idx = phase * TABLE_SIZE;
  const i0 = idx | 0;
  const i1 = (i0 + 1) & TABLE_MASK;
  return SINE_TABLE[i0] + (SINE_TABLE[i1] - SINE_TABLE[i0]) * (idx - i0);
}

class PhaseDistortionTransferFunction {
  constructor(x1, y1, x2, y2, x3, y3, x4, y4) {
    this.x1 = Math.max(x1, MIN_GAP);
    this.x2 = Math.min(Math.max(x2, this.x1 + MIN_GAP), 1 - 3 * MIN_GAP);
    this.x3 = Math.min(Math.max(x3, this.x2 + MIN_GAP), 1 - 2 * MIN_GAP);
    this.x4 = Math.min(Math.max(x4, this.x3 + MIN_GAP), 1 - MIN_GAP);
    this.y1 = Math.max(0, Math.min(1, y1));
    this.y2 = Math.max(0, Math.min(1, y2));
    this.y3 = Math.max(0, Math.min(1, y3));
    this.y4 = Math.max(0, Math.min(1, y4));
    this.m1 = this.y1 / this.x1;
    this.m2 = (this.y2 - this.y1) / (this.x2 - this.x1);
    this.m3 = (this.y3 - this.y2) / (this.x3 - this.x2);
    this.m4 = (this.y4 - this.y3) / (this.x4 - this.x3);
    this.m5 = (1 - this.y4) / (1 - this.x4);
  }
  distort(p) {
    if (p <= this.x1) return p * this.m1;
    if (p <= this.x2) return this.y1 + (p - this.x1) * this.m2;
    if (p <= this.x3) return this.y2 + (p - this.x2) * this.m3;
    if (p <= this.x4) return this.y3 + (p - this.x3) * this.m4;
    return this.y4 + (p - this.x4) * this.m5;
  }
}

function calcCzWindow(p, type) {
  if (type === "Saw") return 1 - p;
  if (type === "Triangle") return p < 0.5 ? p * 2 : (1 - p) * 2;
  if (type === "Trapezoid")
    return p >= 0.25 && p <= 0.75 ? 1 : p < 0.25 ? p * 4 : (1 - p) * 4;
  return 1;
}

function freqFromSlider(val) {
  return FREQ_MIN * Math.pow(2, (val / 100) * FREQ_OCTAVES);
}

function nearestNoteName(f) {
  const m = Math.round(69 + 12 * Math.log2(f / 440));
  return `${NOTE_NAMES[((m % 12) + 12) % 12]}${Math.floor((m - 12) / 12)}`;
}

const $ = (id) => document.getElementById(id);
