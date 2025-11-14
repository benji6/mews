import audio from "./audio";
import {
  BEATS,
  BEATS_PER_CHORD,
  BUTTON_EL,
  SECONDS_PER_BEAT,
  TOTAL_DURATION_IN_SECONDS,
} from "./constants";
import { chordIndexToPeriod, sortedDefaultDict } from "./utils";
import view from "./view";

export default function controller(chord0: number[], chord1: number[]) {
  let audioContext: AudioContext;

  BUTTON_EL.onclick = () => {
    BUTTON_EL.remove();
    if (!audioContext) audioContext = new AudioContext();
    const masterGain = new GainNode(audioContext, { gain: 0.1 });
    masterGain.connect(audioContext.destination);
    const songStartTime = audioContext.currentTime + 0.1;

    const score = sortedDefaultDict(Array<number>);

    for (let j = 0; j < BEATS; j++) {
      if (Math.floor((j / BEATS_PER_CHORD) % 2))
        for (let i = 0; i < chord1.length; i++) {
          const noteStartTime =
            songStartTime + j * chordIndexToPeriod(i) * SECONDS_PER_BEAT;
          if (noteStartTime >= songStartTime + TOTAL_DURATION_IN_SECONDS) break;
          score[noteStartTime].push(chord1[i]);
        }
      else
        for (let i = 0; i < chord0.length; i++) {
          const noteStartTime =
            songStartTime + j * chordIndexToPeriod(i) * SECONDS_PER_BEAT;
          if (noteStartTime >= songStartTime + TOTAL_DURATION_IN_SECONDS) break;
          score[noteStartTime].push(chord0[i]);
        }
    }

    const canvas = document.querySelector("canvas");
    if (!canvas) throw Error("canvas missing");

    const { analyser, filter } = audio(audioContext, masterGain, score);

    const handlePointerMove = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      const normalizedX = Math.max(0, Math.min(1, x / rect.width));
      filter.frequency.value = 20 + normalizedX ** 2 * 4000;

      const normalizedY = Math.max(0, Math.min(1, 1 - y / rect.height));
      filter.Q.value = normalizedY * 36;
    };

    canvas.onmousemove = (e) => handlePointerMove(e.clientX, e.clientY);

    canvas.addEventListener(
      "touchmove",
      (e) => {
        e.preventDefault();
        if (e.touches.length)
          handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      },
      { passive: false },
    );

    let canvasWidth = 512;
    let canvasHeight = 512;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    document.addEventListener("fullscreenchange", () => {
      if (document.fullscreenElement === canvas) {
        canvasWidth = window.screen.width;
        canvasHeight = window.screen.height;
      } else {
        canvasWidth = 512;
        canvasHeight = 512;
      }
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
    });

    canvas.addEventListener("click", () => {
      if (document.fullscreenElement) {
        document.exitFullscreen();
        return;
      }
      canvas.requestFullscreen();
    });

    canvas.hidden = false;

    const animationLoop = () => {
      const secondsElapsed = audioContext.currentTime - songStartTime;
      if (secondsElapsed > TOTAL_DURATION_IN_SECONDS) {
        canvas.hidden = true;
        if (document.fullscreenElement) document.exitFullscreen();
        masterGain.disconnect();
        document.body.prepend(BUTTON_EL);
        return;
      }
      requestAnimationFrame(animationLoop);
      if (secondsElapsed < 0) return;

      view(
        canvas,
        canvasWidth,
        canvasHeight,
        secondsElapsed,
        score,
        audioContext.currentTime,
        chord0,
        chord1,
        analyser,
      );
    };

    requestAnimationFrame(animationLoop);
  };
}
