export const BPM = 60;
export const NOTE_DURATION_IN_BEATS = 0.5;
export const SECONDS_PER_BEAT = 60 / BPM;
export const NOTE_DURATION_IN_SECONDS =
  NOTE_DURATION_IN_BEATS * SECONDS_PER_BEAT;
export const BEATS = 256;
export const BEATS_PER_CHORD = 16;
export const TOTAL_DURATION_IN_SECONDS = BEATS * SECONDS_PER_BEAT;

export const BUTTON_EL = document.querySelector("button")!;
