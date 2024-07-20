const button = document.querySelector("button");

if (!button) throw Error("Button missing");

const BPM = 140;
const SECONDS_PER_BEAT = 60 / BPM;
const BEATS = 64;
const TOTAL_DURATION_IN_SECONDS = BEATS * SECONDS_PER_BEAT;

const notesAndPeriods = new Map();
notesAndPeriods.set(-24, 1);
notesAndPeriods.set(-19, 2);
notesAndPeriods.set(-5, 3);
notesAndPeriods.set(4, 4);
notesAndPeriods.set(7, 5);
notesAndPeriods.set(11, 6);
notesAndPeriods.set(14, 7);
notesAndPeriods.set(19, 8);

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

button.onclick = () => {
  const div = document.querySelector("div");
  if (!div) throw Error("No div!");
  button.remove();
  const ctx = new AudioContext();
  const masterGain = ctx.createGain();
  masterGain.gain.value = 0.2;
  masterGain.connect(ctx.destination);
  const startTime = ctx.currentTime + 0.1;
  for (const [note, period] of notesAndPeriods.entries())
    for (let i = 0; i < BEATS / period; i++)
      scheduleNote(ctx, startTime, note, i * period).connect(masterGain);

  const animationLoop = () => {
    const secondsElapsed = ctx.currentTime - startTime;
    if (secondsElapsed > TOTAL_DURATION_IN_SECONDS) {
      div.innerText = "";
      masterGain.disconnect();
      document.body.append(button);
      return;
    }
    requestAnimationFrame(animationLoop);
    if (secondsElapsed < 0) return;

    let display = "";
    for (const [note, period] of notesAndPeriods.entries())
      display +=
        (secondsElapsed / SECONDS_PER_BEAT) % period <= SECONDS_PER_BEAT
          ? period
          : "_";

    div.textContent = display;
  };
  requestAnimationFrame(animationLoop);
};
