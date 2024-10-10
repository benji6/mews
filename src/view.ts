import {
  BUTTON_EL,
  SECONDS_PER_BEAT,
  TOTAL_DURATION_IN_SECONDS,
} from "./constants";
import { chordIndexToPeriod } from "./utils";

const getCssVar = (prop: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(prop).trim();

const div = document.querySelector("div");
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
  if (!div) throw Error("div missing");
  if (!canvas) throw Error("canvas missing");
  const canvasContext = canvas.getContext("2d");
  if (!canvasContext) throw Error("failed to get 2d rendering context");

  const animationLoop = () => {
    const secondsElapsed = audioContext.currentTime - songStartTime;
    const chord =
      secondsElapsed < TOTAL_DURATION_IN_SECONDS / 2 ? chord0 : chord1;
    if (secondsElapsed > TOTAL_DURATION_IN_SECONDS) {
      div.innerText = "";
      canvasContext.clearRect(0, 0, canvasWidth, canvasHeight);
      onFinish();
      document.body.prepend(BUTTON_EL);
      return;
    }
    requestAnimationFrame(animationLoop);
    if (secondsElapsed < 0) return;

    let display = "";
    canvasContext.strokeStyle = getCssVar("--color-figure");
    canvasContext.clearRect(0, 0, canvasWidth, canvasHeight);

    const lowestNote = Math.min(...chord);
    const highestNote = Math.max(...chord);
    const noteRange = highestNote - lowestNote;

    for (let i = 0; i < chord.length; i++) {
      const period = chordIndexToPeriod(i);
      const isNotePlaying = (secondsElapsed / SECONDS_PER_BEAT) % period <= 1;
      display += isNotePlaying ? "*" : "_";
      const r =
        ((smallestCanvasSideLength *
          0.4 *
          (chord[i] + noteRange / 10 + Math.abs(lowestNote))) /
          noteRange) *
        1.1;

      canvasContext.beginPath();
      canvasContext.arc(canvasWidth / 2, canvasHeight / 2, r, 0, 2 * Math.PI);
      canvasContext.stroke();

      const theta =
        (secondsElapsed / SECONDS_PER_BEAT / period) * 2 * Math.PI -
        Math.PI / 2;
      canvasContext.beginPath();
      canvasContext.arc(
        r * Math.cos(theta) + canvasWidth / 2,
        r * Math.sin(theta) + canvasHeight / 2,
        smallestCanvasSideLength / chord.length / 8,
        0,
        2 * Math.PI,
      );
      canvasContext.fillStyle = isNotePlaying
        ? getCssVar("--color-accent")
        : getCssVar("--color-figure");
      canvasContext.fill();
    }

    div.textContent = display;
  };
  requestAnimationFrame(animationLoop);
}
