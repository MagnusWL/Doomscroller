// Braincell decay math. Pure functions over a plain state object — no DOM,
// no React — so the curve can be tuned and tested in isolation.

// Average human neuron count, used here as a "braincell" starting budget.
export const BRAINCELLS_START = 86_000_000_000;
export const LOSS_FRACTION_START = 0.08; // % of remaining braincells lost on the first swipe
export const LOSS_FRACTION_GROWTH = 1.3;  // that % grows 30% per swipe — empties out around swipe 10
const DEPLETED_THRESHOLD = BRAINCELLS_START * 0.005;

export function initialBrainState() {
  return { braincells: BRAINCELLS_START, lossFraction: LOSS_FRACTION_START };
}

// One swipe forward: braincells drop by the current loss fraction, then the
// fraction itself grows for next time.
export function decay(state) {
  if (state.braincells <= 0) return state;
  let braincells = state.braincells - state.braincells * state.lossFraction;
  if (braincells < DEPLETED_THRESHOLD) braincells = 0;
  const lossFraction = Math.min(1, state.lossFraction * LOSS_FRACTION_GROWTH);
  return { braincells, lossFraction };
}

export function currentSpeed(state) {
  return state.braincells * state.lossFraction;
}

export function isDepleted(state) {
  return state.braincells <= 0;
}
