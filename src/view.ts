import {
  BUTTON_EL,
  SECONDS_PER_BEAT,
  TOTAL_DURATION_IN_SECONDS,
} from "./constants";

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
  notesAndPeriods: Map<number, number>,
  onFinish: () => void,
) {
  if (!div) throw Error("div missing");
  if (!canvas) throw Error("canvas missing");
  const canvasContext = canvas.getContext("2d");
  if (!canvasContext) throw Error("failed to get 2d rendering context");

  const animationLoop = () => {
    const secondsElapsed = audioContext.currentTime - songStartTime;
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
    canvasContext.clearRect(0, 0, canvasWidth, canvasHeight);

    const notes = [...notesAndPeriods.keys()];
    const lowestNote = Math.min(...notes);
    const highestNote = Math.max(...notes);
    const noteRange = highestNote - lowestNote;

    [...notesAndPeriods.entries()].forEach(([note, period], i, { length }) => {
      const isNotePlaying = (secondsElapsed / SECONDS_PER_BEAT) % period <= 1;
      display += isNotePlaying ? "*" : "_";
      const r =
        ((smallestCanvasSideLength *
          0.4 *
          (note + noteRange / 10 + Math.abs(lowestNote))) /
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
        smallestCanvasSideLength / length / 8,
        0,
        2 * Math.PI,
      );
      canvasContext.fillStyle = isNotePlaying ? "red" : "black";
      canvasContext.fill();
    });

    div.textContent = display;
  };
  requestAnimationFrame(animationLoop);
}
