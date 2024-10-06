import audio from "./audio";
import { BUTTON_EL } from "./constants";
import view from "./view";

const chord = [-24, -19, -5, 4, 7, 11, 14, 19];

let audioContext: AudioContext;

BUTTON_EL.onclick = () => {
  BUTTON_EL.remove();
  if (!audioContext) audioContext = new AudioContext();
  const masterGain = new GainNode(audioContext, { gain: 0.1 });
  masterGain.connect(audioContext.destination);
  const startTime = audioContext.currentTime + 0.1;
  audio(audioContext, masterGain, startTime, chord);
  view(audioContext, startTime, chord, () => masterGain.disconnect());
};
