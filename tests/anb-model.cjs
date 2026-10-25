// Run: node tests/anb-model.cjs
const assert = require('node:assert/strict');
const {trace, MAX_STEPS, MAX_VALUE} = require('../anb-model.js');
assert.deepEqual(trace(1, 3, 1).values, [1n, 4n, 2n, 1n]);
assert.equal(trace(3, 3, 1).status, 'one');
assert.deepEqual(trace(1, 3, 3).values, [1n, 6n, 3n, 12n, 6n]);
assert.equal(trace(1, 3, 3).status, 'cycle');
assert.equal(trace(1, 3, 3).cycleStart, 1);
assert.equal(trace(1, 3, 3).reachedOne, true);
for (let start = 1; start <= 25; start++) {
  assert.equal(trace(start, 3, 1).status, 'one');
  assert.equal(trace(start, 3, 3).status, 'cycle');
}
let cap = 0, limit = 0, cycles = 0;
for (let a = 1; a <= 11; a++) for (let b = 1; b <= 19; b++) {
  for (let start = 1; start <= 25; start++) {
    const p = trace(start, a, b);
    if ((a + b) % 2 === 1) {
      assert.equal(p.tendsToInfinity, true);
      assert.ok(p.status === 'cap' || p.status === 'limit');
      const oddIndex = p.values.findIndex(n => n % 2n === 1n);
      assert.ok(oddIndex >= 0);
      p.values.slice(oddIndex).forEach((n, i, values) => {
        assert.equal(n % 2n, 1n);
        if (i) assert.ok(n > values[i - 1]);
      });
    } else assert.equal(p.tendsToInfinity, false);
    assert.ok(p.values.every(n => n > 0n && n <= MAX_VALUE));
    assert.ok(p.values.length - 1 <= MAX_STEPS);
    p.values.slice(1).forEach((n, i) => {
      const previous = p.values[i];
      assert.equal(n, previous % 2n === 0n ? previous / 2n : BigInt(a) * previous + BigInt(b));
    });
    if (p.status === 'cap') {
      cap++;
      const last = p.values.at(-1);
      assert.equal(p.overshoot, last % 2n === 0n ? last / 2n : BigInt(a) * last + BigInt(b));
      assert.ok(p.overshoot > MAX_VALUE);
    } else if (p.status === 'limit') {
      limit++;
      assert.equal(p.values.length - 1, MAX_STEPS);
      assert.equal(new Set(p.values).size, p.values.length);
    } else {
      cycles++;
      assert.equal(p.values.at(-1), p.values[p.cycleStart]);
      const cycle = p.values.slice(p.cycleStart, -1);
      assert.equal(new Set(cycle).size, cycle.length);
      assert.equal(p.status === 'one', cycle.includes(1n));
    }
  }
}
assert.ok(cap > 0 && limit > 0 && cycles > 0);
console.log(`PASS: all 5,225 slider/start combinations; ${cycles} cycles, ${cap} value boundaries, ${limit} step boundaries.`);
