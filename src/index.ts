import audio from "./audio";
import { BUTTON_EL } from "./constants";
import view from "./view";

const notesAndPeriods = new Map<number, number>();
const notes = [-24, -19, -5, 4, 7, 11, 14, 19];
for (let i = 0; i < notes.length; i++) notesAndPeriods.set(notes[i], i / 8 + 2);

let audioContext: AudioContext;

BUTTON_EL.onclick = () => {
  BUTTON_EL.remove();
  if (!audioContext) audioContext = new AudioContext();
  const masterGain = new GainNode(audioContext, { gain: 0.1 });
  masterGain.connect(audioContext.destination);
  const startTime = audioContext.currentTime + 0.1;
  audio(audioContext, startTime, notesAndPeriods, masterGain);
  view(audioContext, startTime, notesAndPeriods, () => masterGain.disconnect());
};
