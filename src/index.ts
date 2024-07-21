import audio from "./audio";
import { BUTTON_EL } from "./constants";
import view from "./view";

const notesAndPeriods = new Map<number, number>();
const notes = [-24, -19, -5, 4, 7, 11, 14, 19];
for (let i = 0; i < notes.length; i++) notesAndPeriods.set(notes[i], i / 8 + 2);

let ctx: AudioContext;

BUTTON_EL.onclick = () => {
  BUTTON_EL.remove();
  if (!ctx) ctx = new AudioContext();
  const masterGain = ctx.createGain();
  masterGain.gain.value = 0.2;
  masterGain.connect(ctx.destination);
  const startTime = ctx.currentTime + 0.1;
  audio(ctx, startTime, notesAndPeriods, masterGain);
  view(ctx, startTime, notesAndPeriods, () => masterGain.disconnect());
};
