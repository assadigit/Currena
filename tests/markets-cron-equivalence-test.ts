// The offline equivalence proof: the original string dispatch vs the
// patched time dispatch, over every minute of a full week.
const OLD_CRONS: Array<{ expr: string; job: "main" | "retry" | "au" }> = [
  { expr: "30 23 * * 1-5", job: "main" },   // MAIN_CRON
  { expr: "30 1 * * 2-6", job: "retry" },   // RETRY_CRON
  { expr: "50 8 * * 2-6", job: "retry" },   // ASIA_CRON
  { expr: "0 7 * * 1-5", job: "au" },       // AU_CRON
];
function oldDispatch(d: Date): string | null {
  // evaluate the four fixed expressions (minute hour dom month dow)
  for (const c of OLD_CRONS) {
    const [m, h, , , dow] = c.expr.split(" ");
    const mins = m.split(",").map(Number); const hours = h.split(",").map(Number);
    const [d1, d2] = dow.split("-").map(Number);
    if (mins.includes(d.getUTCMinutes()) && hours.includes(d.getUTCHours()) &&
        d.getUTCDay() >= d1 && d.getUTCDay() <= d2) return c.job;
  }
  return null;
}
function newDispatch(d: Date): string | null {
  const dow = d.getUTCDay(), hh = d.getUTCHours(), mm = d.getUTCMinutes();
  const monToFri = dow >= 1 && dow <= 5;
  const tueToSat = dow >= 2 && dow <= 6;
  if (monToFri && hh === 23 && mm === 30) return "main";
  if (tueToSat && hh === 1 && mm === 30) return "retry";
  if (tueToSat && hh === 8 && mm === 50) return "retry";
  if (monToFri && hh === 7 && mm === 0) return "au";
  return null;
}
// the covering expression's own fires
function coveringFires(d: Date): boolean {
  const mins = [0, 30, 50], hours = [1, 7, 8, 23];
  return mins.includes(d.getUTCMinutes()) && hours.includes(d.getUTCHours());
}
let mismatches = 0, checked = 0, coveringTotal = 0, coveringNoop = 0;
const t0 = Date.UTC(2026, 10, 23, 0, 0, 0); // Mon 2026-11-23, a full week
for (let t = t0; t < t0 + 7 * 86400_000; t += 60_000) {
  const d = new Date(t);
  checked++;
  const o = oldDispatch(d), n = newDispatch(d);
  if (o !== n) { mismatches++; if (mismatches < 5) console.log("MISMATCH", d.toISOString(), o, n); }
  if (coveringFires(d)) {
    coveringTotal++;
    if (n === null) coveringNoop++;
    if (!coveringFires(d) && o !== null) { /* unreachable */ }
  }
  // every OLD fire time must be covered by the covering expression
  if (o !== null && !coveringFires(d)) { console.log("UNCOVERED OLD FIRE", d.toISOString(), o); mismatches++; }
}
console.log(`minutes checked: ${checked}`);
console.log(`dispatch mismatches: ${mismatches}`);
console.log(`covering-cron fires in the week: ${coveringTotal} (real jobs ${coveringTotal - coveringNoop}, logged no-ops ${coveringNoop})`);
console.log(mismatches === 0 ? "EQUIVALENT — the patched dispatch reproduces the original at every minute of the week, and every original fire is covered" : "FAILED");
if (mismatches > 0) process.exit(1);
