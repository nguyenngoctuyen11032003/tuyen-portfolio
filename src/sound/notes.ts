/** Note frequencies (Hz). Key: D Lydian (D E F# G# A B C#). */
export const NOTE = {
  D2: 73.42,
  A2: 110.0,
  D3: 146.83,
  A3: 220.0,
  D4: 293.66,
  E4: 329.63,
  Fs4: 369.99,
  Gs4: 415.3,
  A4: 440.0,
  B4: 493.88,
  Cs5: 554.37,
  D5: 587.33,
  E5: 659.26,
  Fs5: 739.99,
  A5: 880.0,
  B5: 987.77,
  Cs6: 1108.73,
  D6: 1174.66,
  E6: 1318.51,
  Gs6: 1661.22,
  A6: 1760.0,
  Cs7: 2217.46,
  E7: 2637.02,
} as const;

/** D major pentatonic (D E F# A B), semitones above D. */
export const PENTA = [0, 2, 4, 7, 9] as const;

/** step 0 = D5, step 5 = D6, step -5 = D4. Negative and fractional-free integers expected. */
export function stepFreq(step: number): number {
  const s = Math.round(step);
  const oct = Math.floor(s / 5);
  const deg = ((s % 5) + 5) % 5;
  return NOTE.D5 * Math.pow(2, oct + PENTA[deg] / 12);
}
