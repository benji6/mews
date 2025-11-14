import {
  NOTE_DURATION_IN_SECONDS,
  SECONDS_PER_BEAT,
  SECONDS_PER_NOTE,
} from "./constants";

const DELAY_DECAY = 1 / 3;
const DELAY_TIME = (SECONDS_PER_BEAT / 3) * 2;

const chromaticNoteToFrequency = (n: number): number =>
  440 * Math.pow(2, n / 12);

const scheduleNote = (
  audioContext: AudioContext,
  startTime: number,
  chromaticNote: number,
) => {
  const osc = audioContext.createOscillator();
  osc.frequency.value = chromaticNoteToFrequency(chromaticNote);
  const stopTime = startTime + NOTE_DURATION_IN_SECONDS;

  osc.start(startTime);
  osc.stop(stopTime);
  osc.detune.value = (Math.random() - 0.5) * 10;

  const envelopeGain = audioContext.createGain();
  envelopeGain.gain.setValueAtTime(0, startTime);
  envelopeGain.gain.linearRampToValueAtTime(
    1,
    startTime + SECONDS_PER_NOTE / 1024,
  );
  envelopeGain.gain.linearRampToValueAtTime(
    0.2,
    startTime + SECONDS_PER_NOTE / 16,
  );
  envelopeGain.gain.linearRampToValueAtTime(0, stopTime);
  setTimeout(() => osc.disconnect(), stopTime * 1e3 + 1e3);
  return osc.connect(envelopeGain);
};

export default function audio(
  audioContext: AudioContext,
  masterGain: GainNode,
  score: Record<number, number[]>,
): { analyser: AnalyserNode; filter: BiquadFilterNode } {
  const analyser = new AnalyserNode(audioContext, {
    fftSize: 2048,
    smoothingTimeConstant: 1,
  });

  const compressor = new DynamicsCompressorNode(audioContext, {
    threshold: -40,
    knee: 40,
    ratio: 4,
    attack: 0,
    release: SECONDS_PER_BEAT / 8,
  });
  compressor.connect(analyser);
  analyser.connect(masterGain);
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

  const filter = new BiquadFilterNode(audioContext, {
    type: "lowpass",
    frequency: 20000,
    Q: 0,
  });
  filter.connect(compressor);

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

  let i = 0;
  for (const [startTime, notes] of Object.entries(score)) {
    for (const note of notes) {
      const outputNode = scheduleNote(audioContext, Number(startTime), note);
      outputNode.connect(filter).connect(i++ % 2 ? gain1 : gain0);
    }
  }

  return { analyser, filter };
}
