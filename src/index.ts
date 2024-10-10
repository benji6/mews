import audio from "./audio";
import { BUTTON_EL } from "./constants";
import view from "./view";

// triad0 = [7, 10, 14];
// triad1 = [3, 7, 10];
const chord0 = [-17, -10, 2, 10, 14];
const chord1 = [-21, 3, 7, 10, 19];

let audioContext: AudioContext;

BUTTON_EL.onclick = () => {
  BUTTON_EL.remove();
  if (!audioContext) audioContext = new AudioContext();
  const masterGain = new GainNode(audioContext, { gain: 0.1 });
  masterGain.connect(audioContext.destination);
  const startTime = audioContext.currentTime + 0.1;
  audio(audioContext, masterGain, startTime, chord0, chord1);
  view(audioContext, startTime, chord0, chord1, () => masterGain.disconnect());
};
