/* Exact, finite trajectories for the generalized Collatz experiment. */
(function (root, factory) {
  const model = factory();
  if (typeof module === 'object' && module.exports) module.exports = model;
  else root.CollatzExperiment = model;
})(typeof window === 'undefined' ? globalThis : window, function () {
  'use strict';
  const MAX_STEPS = 200;
  const MAX_VALUE = 1000000000000n;
  function trace(start, a, b) {
    const values = [BigInt(start)];
    const seen = new Map([[values[0], 0]]);
    let status = 'limit', cycleStart = null, overshoot = null;
    const aBig = BigInt(a), bBig = BigInt(b);
    while (values.length - 1 < MAX_STEPS) {
      const n = values[values.length - 1];
      const next = n % 2n === 0n ? n / 2n : aBig * n + bBig;
      if (next > MAX_VALUE) {
        status = 'cap'; overshoot = next; break;
      }
      values.push(next);
      if (seen.has(next)) {
        cycleStart = seen.get(next);
        status = values.slice(cycleStart, -1).includes(1n) ? 'one' : 'cycle';
        break;
      }
      seen.set(next, values.length - 1);
    }
    const peak = values.reduce((best, value) => value > best ? value : best, 0n);
    // If a+b is odd, odd inputs stay odd and strictly increase (a,b >= 1).
    // Every positive integer reaches an odd value after finitely many halvings.
    return {start, values, status, cycleStart, overshoot, peak,
      reachedOne: values.includes(1n), tendsToInfinity: (a + b) % 2 === 1};
  }
  return {trace, MAX_STEPS, MAX_VALUE};
});
