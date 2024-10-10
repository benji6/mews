export const BPM = 100;
export const SECONDS_PER_BEAT = 60 / BPM;
export const BEATS = 128;
export const BEATS_PER_CHORD = 8;
export const TOTAL_DURATION_IN_SECONDS = BEATS * SECONDS_PER_BEAT;
// FIXME: where is the 2 coming from?
export const SECONDS_PER_CHORD = BEATS_PER_CHORD * SECONDS_PER_BEAT * 2;

export const BUTTON_EL = document.querySelector("button")!;
