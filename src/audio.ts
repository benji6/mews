import { BEATS, BEATS_PER_CHORD, BPM, SECONDS_PER_BEAT } from "./constants";
import { chordIndexToPeriod } from "./utils";

const DELAY_DECAY = 1 / 3;
const DELAY_TIME = (SECONDS_PER_BEAT / 3) * 2;

const chromaticNoteToFrequency = (n: number): number =>
  440 * Math.pow(2, n / 12);

const scheduleNote = (
  audioContext: AudioContext,
  songStartTime: number,
  chromaticNote: number,
  time: number,
) => {
  const osc = audioContext.createOscillator();
  osc.frequency.value = chromaticNoteToFrequency(chromaticNote);
  const startTime = songStartTime + (time / BPM) * 60;
  const stopTime = startTime + SECONDS_PER_BEAT;

  osc.start(startTime);
  osc.stop(stopTime);
  osc.detune.value = (Math.random() - 0.5) * 10;

  const envelopeGain = audioContext.createGain();
  envelopeGain.gain.setValueAtTime(0, startTime);
  envelopeGain.gain.linearRampToValueAtTime(
    1,
    startTime + SECONDS_PER_BEAT / 1024,
  );
  envelopeGain.gain.linearRampToValueAtTime(
    0.75,
    startTime + SECONDS_PER_BEAT / 3,
  );
  envelopeGain.gain.linearRampToValueAtTime(0, stopTime);
  setTimeout(() => osc.disconnect(), stopTime * 1e3 + 1e3);
  return osc.connect(envelopeGain);
};

export default function audio(
  audioContext: AudioContext,
  masterGain: GainNode,
  songStartTime: number,
  chord0: number[],
  chord1: number[],
) {
  const compressor = new DynamicsCompressorNode(audioContext, {
    threshold: -40,
    knee: 40,
    ratio: 4,
    attack: 0,
    release: SECONDS_PER_BEAT / 8,
  });
  compressor.connect(masterGain);
  const delay0 = new DelayNode(audioContext, {
    maxDelayTime: DELAY_TIME,
    delayTime: DELAY_TIME,
  });
  const delay1 = new DelayNode(audioContext, {
    maxDelayTime: DELAY_TIME,
    delayTime: DELAY_TIME,
  });

  const gain0 = new GainNode(audioContext, { gain: DELAY_DECAY });
  const gain1 = new GainNode(audioContext, { gain: DELAY_DECAY });

  delay0
    .connect(gain1)
    .connect(delay1)
    .connect(new StereoPannerNode(audioContext, { pan: -1 }))
    .connect(compressor);
  delay1
    .connect(gain0)
    .connect(delay0)
    .connect(new StereoPannerNode(audioContext, { pan: 1 }))
    .connect(compressor);

  // TODO break early in inner loop once you are passed BEATS/period...
  for (let j = 0; j < BEATS; j++) {
    if (Math.floor((j / BEATS_PER_CHORD) % 2))
      for (let i = 0; i < chord1.length; i++) {
        const period = chordIndexToPeriod(i);
        const outputNode = scheduleNote(
          audioContext,
          songStartTime,
          chord1[i],
          j * period,
        );
        outputNode.connect(j % 2 ? gain1 : gain0);
        outputNode.connect(compressor);
      }
    else
      for (let i = 0; i < chord0.length; i++) {
        const period = chordIndexToPeriod(i);
        const outputNode = scheduleNote(
          audioContext,
          songStartTime,
          chord0[i],
          j * period,
        );
        outputNode.connect(j % 2 ? gain1 : gain0);
        outputNode.connect(compressor);
      }
  }
}
