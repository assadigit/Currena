// Reference implementation of the gold/silver card rules (spec file 03).
// Pure function: no DOM, no fetch. Port to the repo's language if needed.

// ===== CONFIGURATION =====
const MIN_COVERAGE = 0.75;   // share of drivers that must be readable before the beam tilts
const MIN_TILT_DEG = 3;      // tilt for a net lean of 1
const STEP_TILT_DEG = 1.5;   // extra degrees per extra net point
const MAX_TILT_DEG = 7;      // hard cap
// =========================

function computeLean(factors) {
  const total = factors.length;
  const count = (s) => factors.filter((f) => f.state === s).length;
  const S = count("supports"), P = count("pressures"), N = count("neutral"), U = count("unread");
  const read = total - U;
  const need = Math.ceil(MIN_COVERAGE * total);
  const enough = read >= need;
  const net = P - S;
  const mag = enough && net !== 0
    ? Math.min(MAX_TILT_DEG, MIN_TILT_DEG + STEP_TILT_DEG * (Math.abs(net) - 1))
    : 0;
  const tilt = Math.sign(net) * mag;
  const coverage = total === 0 ? 0 : read / total;
  const confidence = coverage === 1 ? "high" : coverage >= MIN_COVERAGE ? "medium" : "low";

  let verdict;
  if (read === 0) verdict = "none";
  else if (!enough) verdict = "insufficient";
  else if (net === 0) verdict = "balanced";
  else {
    const side = net > 0 ? "against" : "for";
    const strength = Math.abs(net) === 1 ? "slight" : Math.abs(net) === 2 ? "lean" : "strong";
    verdict = strength + "_" + side;
  }

  let flip = null;
  if (enough && net !== 0) {
    const heavier = factors.filter((f) => f.state === (net > 0 ? "pressures" : "supports") &&
      f.flip && typeof f.value === "number");
    heavier.sort((a, b) =>
      Math.abs(a.value - a.flip.at) / Math.max(Math.abs(a.flip.at), 1e-9) -
      Math.abs(b.value - b.flip.at) / Math.max(Math.abs(b.flip.at), 1e-9));
    if (heavier.length) {
      flip = { factorId: heavier[0].id, dir: heavier[0].flip.dir, at: heavier[0].flip.at,
               key: Math.abs(net) === 1 ? "flip_balance" : "flip_ease" };
    }
  }
  return { total, S, P, N, U, read, need, enough, net, tilt, coverage, confidence, verdict, flip };
}

if (typeof module !== "undefined") module.exports = { computeLean, MIN_COVERAGE };
