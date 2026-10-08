export interface Milestone {
  /** true exactly once when value rises to >= `on` while armed. Re-arms when value < `rearm`. */
  update(value: number): boolean;
  /** Silently set the state from the current value: armed = value < on. */
  sync(value: number): void;
}

/** Threshold crossing with hysteresis, for scroll-driven one-shot sounds. */
export function milestone(on: number, rearm: number): Milestone {
  let armed = true;
  return {
    update(value) {
      if (!armed) {
        if (value < rearm) armed = true;
        return false;
      }
      if (value >= on) {
        armed = false;
        return true;
      }
      return false;
    },
    sync(value) {
      armed = value < on;
    },
  };
}
