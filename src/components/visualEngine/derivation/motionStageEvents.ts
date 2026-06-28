import type gsap from "gsap";

/** Fired by the derivation timeline or replay button to start/restart the morph. */
export const MOTION_STAGE_PLAY_EVENT = "motion-stage-play";

/** Pause the active morph timeline in place. */
export const MOTION_STAGE_PAUSE_EVENT = "motion-stage-pause";

/** Resume a paused morph timeline. */
export const MOTION_STAGE_RESUME_EVENT = "motion-stage-resume";

/** Change playback speed (timeScale multiplier). */
export const MOTION_STAGE_SPEED_EVENT = "motion-stage-speed";

/** Morph playback state — used to sync control buttons. */
export const MOTION_STAGE_STATE_EVENT = "motion-stage-state";

export type MotionStageStateDetail = {
  playing: boolean;
  paused: boolean;
};

export function dispatchMotionStagePlay(stageEl: HTMLElement): void {
  stageEl.dispatchEvent(new CustomEvent(MOTION_STAGE_PLAY_EVENT));
}

export function dispatchMotionStagePause(stageEl: HTMLElement): void {
  stageEl.dispatchEvent(new CustomEvent(MOTION_STAGE_PAUSE_EVENT));
}

export function dispatchMotionStageResume(stageEl: HTMLElement): void {
  stageEl.dispatchEvent(new CustomEvent(MOTION_STAGE_RESUME_EVENT));
}

export function dispatchMotionStageSpeed(stageEl: HTMLElement, speed: number): void {
  stageEl.dispatchEvent(
    new CustomEvent(MOTION_STAGE_SPEED_EVENT, { detail: { speed } }),
  );
}

export function dispatchMotionStageState(
  stageEl: HTMLElement,
  detail: MotionStageStateDetail,
): void {
  stageEl.dispatchEvent(new CustomEvent(MOTION_STAGE_STATE_EVENT, { detail }));
}

/** Run once the wrapping ``[data-derivation-beat]`` has finished fading in. */
export function whenDerivationBeatVisible(
  stage: HTMLElement,
  run: () => void,
): () => void {
  const beat = stage.closest<HTMLElement>("[data-derivation-beat]");
  if (!beat) {
    run();
    return () => {};
  }

  let done = false;
  const tryRun = () => {
    if (done) return true;
    const opacity = Number.parseFloat(getComputedStyle(beat).opacity);
    if (opacity >= 0.99) {
      done = true;
      run();
      return true;
    }
    return false;
  };

  if (tryRun()) return () => {};

  const interval = window.setInterval(() => {
    if (tryRun()) window.clearInterval(interval);
  }, 40);
  const timeout = window.setTimeout(() => {
    if (!done) {
      done = true;
      run();
    }
    window.clearInterval(interval);
  }, 4000);

  return () => {
    window.clearInterval(interval);
    window.clearTimeout(timeout);
  };
}

/** Wire play / pause / resume / speed listeners on a motion-stage root element. */
export function bindMotionStageControls(
  stage: HTMLElement,
  handlers: {
    play: () => void;
    getTimeline: () => gsap.core.Timeline | null;
    /** Persist the chosen speed so replays keep it. */
    setSpeed?: (speed: number) => void;
    /** Auto-play once the stage scrolls into view (standalone demos only). Default false. */
    autoPlayOnView?: boolean;
  },
): () => void {
  const emit = (detail: MotionStageStateDetail) =>
    dispatchMotionStageState(stage, detail);

  const onPlay = () => {
    handlers.play();
  };

  const onPause = () => {
    const timeline = handlers.getTimeline();
    if (!timeline || timeline.progress() >= 1) return;
    timeline.pause();
    emit({ playing: true, paused: true });
  };

  const onResume = () => {
    const timeline = handlers.getTimeline();
    if (!timeline || timeline.progress() >= 1) return;
    timeline.resume();
    emit({ playing: true, paused: false });
  };

  const onSpeed = (event: Event) => {
    const speed = (event as CustomEvent<{ speed?: number }>).detail?.speed;
    if (typeof speed !== "number" || !Number.isFinite(speed) || speed <= 0) return;
    handlers.setSpeed?.(speed);
    const timeline = handlers.getTimeline();
    if (timeline) timeline.timeScale(speed);
  };

  stage.addEventListener(MOTION_STAGE_PLAY_EVENT, onPlay);
  stage.addEventListener(MOTION_STAGE_PAUSE_EVENT, onPause);
  stage.addEventListener(MOTION_STAGE_RESUME_EVENT, onResume);
  stage.addEventListener(MOTION_STAGE_SPEED_EVENT, onSpeed);

  // Reliable autoplay: play once the stage is on screen, independent of any
  // externally dispatched play event (which can be missed). This mirrors the
  // katex simulator, which simply autoplays.
  let autoPlayed = false;
  const autoPlay = () => {
    if (autoPlayed) return;
    autoPlayed = true;
    handlers.play();
  };

  let observer: IntersectionObserver | null = null;
  let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

  if (handlers.autoPlayOnView === true) {
    if (typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              autoPlay();
              observer?.disconnect();
              observer = null;
              break;
            }
          }
        },
        { threshold: 0.2 },
      );
      observer.observe(stage);
      // Safety net in case the observer never fires (e.g. hidden ancestor).
      fallbackTimer = setTimeout(autoPlay, 1200);
    } else {
      fallbackTimer = setTimeout(autoPlay, 200);
    }
  }

  return () => {
    stage.removeEventListener(MOTION_STAGE_PLAY_EVENT, onPlay);
    stage.removeEventListener(MOTION_STAGE_PAUSE_EVENT, onPause);
    stage.removeEventListener(MOTION_STAGE_RESUME_EVENT, onResume);
    stage.removeEventListener(MOTION_STAGE_SPEED_EVENT, onSpeed);
    observer?.disconnect();
    if (fallbackTimer) clearTimeout(fallbackTimer);
  };
}
