import { BEATS, BPM, BUTTON_EL, SECONDS_PER_BEAT } from "./constants";
import view from "./view";

const notesAndPeriods = new Map<number, number>();
const notes = [-24, -19, -5, 4, 7, 11, 14, 19];
for (let i = 0; i < notes.length; i++) notesAndPeriods.set(notes[i], i / 2 + 1);

const chromaticNoteToFrequency = (n: number): number =>
  440 * Math.pow(2, n / 12);

const scheduleNote = (
  ctx: AudioContext,
  songStartTime: number,
  chromaticNote: number,
  time: number,
) => {
  const osc = ctx.createOscillator();
  osc.frequency.value = chromaticNoteToFrequency(chromaticNote);
  const startTime = songStartTime + (time / BPM) * 60;
  const stopTime = startTime + SECONDS_PER_BEAT;

  osc.start(startTime);
  osc.stop(stopTime);
  osc.detune.value = (Math.random() - 0.5) * 10;

  const envelopeGain = ctx.createGain();
  envelopeGain.gain.setValueAtTime(0, startTime);
  envelopeGain.gain.linearRampToValueAtTime(
    1,
    startTime + SECONDS_PER_BEAT / 4,
  );
  envelopeGain.gain.linearRampToValueAtTime(
    0.75,
    startTime + SECONDS_PER_BEAT / 3,
  );
  envelopeGain.gain.linearRampToValueAtTime(0, stopTime);
  setTimeout(() => osc.disconnect, stopTime * 1e3 + 1e3);
  return osc.connect(envelopeGain);
};

BUTTON_EL.onclick = () => {
  BUTTON_EL.remove();
  const ctx = new AudioContext();
  const masterGain = ctx.createGain();
  masterGain.gain.value = 0.2;
  masterGain.connect(ctx.destination);
  const startTime = ctx.currentTime + 0.1;
  for (const [note, period] of notesAndPeriods.entries())
    for (let i = 0; i < BEATS / period; i++)
      scheduleNote(ctx, startTime, note, i * period).connect(masterGain);

  view(ctx, startTime, notesAndPeriods, () => masterGain.disconnect());
};
