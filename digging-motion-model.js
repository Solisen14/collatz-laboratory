/* Exact, bounded examples for the three Digging Deeper scroll scenes. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CollatzDeeperMotion = api;
})(typeof window === 'object' ? window : globalThis, function () {
  'use strict';
  function next(n) { return n % 2 === 0 ? n / 2 : 3 * n + 1; }
  function orbit(start, steps) {
    const values = [start];
    for (let k = 0; k < steps; k++) values.push(next(values[k]));
    return values;
  }
  function cycleInfo(start) {
    const seen = new Map();
    let value = start;
    for (let k = 0; k < 100; k++) {
      if (seen.has(value)) return { entry: seen.get(value), period: k - seen.get(value), firstRepeat: k };
      seen.set(value, k); value = next(value);
    }
    throw new Error('The bounded example did not close a cycle.');
  }
  function scrollStep(centres, targets, cursor) {
    if (cursor <= centres[0]) return targets[0];
    for (let i = 1; i < centres.length; i++) {
      if (cursor <= centres[i]) {
        const t = (cursor - centres[i - 1]) / Math.max(1, centres[i] - centres[i - 1]);
        return Math.round(targets[i - 1] + t * (targets[i] - targets[i - 1]));
      }
    }
    return targets[targets.length - 1];
  }
  const iterations = orbit(3, 10);
  const negative = orbit(-3, 5);
  const magnitudes = negative.map(Math.abs);
  const positive = orbit(3, 5);
  function reflectionFrame(step) {
    const k = Math.max(0, Math.min(9, Math.trunc(step)));
    return {
      negativeIndex: k <= 2 ? k : k <= 6 ? 2 : k - 4,
      magnitudeIndex: k < 3 ? -1 : k <= 6 ? 2 : k - 4,
      positiveIndex: k < 4 ? -1 : k - 4
    };
  }
  return Object.freeze({ next, orbit, cycleInfo, scrollStep, iterations, negative, magnitudes, positive, reflectionFrame });
});
