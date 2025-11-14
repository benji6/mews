import { SECONDS_PER_BEAT, SECONDS_PER_NOTE } from "./constants";
import { chordIndexToPeriod } from "./utils";

const getCssVar = (prop: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(prop).trim();

export default function view(
  canvas: HTMLCanvasElement,
  canvasWidth: number,
  canvasHeight: number,
  secondsElapsed: number,
  score: Record<number, number[]>,
  currentTime: number,
  chord0: number[],
  chord1: number[],
  analyser: AnalyserNode,
) {
  const canvasContext = canvas.getContext("2d");
  if (!canvasContext) throw Error("failed to get 2d rendering context");

  const smallestCanvasSideLength = Math.min(canvasWidth, canvasHeight);
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  const playingNotes = new Set<number>();
  for (const [startTimeStr, notes] of Object.entries(score)) {
    const startTime = Number(startTimeStr);
    if (currentTime >= startTime && currentTime <= startTime + SECONDS_PER_NOTE)
      for (const note of notes) playingNotes.add(note);
  }

  const drawOscilloscope = () => {
    analyser.getByteTimeDomainData(dataArray);

    canvasContext.lineWidth = 3;
    canvasContext.strokeStyle = getCssVar("--color-figure");
    canvasContext.globalAlpha = 1 / 8;
    canvasContext.beginPath();

    const sliceWidth = canvasWidth / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = (canvasHeight + v * canvasHeight) / 4;

      if (i === 0) {
        canvasContext.moveTo(x, y);
      } else {
        canvasContext.lineTo(x, y);
      }

      x += sliceWidth;
    }

    canvasContext.lineTo(canvasWidth, canvasHeight / 2);
    canvasContext.stroke();
    canvasContext.globalAlpha = 1.0;
    canvasContext.lineWidth = 1;
  };

  canvasContext.strokeStyle = getCssVar("--color-figure");
  canvasContext.clearRect(0, 0, canvasWidth, canvasHeight);

  drawOscilloscope();

  const bothChords = new Set<{ note: number; period: number }>();
  for (let i = 0; i < chord0.length; i++)
    bothChords.add({ note: chord0[i], period: chordIndexToPeriod(i) });
  for (let i = 0; i < chord1.length; i++)
    bothChords.add({ note: chord1[i], period: chordIndexToPeriod(i) });

  const lowestNote = Math.min(...chord0, ...chord1);
  const highestNote = Math.max(...chord0, ...chord1);
  const noteRange = highestNote - lowestNote;

  for (const { note, period } of bothChords) {
    const isNotePlaying = playingNotes.has(note);
    const r =
      ((smallestCanvasSideLength *
        0.2 *
        (note + noteRange / 10 + Math.abs(lowestNote))) /
        noteRange) *
      1.1;

    canvasContext.beginPath();
    canvasContext.arc(canvasWidth / 2, canvasHeight / 2, r, 0, 2 * Math.PI);
    canvasContext.stroke();

    const theta =
      (secondsElapsed / SECONDS_PER_BEAT / period) * 2 * Math.PI - Math.PI / 2;
    canvasContext.beginPath();
    canvasContext.arc(
      r * Math.cos(theta) + canvasWidth / 2,
      r * Math.sin(theta) + canvasHeight / 2,
      smallestCanvasSideLength / bothChords.size / 16,
      0,
      2 * Math.PI,
    );
    canvasContext.fillStyle = isNotePlaying
      ? getCssVar("--color-accent")
      : getCssVar("--color-figure");
    canvasContext.fill();
  }
}
