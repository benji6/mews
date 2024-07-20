import {
  BUTTON_EL,
  SECONDS_PER_BEAT,
  TOTAL_DURATION_IN_SECONDS,
} from "./constants";

export default function view(
  ctx: AudioContext,
  songStartTime: number,
  notesAndPeriods: Map<number, number>,
  onFinish: () => void,
) {
  const div = document.querySelector("div");
  if (!div) throw Error("div missing");

  const animationLoop = () => {
    const secondsElapsed = ctx.currentTime - songStartTime;
    if (secondsElapsed > TOTAL_DURATION_IN_SECONDS) {
      div.innerText = "";
      onFinish();
      document.body.append(BUTTON_EL);
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
}
