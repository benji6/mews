import {
  BEATS_PER_CHORD,
  BUTTON_EL,
  NOTE_DURATION_IN_BEATS,
  SECONDS_PER_BEAT,
  TOTAL_DURATION_IN_SECONDS,
} from "./constants";
import { chordIndexToPeriod } from "./utils";

const getCssVar = (prop: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(prop).trim();

const canvas = document.querySelector("canvas");
if (!canvas) throw Error("canvas missing");
const canvasHeight = 512;
const canvasWidth = 512;
const smallestCanvasSideLength = Math.min(canvasWidth, canvasHeight);
canvas.height = canvasHeight;
canvas.width = canvasWidth;

export default function view(
  audioContext: AudioContext,
  songStartTime: number,
  chord0: number[],
  chord1: number[],
  onFinish: () => void,
) {
  if (!canvas) throw Error("canvas missing");
  const canvasContext = canvas.getContext("2d");
  if (!canvasContext) throw Error("failed to get 2d rendering context");

  const drawChord = (
    chord: number[],
    centerX: number,
    centerY: number,
    secondsElapsed: number,
    isActiveChord: boolean,
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
        (secondsElapsed / SECONDS_PER_BEAT / period) * 2 * Math.PI -
        Math.PI / 2;
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

  const animationLoop = () => {
    const secondsElapsed = audioContext.currentTime - songStartTime;
    if (secondsElapsed > TOTAL_DURATION_IN_SECONDS) {
      canvasContext.clearRect(0, 0, canvasWidth, canvasHeight);
      onFinish();
      document.body.prepend(BUTTON_EL);
      return;
    }
    requestAnimationFrame(animationLoop);
    if (secondsElapsed < 0) return;

    canvasContext.strokeStyle = getCssVar("--color-figure");
    canvasContext.clearRect(0, 0, canvasWidth, canvasHeight);

    const currentBeat = Math.floor(secondsElapsed / SECONDS_PER_BEAT);
    const isChord1Active =
      Math.floor((currentBeat / BEATS_PER_CHORD) % 2) === 1;

    drawChord(
      chord0,
      canvasWidth / 4,
      canvasHeight / 2,
      secondsElapsed,
      !isChord1Active,
    );

    drawChord(
      chord1,
      (3 * canvasWidth) / 4,
      canvasHeight / 2,
      secondsElapsed,
      isChord1Active,
    );
  };
  requestAnimationFrame(animationLoop);
}
