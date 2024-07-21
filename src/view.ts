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

    canvasContext.clearRect(0, 0, canvasWidth, canvasHeight);

    let display = "";
    const periods = [...notesAndPeriods.values()];
    for (let i = 0; i < periods.length; i++) {
      const period = periods[i];
      const isNotePlaying = (secondsElapsed / SECONDS_PER_BEAT) % period <= 1;
      display += isNotePlaying ? "*" : "_";

      canvasContext.beginPath();
      canvasContext.arc(
        canvasWidth / 2,
        canvasHeight / 2,
        ((smallestCanvasSideLength / 3) * (i + 1)) / periods.length,
        0,
        2 * Math.PI,
      );
      canvasContext.stroke();

      const r = ((smallestCanvasSideLength / 3) * (i + 1)) / periods.length;
      const theta =
        (secondsElapsed / SECONDS_PER_BEAT / period) * 2 * Math.PI -
        Math.PI / 2;
      canvasContext.beginPath();
      canvasContext.arc(
        r * Math.cos(theta) + canvasWidth / 2,
        r * Math.sin(theta) + canvasHeight / 2,
        smallestCanvasSideLength / periods.length / 8,
        0,
        2 * Math.PI,
      );
      canvasContext.fillStyle = isNotePlaying ? "red" : "black";
      canvasContext.fill();
    }

    div.textContent = display;
  };
  requestAnimationFrame(animationLoop);
}
