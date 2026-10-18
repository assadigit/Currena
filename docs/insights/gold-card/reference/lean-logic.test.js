// Run: node lean-logic.test.js   (no dependencies)
const assert = require("assert");
const { computeLean } = require("./lean-logic.js");

const mk = (P, S, N, U) => {
  const out = []; let i = 0;
  const add = (n, s) => { for (let k = 0; k < n; k++) out.push({ id: "f" + i++, state: s }); };
  add(P, "pressures"); add(S, "supports"); add(N, "neutral"); add(U, "unread");
  return out;
};
const cases = [
  // P, S, N, U, enough, net, tilt, verdict, confidence
  [1,0,0,3,false, 1, 0,   "insufficient","low"],
  [1,0,2,1,true,  1, 3,   "slight_against","medium"],
  [2,1,1,0,true,  1, 3,   "slight_against","high"],
  [3,1,0,0,true,  2, 4.5, "lean_against","high"],
  [4,0,0,0,true,  4, 7,   "strong_against","high"],
  [2,2,0,0,true,  0, 0,   "balanced","high"],
  [0,3,0,1,true, -3, -6,  "strong_for","medium"],
  [0,0,0,4,false, 0, 0,   "none","low"],
  [2,1,1,1,true,  1, 3,   "slight_against","medium"],   // silver, total 5
  [1,1,1,2,false, 0, 0,   "insufficient","low"],        // silver, total 5
];
cases.forEach((c, i) => {
  const r = computeLean(mk(c[0], c[1], c[2], c[3]));
  assert.strictEqual(r.enough, c[4], "enough #" + (i + 1));
  assert.strictEqual(r.net, c[5], "net #" + (i + 1));
  assert.strictEqual(Math.abs(r.tilt - c[6]) < 1e-9, true, "tilt #" + (i + 1) + " got " + r.tilt);
  assert.strictEqual(r.verdict, c[7], "verdict #" + (i + 1));
  assert.strictEqual(r.confidence, c[8], "confidence #" + (i + 1));
});

// flip line
const withFlip = mk(1, 0, 2, 1); withFlip[0].value = 2.78; withFlip[0].flip = { dir: "below", at: 2.5 };
assert.strictEqual(computeLean(withFlip).flip.key, "flip_balance");
assert.strictEqual(computeLean(mk(1, 0, 2, 1)).flip, null);        // no threshold, no line
assert.strictEqual(computeLean(mk(1, 0, 0, 3)).flip, null);        // insufficient, no line
console.log("All " + (cases.length + 3) + " checks passed.");
