// SPDX-License-Identifier: GPL-3.0-or-later
const TABLE_SIZE = 4096;
const TABLE_MASK = TABLE_SIZE - 1;
const MIN_GAP = 1e-4;
const FREQ_MIN = 55;
const FREQ_MAX = 3520;
const FREQ_OCTAVES = Math.log2(FREQ_MAX / FREQ_MIN);
let NOTE_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];
