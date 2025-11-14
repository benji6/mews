import {
  BEATS_PER_CHORD,
  NOTE_DURATION_IN_BEATS,
  SECONDS_PER_BEAT,
} from "./constants";
import { chordIndexToPeriod } from "./utils";

const getCssVar = (prop: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(prop).trim();

export default function view(
  canvas: HTMLCanvasElement,
  canvasWidth: number,
  canvasHeight: number,
  secondsElapsed: number,
  chord0: number[],
  chord1: number[],
  analyser: AnalyserNode,
) {
  const canvasContext = canvas.getContext("2d");
  if (!canvasContext) throw Error("failed to get 2d rendering context");

  const smallestCanvasSideLength = Math.min(canvasWidth, canvasHeight);
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

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

  const drawChord = (
    chord: number[],
    centerX: number,
    centerY: number,
    isActiveChord: boolean,
    rotateClockwise: boolean,
  ) => {
    const lowestNote = Math.min(...chord);
    const highestNote = Math.max(...chord);
    const noteRange = highestNote - lowestNote;

    for (let i = 0; i < chord.length; i++) {
      const period = chordIndexToPeriod(i);

      let isNotePlaying = false;
      if (isActiveChord) {
        const timeIntoPeriod = (secondsElapsed / SECONDS_PER_BEAT) % period;
        isNotePlaying = timeIntoPeriod <= NOTE_DURATION_IN_BEATS;
      }

      const r =
        ((smallestCanvasSideLength *
          0.2 *
          (chord[i] + noteRange / 10 + Math.abs(lowestNote))) /
          noteRange) *
        1.1;

      canvasContext.beginPath();
      canvasContext.arc(centerX, centerY, r, 0, 2 * Math.PI);
      canvasContext.stroke();

      const theta =
        (rotateClockwise ? 1 : -1) *
        ((secondsElapsed / SECONDS_PER_BEAT / period) * 2 * Math.PI -
          ((rotateClockwise ? 1 : -1) * Math.PI) / 2);
      canvasContext.beginPath();
      canvasContext.arc(
        r * Math.cos(theta) + centerX,
        r * Math.sin(theta) + centerY,
        smallestCanvasSideLength / chord.length / 16,
        0,
        2 * Math.PI,
      );
      canvasContext.fillStyle = isNotePlaying
        ? getCssVar("--color-accent")
        : getCssVar("--color-figure");
      canvasContext.fill();
    }
  };

  canvasContext.strokeStyle = getCssVar("--color-figure");
  canvasContext.clearRect(0, 0, canvasWidth, canvasHeight);

  drawOscilloscope();

  const currentBeat = Math.floor(secondsElapsed / SECONDS_PER_BEAT);
  const isChord1Active = Math.floor((currentBeat / BEATS_PER_CHORD) % 2) === 1;

  drawChord(chord0, canvasWidth / 4, canvasHeight / 2, !isChord1Active, true);

  drawChord(
    chord1,
    (3 * canvasWidth) / 4,
    canvasHeight / 2,
    isChord1Active,
    false,
  );
}
