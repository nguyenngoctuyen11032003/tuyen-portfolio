import { describe, expect, it } from 'vitest';
import { milestone } from './milestone';

describe('milestone', () => {
  it('fires once when rising through the threshold', () => {
    const m = milestone(0.5, 0.3);
    expect(m.update(0.1)).toBe(false);
    expect(m.update(0.49)).toBe(false);
    expect(m.update(0.5)).toBe(true);
    expect(m.update(0.7)).toBe(false);
    expect(m.update(0.9)).toBe(false);
  });

  it('re-arms only below the rearm value (hysteresis)', () => {
    const m = milestone(0.5, 0.3);
    expect(m.update(0.6)).toBe(true);
    expect(m.update(0.4)).toBe(false); // jitter around the threshold
    expect(m.update(0.6)).toBe(false);
    expect(m.update(0.2)).toBe(false); // re-arms, silently
    expect(m.update(0.55)).toBe(true);
  });

  it('sync sets the state silently', () => {
    const m = milestone(600, 450);
    m.sync(900); // deep link past the mark
    expect(m.update(1000)).toBe(false);
    m.sync(100);
    expect(m.update(700)).toBe(true);
  });
});
